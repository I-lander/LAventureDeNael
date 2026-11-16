import argparse
import json
import os
from collections import Counter

import numpy as np
from PIL import Image, ImageDraw

from house_patches import PATCHES, SETTINGS
from spritelib import BACKGROUND, EMPTY, labelled_sheet, luminance, outside_mask

FOLDER = 'art-references/v4/house'
ART_FILE = 'src/tools/spriteBaker/half/HouseHalf.ts'
PALETTE_FILE = 'src/game/elements/halfPalette/HousePalette.ts'

PALETTE = [
    ('k', 'houseInk', '0c060b'),
    ('n', 'houseNight', '1e2236'),
    ('a', 'houseWoodShade', '40201c'),
    ('b', 'houseWoodDark', '62352a'),
    ('c', 'houseWoodMid', '814b33'),
    ('d', 'houseWoodBase', '9f6039'),
    ('e', 'houseWoodLight', 'b97a4b'),
    ('s', 'houseStoneDeep', '3d3d4a'),
    ('t', 'houseStoneDark', '5f5c69'),
    ('u', 'houseStoneMid', '89858a'),
    ('v', 'houseStoneLight', 'a69f96'),
    ('h', 'houseStrawDark', 'b06f1f'),
    ('i', 'houseStrawMid', 'd99c3b'),
    ('j', 'houseStrawLight', 'f6c44c'),
    ('p', 'housePlaster', 'e6e1d5'),
    ('q', 'houseWallShade', 'c4a284'),
    ('r', 'houseCream', 'ecdead'),
    ('w', 'houseSlateDeep', '27406a'),
    ('x', 'houseSlateDark', '3a5880'),
    ('y', 'houseSlateBase', '4d6f95'),
    ('z', 'houseSlateLight', '6289b6'),
    ('g', 'houseGlass', '4a94cc'),
    ('A', 'houseSnow', 'e4f2f5'),
    ('B', 'houseSnowMid', 'c5dcea'),
    ('C', 'houseSnowShade', 'a4c6df'),
    ('Y', 'houseGlow', 'fde85a'),
    ('F', 'houseFlame', 'fd9704'),
    ('O', 'houseCurtain', 'e26a08'),
    ('D', 'houseAdobe', 'dcbc83'),
    ('E', 'houseClayPale', 'c88f62'),
    ('H', 'houseClayLight', 'e08051'),
    ('I', 'houseClayDark', 'b24c33'),
    ('J', 'houseClayDeep', '8f3f30'),
    ('1', 'houseRoofLight', 'd65c4a'),
    ('2', 'houseRoofBase', 'c93f38'),
    ('3', 'houseRoofShade', 'a02e2d'),
    ('4', 'houseRoofDark', '7d2029'),
    ('5', 'houseRoofDeep', '4a1414'),
    ('M', 'houseMaroonLight', '7a3540'),
    ('N', 'houseMaroonBase', '632534'),
    ('P', 'houseLeafLight', '76904a'),
    ('Q', 'houseLeafBase', '598143'),
    ('R', 'houseLeafMid', '456a40'),
    ('S', 'houseLeafDark', '2f4c34'),
    ('T', 'houseLeafDeep', '1c3020'),
    ('U', 'houseMossLight', 'b7a450'),
    ('V', 'houseMossBase', '8f8339'),
    ('W', 'houseMossDark', '646230'),
    ('X', 'houseMossDeep', '453f18'),
]

ROOF_SPLIT = {'1': '6', '2': '7', '3': '8', '4': '9', '5': '0'}
ROOF_VARIANTS = {
    'SHOP_RED_LEGEND': [('houseRoofLight', None), ('houseRoofBase', None), ('houseRoofShade', None), ('houseRoofDark', None), ('houseRoofDeep', None)],
    'SHOP_PURPLE_LEGEND': [
        ('houseRoofPurpleLight', 'a468dc'),
        ('houseRoofPurpleBase', '8846c4'),
        ('houseRoofPurpleShade', '67309e'),
        ('houseRoofPurpleDark', '4a2278'),
        ('houseRoofPurpleDeep', '2a1248'),
    ],
    'SHOP_GOLD_LEGEND': [
        ('houseRoofGoldLight', 'f8d868'),
        ('houseRoofGoldBase', 'e6ae34'),
        ('houseRoofGoldShade', 'bc7f20'),
        ('houseRoofGoldDark', '8c5616'),
        ('houseRoofGoldDeep', '4c2c0e'),
    ],
}

