import argparse
import json
import os
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ref_quantize import load_cells, parse_hex, perceptual_distance

EMPTY = '.'
SYMBOL_SETS = {
    0: 'kpquvhw',
    1: 'kpquvhw',
    2: 'kdsblroay',
    3: 'kdsblroay',
    4: 'kdsblroay',
    5: 'eroay',
    6: 'kgayw',
    7: 'kngayw',
}
LAVA = 'roay'
PRIORITY = 'yaorkdsbl'


def quantize(cells, colors):
    rows = []
    for line in cells:
        row = ''
        for color in line:
            if color is None:
                row += EMPTY
            else:
                row += min(colors, key=lambda item: perceptual_distance(color, item[1]))[0]
        rows.append(row)
    return rows


def halve(rows, phase_x, phase_y):
    height = len(rows)
    width = len(rows[0])
    result = []
    for top in range(-phase_y, height, 2):
        line = ''
        for left in range(-phase_x, width, 2):
            block = [
                rows[y][x]
                for y in (top, top + 1)
                for x in (left, left + 1)
                if 0 <= y < height and 0 <= x < width
            ]
            filled = [symbol for symbol in block if symbol != EMPTY]
            if len(filled) < 2:
                line += EMPTY
                continue
            counts = Counter(filled)
            lava = [symbol for symbol in filled if symbol in LAVA]
            if len(lava) >= 2:
                line += Counter(lava).most_common(1)[0][0]
            elif counts['k'] >= 2:
                line += 'k'
            else:
                rock = [symbol for symbol in filled if symbol not in LAVA and symbol != 'k'] or filled
                best = Counter(rock).most_common()
                top_count = best[0][1]
                tied = [symbol for symbol, count in best if count == top_count]
                line += max(tied, key=lambda symbol: PRIORITY.index(symbol) if symbol in PRIORITY else 0)
        result.append(line)
    return result


def numbered(rows):
    width = len(rows[0])
    header_tens = '    ' + ''.join(str((x // 10) % 10) for x in range(width))
    header_units = '    ' + ''.join(str(x % 10) for x in range(width))
    return '\n'.join([header_tens, header_units] + [f'{y:3d} {row}' for y, row in enumerate(rows)])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cells', required=True)
    parser.add_argument('--palette', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--halve', action='store_true')
    arguments = parser.parse_args()

    payload = load_cells(arguments.cells)
    with open(arguments.palette, encoding='utf-8') as handle:
        palette = json.load(handle)
    by_symbol = {entry['symbol']: parse_hex(entry['hex']) for entry in palette['colors']}
    text = ''
    for sprite in payload['sprites']:
        colors = [(symbol, by_symbol[symbol]) for symbol in SYMBOL_SETS[sprite['index']]]
        rows = quantize(sprite['cells'], colors)
        text += f"sprite {sprite['index']} {len(rows[0])}x{len(rows)}\n{numbered(rows)}\n\n"
        if arguments.halve:
            for phase_y in (0, 1):
                for phase_x in (0, 1):
                    halved = halve(rows, phase_x, phase_y)
                    text += f"sprite {sprite['index']} halved phase {phase_x},{phase_y} {len(halved[0])}x{len(halved)}\n{numbered(halved)}\n\n"
    with open(arguments.out, 'w', encoding='utf-8', newline='\n') as handle:
        handle.write(text)
    print('wrote', arguments.out)


if __name__ == '__main__':
    main()
