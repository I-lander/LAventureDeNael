import argparse
import json
import os
from collections import Counter

from PIL import Image

from ref_extract import cells_tile, cluster_report, hue_name, reference_tile
from spritelib import BACKGROUND, EMPTY, labelled_sheet

import numpy as np

SYMBOLS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'


def parse_hex(text):
    value = text.lstrip('#')
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4))


def perceptual_distance(first, second):
    mean_red = (first[0] + second[0]) / 2
    delta_red = first[0] - second[0]
    delta_green = first[1] - second[1]
    delta_blue = first[2] - second[2]
    return (((512 + mean_red) * delta_red * delta_red) / 256 + 4 * delta_green * delta_green + ((767 - mean_red) * delta_blue * delta_blue) / 256) ** 0.5


def load_cells(path):
    with open(path, encoding='utf-8') as handle:
        payload = json.load(handle)
    for sprite in payload['sprites']:
        sprite['cells'] = [[parse_hex(cell) if cell else None for cell in line] for line in sprite['rows']]
    return payload


def auto_palette(payload, indices, prefix, threshold):
    colors = [cell for index in indices for line in payload['sprites'][index]['cells'] for cell in line if cell is not None]
    entries = []
    seen = Counter()
    for position, (color, count) in enumerate(cluster_report(colors, threshold)):
        if count < 2:
            continue
        name = hue_name(color)
        seen[name] += 1
        entries.append({'symbol': SYMBOLS[len(entries)], 'key': f'{prefix}{name.capitalize()}{seen[name]}', 'hex': '#%02x%02x%02x' % color, 'cells': count})
    return {'colors': entries}


def quantize(cells, palette_colors):
    rows = []
    poor = []
    for y, line in enumerate(cells):
        row = ''
        for x, color in enumerate(line):
            if color is None:
                row += EMPTY
                continue
            symbol, target = min(palette_colors, key=lambda item: perceptual_distance(color, item[1]))
            distance = perceptual_distance(color, target)
            if distance > 60:
                poor.append((x, y, '#%02x%02x%02x' % color, symbol, round(distance)))
            row += symbol
        rows.append(row)
    return rows, poor


def quantized_tile(rows, by_symbol, scale):
    tile = Image.new('RGB', (len(rows[0]), len(rows)), BACKGROUND)
    for y, row in enumerate(rows):
        for x, symbol in enumerate(row):
            if symbol != EMPTY:
                tile.putpixel((x, y), by_symbol[symbol])
    return tile.resize((tile.width * scale, tile.height * scale), Image.NEAREST)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cells', required=True)
    parser.add_argument('--palette', required=True)
    parser.add_argument('--sprites', required=True)
    parser.add_argument('--legend', default='LEGEND')
    parser.add_argument('--out', required=True)
    parser.add_argument('--auto', default='')
    parser.add_argument('--auto-threshold', type=float, default=30)
    parser.add_argument('--scale', type=int, default=10)
    arguments = parser.parse_args()

    payload = load_cells(arguments.cells)
    picks = []
    for item in arguments.sprites.split(','):
        index, name = item.split('=')
        picks.append((int(index), name))

    if arguments.auto:
        if os.path.exists(arguments.palette):
            raise SystemExit(f'{arguments.palette} already exists, remove --auto or choose another file')
        palette = auto_palette(payload, [index for index, _ in picks], arguments.auto, arguments.auto_threshold)
        with open(arguments.palette, 'w', encoding='utf-8') as handle:
            json.dump(palette, handle, indent=1)
        print('wrote automatic palette', arguments.palette, len(palette['colors']), 'colors')
    with open(arguments.palette, encoding='utf-8') as handle:
        palette = json.load(handle)
    palette_colors = [(entry['symbol'], parse_hex(entry['hex'])) for entry in palette['colors']]
    by_symbol = dict(palette_colors)
    if len(by_symbol) != len(palette_colors):
        raise SystemExit('duplicate symbol in palette')

    array = np.array(Image.open(payload['image']).convert('RGB'))
    source = "import type { PixelGrid, PixelLegend } from '../../../game/elements';\n\n"
    used = Counter()
    tiles = []
    for index, name in picks:
        sprite = payload['sprites'][index]
        rows, poor = quantize(sprite['cells'], palette_colors)
        for row in rows:
            used.update(symbol for symbol in row if symbol != EMPTY)
        body = '\n'.join(f"  '{row}'," for row in rows)
        source += f'export const {name}: PixelGrid = [\n{body}\n];\n\n'
        colors = len({symbol for row in rows for symbol in row if symbol != EMPTY})
        print(f'{name}: {len(rows[0])}x{len(rows)}, {colors} colors, {len(poor)} poorly matched cells')
        for x, y, color, symbol, distance in poor[:12]:
            print(f'   cell {x},{y} {color} -> {symbol} (distance {distance})')
        tiles.append((f'{name} ref', reference_tile(array, sprite, arguments.scale, False)))
        tiles.append((f'{name} cells', cells_tile(sprite, arguments.scale)))
        tiles.append((f'{name} quantized', quantized_tile(rows, by_symbol, arguments.scale)))
    legend_lines = '\n'.join(f"  '{entry['symbol']}': '{entry['key']}'," for entry in palette['colors'] if used[entry['symbol']])
    source += f'export const {arguments.legend}: PixelLegend = {{\n{legend_lines}\n}};\n'
    palette_lines = '\n'.join(f"  {entry['key']}: 0x{entry['hex'].lstrip('#')}," for entry in palette['colors'] if used[entry['symbol']])
    os.makedirs(os.path.dirname(os.path.abspath(arguments.out)), exist_ok=True)
    with open(arguments.out + '.ts.txt', 'w', encoding='utf-8', newline='\n') as handle:
        handle.write(source)
    with open(arguments.out + '-palette.ts.txt', 'w', encoding='utf-8', newline='\n') as handle:
        handle.write(palette_lines + '\n')
    labelled_sheet(tiles, columns=3).save(arguments.out + '.png')
    unused = [entry['symbol'] for entry in palette['colors'] if not used[entry['symbol']]]
    print('symbol usage', dict(used.most_common()))
    if unused:
        print('unused palette symbols', unused)
    print('wrote', arguments.out + '.ts.txt', arguments.out + '-palette.ts.txt', arguments.out + '.png')


if __name__ == '__main__':
    main()