SPRITES = ['HOUSE_THATCH', 'HOUSE_STONE', 'HOUSE_CABIN', 'HOUSE_ADOBE', 'HOUSE_STILT', 'HOUSE_FORGE', 'SHOP_HOUSE']


def parse_hex(text):
    return tuple(int(text[index:index + 2], 16) for index in (0, 2, 4))


COLOR_OF = {symbol: parse_hex(value) for symbol, _, value in PALETTE}
KEY_OF = {symbol: key for symbol, key, _ in PALETTE}


def label_pixels(region, symbols):
    pixels = region.astype(np.float64)
    best_distance = np.full(region.shape[:2], 1e18)
    best_index = np.zeros(region.shape[:2], dtype=int)
    for index, symbol in enumerate(symbols):
        color = COLOR_OF[symbol]
        mean_red = (pixels[:, :, 0] + color[0]) / 2
        delta_red = pixels[:, :, 0] - color[0]
        delta_green = pixels[:, :, 1] - color[1]
        delta_blue = pixels[:, :, 2] - color[2]
        distance = ((512 + mean_red) * delta_red ** 2) / 256 + 4 * delta_green ** 2 + ((767 - mean_red) * delta_blue ** 2) / 256
        closer = distance < best_distance
        best_distance[closer] = distance[closer]
        best_index[closer] = index
    return best_index


def sample_votes(array, sprite, symbols, weights):
    xs = [int(round(value)) for value in sprite['xs']]
    ys = [int(round(value)) for value in sprite['ys']]
    left, top = xs[0], ys[0]
    labels = label_pixels(array[top:ys[-1], left:xs[-1]], symbols)
    grid = []
    for row, line in enumerate(sprite['rows']):
        cells = []
        for column, value in enumerate(line):
            if value is None:
                cells.append(EMPTY)
                continue
            block = labels[ys[row] - top:ys[row + 1] - top, xs[column] - left:xs[column + 1] - left]
            height, width = block.shape
            votes = Counter()
            for y in range(height):
                for x in range(width):
                    central = 0 < x < width - 1 and 0 < y < height - 1
                    symbol = symbols[block[y, x]]
                    votes[symbol] += (2.0 if central else 1.0) * weights.get(symbol, 1.0)
            cells.append(votes.most_common(1)[0][0])
        grid.append(cells)
    return grid


def neighbours8(x, y):
    return [(x + dx, y + dy) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dx or dy]


def neighbours4(x, y):
    return [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]


def at(grid, x, y):
    if 0 <= y < len(grid) and 0 <= x < len(grid[0]):
        return grid[y][x]
    return EMPTY


def despeckle(grid, keep):
    changed = 0
    result = [list(row) for row in grid]
    for y, row in enumerate(grid):
        for x, symbol in enumerate(row):
            if symbol == EMPTY or symbol in keep:
                continue
            around = [at(grid, nx, ny) for nx, ny in neighbours8(x, y)]
            if symbol in around:
                continue
            close = Counter(value for value in (at(grid, nx, ny) for nx, ny in neighbours4(x, y)) if value != EMPTY)
            if not close:
                continue
            result[y][x] = close.most_common(1)[0][0]
            changed += 1
    return result, changed


def fill_holes(grid):
    opaque = [[symbol != EMPTY for symbol in row] for row in grid]
    outside = outside_mask(opaque)
    filled = 0
    for y, row in enumerate(grid):
        for x, symbol in enumerate(row):
            if symbol == EMPTY and not outside[y][x]:
                grid[y][x] = 'k'
                filled += 1
    return filled


