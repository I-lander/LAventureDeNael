import json
import sys

from audit_sprites import align
from ref_quantize import load_cells, perceptual_distance
from spritelib import grid_colors, load_art, load_palette

FAMILY = 'art-references/v4/monster/family.json'


def main():
    index = int(sys.argv[1])
    with open(FAMILY, encoding='utf-8') as handle:
        family = json.load(handle)
    entry = family['sprites'][index]
    reference = load_cells(entry['cells'])['sprites'][entry['index']]['cells']
    grids, legends = load_art(family['art'])
    legend_name = (entry.get('legends') or [entry.get('legend')])[0]
    grid = grids[entry['name']]
    colors = grid_colors(grid, legends[legend_name], load_palette())
    opaque = [[color is not None for color in row] for row in colors]
    offset_x, offset_y = align(opaque, reference)
    print(entry['name'], 'offset', offset_x, offset_y)
    for y, row in enumerate(colors):
        for x, color in enumerate(row):
            ref_x, ref_y = x + offset_x, y + offset_y
            inside = 0 <= ref_y < len(reference) and 0 <= ref_x < len(reference[0])
            ref_color = reference[ref_y][ref_x] if inside else None
            if color is None and ref_color is None:
                continue
            if color is None:
                print(f'  missing ({x},{y}) ref #%02x%02x%02x' % ref_color)
            elif ref_color is None:
                print(f'  added   ({x},{y}) {grid[y][x]}')
            else:
                distance = perceptual_distance(color, ref_color)
                if distance > 90:
                    print(f'  differs ({x},{y}) {grid[y][x]} ref #%02x%02x%02x {round(distance)}' % ref_color)


if __name__ == '__main__':
    main()
