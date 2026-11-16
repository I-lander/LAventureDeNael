import json
import sys

import numpy as np
from PIL import Image, ImageDraw

from ref_extract import cells_tile, reference_tile
from ref_quantize import load_cells
from spritelib import BACKGROUND, grid_colors, load_art, load_palette, render_colors

FAMILY = 'art-references/v4/monster/family.json'
MARGIN = 18


def with_axes(tile, columns, rows, scale, first_row):
    sheet = Image.new('RGB', (tile.width + MARGIN, tile.height + MARGIN), BACKGROUND)
    sheet.paste(tile.convert('RGB'), (MARGIN, MARGIN))
    draw = ImageDraw.Draw(sheet)
    for column in range(columns):
        left = MARGIN + column * scale
        draw.line([(left, MARGIN), (left, MARGIN + rows * scale)], fill=(90, 80, 100), width=1)
        if column % 2 == 0:
            draw.text((left + 1, 2), str(column), fill=(244, 242, 234))
    for row in range(rows):
        top = MARGIN + row * scale
        draw.line([(MARGIN, top), (MARGIN + columns * scale, top)], fill=(90, 80, 100), width=1)
        draw.text((1, top + 1), str(row + first_row), fill=(244, 242, 234))
    return sheet


def main():
    index = int(sys.argv[1])
    scale = int(sys.argv[2])
    first_row = int(sys.argv[3]) if len(sys.argv) > 3 else 0
    last_row = int(sys.argv[4]) if len(sys.argv) > 4 else 999
    mode = sys.argv[5] if len(sys.argv) > 5 else 'both'
    with open(FAMILY, encoding='utf-8') as handle:
        family = json.load(handle)
    entry = family['sprites'][index]
    payload = load_cells(entry['cells'])
    sprite = payload['sprites'][entry['index']]
    array = np.array(Image.open(payload['image']).convert('RGB'))
    columns = len(sprite['cells'][0])
    total_rows = len(sprite['cells'])
    last_row = min(last_row, total_rows - 1)
    rows = last_row - first_row + 1
    reference = reference_tile(array, sprite, scale, False).crop((0, first_row * scale, columns * scale, (last_row + 1) * scale))
    tiles = [with_axes(reference, columns, rows, scale, first_row)]
    if mode in ('both', 'cells'):
        sampled = cells_tile(sprite, scale).crop((0, first_row * scale, columns * scale, (last_row + 1) * scale))
        tiles.append(with_axes(sampled, columns, rows, scale, first_row))
    if mode in ('both', 'art'):
        grids, legends = load_art(family['art'])
        legend_name = (entry.get('legends') or [entry.get('legend')])[0]
        grid = grids[entry['name']]
        colors = grid_colors(grid, legends[legend_name], load_palette())
        art_columns = len(grid[0])
        art_last = min(last_row, len(grid) - 1)
        art = render_colors(colors, scale, BACKGROUND).crop((0, first_row * scale, art_columns * scale, (art_last + 1) * scale))
        tiles.append(with_axes(art, art_columns, art_last - first_row + 1, scale, first_row))
    sheet = Image.new('RGB', (sum(tile.width for tile in tiles) + 8 * len(tiles), max(tile.height for tile in tiles)), BACKGROUND)
    left = 0
    for tile in tiles:
        sheet.paste(tile, (left, 0))
        left += tile.width + 8
    out = f'sprite-preview/audit/monster-view-{index}.png'
    sheet.save(out)
    print('wrote', out, sheet.size)


if __name__ == '__main__':
    main()