def fill_notches(grid):
    filled = 0
    changed = True
    while changed:
        changed = False
        for y, row in enumerate(grid):
            for x, symbol in enumerate(row):
                if symbol != EMPTY:
                    continue
                if sum(1 for nx, ny in neighbours4(x, y) if at(grid, nx, ny) != EMPTY) >= 3:
                    grid[y][x] = 'k'
                    filled += 1
                    changed = True
    return filled


def edge_cells(grid):
    opaque = [[symbol != EMPTY for symbol in row] for row in grid]
    outside = outside_mask(opaque)
    height, width = len(grid), len(grid[0])
    cells = []
    for y in range(height):
        for x in range(width):
            if not opaque[y][x]:
                continue
            for nx, ny in neighbours4(x, y):
                if not (0 <= nx < width and 0 <= ny < height) or outside[ny][nx]:
                    cells.append((x, y))
                    break
    return cells


def ink_outline(grid):
    changed = 0
    for x, y in edge_cells(grid):
        if grid[y][x] != 'k':
            grid[y][x] = 'k'
            changed += 1
    return changed


def apply_patches(grid, operations):
    for operation in operations:
        kind = operation[0]
        if kind == 'rect':
            _, x0, y0, x1, y1, symbol = operation
            for y in range(y0, y1 + 1):
                for x in range(x0, x1 + 1):
                    grid[y][x] = symbol
        elif kind == 'rows':
            _, x0, y0, lines = operation
            for dy, line in enumerate(lines):
                for dx, symbol in enumerate(line):
                    if symbol != ' ':
                        grid[y0 + dy][x0 + dx] = symbol
        elif kind == 'swap':
            _, x0, y0, x1, y1, source, target = operation
            for y in range(y0, y1 + 1):
                for x in range(x0, x1 + 1):
                    if grid[y][x] in source:
                        grid[y][x] = target
        elif kind == 'call':
            operation[1](grid)
        elif kind == 'cells':
            _, symbol, cells, family = operation
            for x, y in cells:
                if grid[y][x] in family:
                    grid[y][x] = symbol
        elif kind == 'smooth':
            _, x0, y0, x1, y1, family, passes = operation
            for _ in range(passes):
                snapshot = [list(row) for row in grid]
                for y in range(y0, y1 + 1):
                    for x in range(x0, x1 + 1):
                        if snapshot[y][x] not in family:
                            continue
                        votes = Counter(at(snapshot, nx, ny) for nx, ny in neighbours8(x, y))
                        votes[snapshot[y][x]] += 1.5
                        best = max((symbol for symbol in votes if symbol in family), key=lambda symbol: votes[symbol])
                        grid[y][x] = best
        elif kind == 'mirror':
            _, x0, y0, x1, y1, target_x1 = operation
            for y in range(y0, y1 + 1):
                for x in range(x0, x1 + 1):
                    grid[y][target_x1 - (x - x0)] = grid[y][x]
        elif kind == 'crop':
            _, x0, y0, x1, y1 = operation
            grid[:] = [row[x0:x1 + 1] for row in grid[y0:y1 + 1]]
        elif kind == 'pad':
            _, left, top, right, bottom = operation
            width = len(grid[0]) + left + right
            grid[:] = [[EMPTY] * width for _ in range(top)] + [[EMPTY] * left + row + [EMPTY] * right for row in grid] + [[EMPTY] * width for _ in range(bottom)]
        else:
            raise SystemExit(f'unknown patch {kind}')


def trim(grid):
    rows = [index for index, row in enumerate(grid) if any(symbol != EMPTY for symbol in row)]
    columns = [index for index in range(len(grid[0])) if any(row[index] != EMPTY for row in grid)]
    return [row[columns[0]:columns[-1] + 1] for row in grid[rows[0]:rows[-1] + 1]]


def build_sprite(name, array, payload, report):
    settings = SETTINGS[name]
    sprite = payload['sprites'][settings['index']]
    symbols = settings['symbols']
    grid = sample_votes(array, sprite, symbols, settings.get('weights', {}))
    apply_patches(grid, PATCHES.get(name + ':before', []))
    total = 0
    for _ in range(settings.get('despeckle', 2)):
        grid, changed = despeckle(grid, settings.get('keep', ''))
        total += changed
    holes = fill_holes(grid)
    outlined = ink_outline(grid) if settings.get('outline', True) else 0
    apply_patches(grid, PATCHES.get(name, []))
    grid = trim(grid)
    late_holes = fill_holes(grid) + fill_notches(grid)
    light_edges = [(x, y) for x, y in edge_cells(grid) if luminance(COLOR_OF[grid[y][x]]) > 80]
    used = Counter(symbol for row in grid for symbol in row if symbol != EMPTY)
    unknown = [symbol for symbol in used if symbol not in COLOR_OF]
    if unknown:
        raise SystemExit(f'{name}: unknown symbols {unknown}')
    if report:
        print(f'{name}: {len(grid[0])}x{len(grid)}, {len(used)} colors, despeckled {total}, holes {holes}+{late_holes}, outlined {outlined}, light edge cells {light_edges[:12]}')
        print('   usage', ' '.join(f'{symbol}:{count}' for symbol, count in used.most_common()))
    return [''.join(row) for row in grid], sprite


def render(rows, scale, colors=None):
    colors = colors or COLOR_OF
    image = Image.new('RGB', (len(rows[0]), len(rows)), BACKGROUND)
    for y, row in enumerate(rows):
        for x, symbol in enumerate(row):
            if symbol != EMPTY:
                image.putpixel((x, y), colors[symbol])
    return image.resize((image.width * scale, image.height * scale), Image.NEAREST)


def ruler(tile, columns, rows, scale):
    margin = 14
    canvas = Image.new('RGB', (tile.width + margin, tile.height + margin), BACKGROUND)
    canvas.paste(tile, (margin, margin))
    draw = ImageDraw.Draw(canvas)
    for column in range(0, columns, 5):
        draw.text((margin + column * scale, 1), str(column), fill=(255, 255, 255))
    for row in range(0, rows, 5):
        draw.text((0, margin + row * scale), str(row), fill=(255, 255, 255))
    return canvas


def reference_crop(array, sprite, scale, columns, rows):
    x0, x1 = int(round(sprite['xs'][0])), int(round(sprite['xs'][-1]))
    y0, y1 = int(round(sprite['ys'][0])), int(round(sprite['ys'][-1]))
    crop = Image.fromarray(array[y0:y1, x0:x1])
    return crop.resize((columns * scale, rows * scale), Image.LANCZOS)


def window(rows, area):
    if not area:
        return rows
    x0, y0, x1, y1 = area
    return [row[x0:x1 + 1] for row in rows[y0:y1 + 1]]


def preview(name, rows, sprite, array, scale, area, out):
    source_columns, source_rows = len(sprite['rows'][0]), len(sprite['rows'])
    reference = reference_crop(array, sprite, scale, source_columns, source_rows)
    result = render(rows, scale)
    if area:
        x0, y0, x1, y1 = area
        box = (x0 * scale, y0 * scale, (x1 + 1) * scale, (y1 + 1) * scale)
        reference = reference.crop(box)
        result = result.crop(box)
        origin = (x0, y0)
    else:
        origin = (0, 0)
    tiles = [(f'{name} reference', offset_ruler(reference, scale, origin)), (f'{name} sprite', offset_ruler(result, scale, origin))]
    labelled_sheet(tiles, columns=2).save(out)
    print('wrote', out)


def offset_ruler(tile, scale, origin):
    margin = 14
    canvas = Image.new('RGB', (tile.width + margin, tile.height + margin), BACKGROUND)
    canvas.paste(tile, (margin, margin))
    draw = ImageDraw.Draw(canvas)
    columns, rows = tile.width // scale, tile.height // scale
    step = 5 if scale < 16 else 2
    for column in range(columns):
        if (column + origin[0]) % step == 0:
            draw.text((margin + column * scale, 1), str(column + origin[0]), fill=(255, 255, 255))
    for row in range(rows):
        if (row + origin[1]) % step == 0:
            draw.text((0, margin + row * scale), str(row + origin[1]), fill=(255, 255, 255))
    return canvas


def dump(rows, area):
    x0, y0 = (area[0], area[1]) if area else (0, 0)
    part = window(rows, area)
    width = len(part[0])
    print('    ' + ''.join(str(((x0 + index) // 10) % 10) for index in range(width)))
    print('    ' + ''.join(str((x0 + index) % 10) for index in range(width)))
    for index, row in enumerate(part):
        print(f'{y0 + index:3d} {row}')


def legend_text(name, pairs):
    lines = '\n'.join(f"  '{symbol}': '{key}'," if not symbol.isalpha() else f'  {symbol}: \'{key}\',' for symbol, key in pairs)
    return f'export const {name}: PixelLegend = {{\n{lines}\n}};\n'


def grid_text(name, rows):
    body = '\n'.join(f"  '{row}'," for row in rows)
    return f'export const {name}: PixelGrid = [\n{body}\n];\n'


def write_files(grids):
    used = Counter(symbol for rows in grids.values() for row in rows for symbol in row if symbol != EMPTY)
    source = "import type { PixelGrid, PixelLegend } from '../../../game/elements';\n\n"
    for name in SPRITES:
        source += grid_text(name, grids[name]) + '\n'
    source += legend_text('HOUSE_LEGEND', [(symbol, key) for symbol, key, _ in PALETTE if used[symbol]]) + '\n'
    split = [''.join(ROOF_SPLIT.get(symbol, symbol) for symbol in row) for row in grids['SHOP_HOUSE']]
    source += grid_text('SHOP_HOUSE_SPLIT', split) + '\n'
    split_used = {symbol for row in split for symbol in row if symbol != EMPTY}
    body_pairs = [(symbol, key) for symbol, key, _ in PALETTE if symbol in split_used]
    palette_lines = [f'  {key}: 0x{value},' for symbol, key, value in PALETTE if used[symbol]]
    blocks = []
    for legend_name, tones in ROOF_VARIANTS.items():
        roof_pairs = [(split_symbol, tones[index][0]) for index, split_symbol in enumerate(ROOF_SPLIT.values()) if split_symbol in split_used]
        blocks.append(legend_text(legend_name, body_pairs + roof_pairs))
        for index, (key, value) in enumerate(tones):
            if value is not None and list(ROOF_SPLIT.values())[index] in split_used:
                palette_lines.append(f'  {key}: 0x{value},')
    source += '\n'.join(blocks)
    with open(ART_FILE, 'w', encoding='utf-8', newline='\n') as handle:
        handle.write(source)
    with open(PALETTE_FILE, 'w', encoding='utf-8', newline='\n') as handle:
        handle.write('export const HOUSE_PALETTE = {\n' + '\n'.join(palette_lines) + '\n} as const;\n')
    unused = [key for symbol, key, _ in PALETTE if not used[symbol]]
    print('wrote', ART_FILE, PALETTE_FILE, 'palette keys', len(palette_lines), 'unused symbols', unused)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--names', default='')
    parser.add_argument('--cells', default=FOLDER + '/cells-snap.json')
    parser.add_argument('--scale', type=int, default=10)
    parser.add_argument('--area', default='')
    parser.add_argument('--dump', action='store_true')
    parser.add_argument('--preview', action='store_true')
    parser.add_argument('--write', action='store_true')
    arguments = parser.parse_args()

    with open(arguments.cells, encoding='utf-8') as handle:
        payload = json.load(handle)
    array = np.array(Image.open(payload['image']).convert('RGB'))
    wanted = [name for name in arguments.names.split(',') if name] or SPRITES
    area = [int(value) for value in arguments.area.split(',')] if arguments.area else None
    grids = {}
    for name in SPRITES:
        if name not in wanted and not arguments.write:
            continue
        rows, sprite = build_sprite(name, array, payload, name in wanted)
        grids[name] = rows
        if name in wanted and arguments.preview:
            os.makedirs('sprite-preview/audit', exist_ok=True)
            preview(name, rows, sprite, array, arguments.scale, area, f'sprite-preview/audit/house-build-{name}.png')
        if name in wanted and arguments.dump:
            dump(rows, area)
    if arguments.write:
        write_files(grids)


if __name__ == '__main__':
    main()
