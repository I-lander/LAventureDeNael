import argparse

import numpy as np
from PIL import Image, ImageDraw

from ref_extract import cells_tile, reference_tile
from ref_quantize import load_cells
from spritelib import BACKGROUND, grid_colors, load_art, load_palette, render_colors

NAMES = ['TREE', 'PINE', 'ROCK', 'CACTUS', 'DEAD_TREE', 'WILLOW', 'MOSSY_LOG', 'LILY_PADS']
ART = 'src/tools/spriteBaker/half/NatureHalf.ts'
GROUNDS = [(0x6a, 0xa8, 0x4a), (0xe8, 0xf0, 0xf8), (0x3c, 0x34, 0x42), (0xb0, 0x8a, 0x5a), (0x3a, 0x61, 0x50)]


def ruler(tile, columns, rows, scale):
    framed = Image.new('RGB', (tile.width + 24, tile.height + 14), BACKGROUND)
    framed.paste(tile.convert('RGB'), (24, 14))
    draw = ImageDraw.Draw(framed)
    for column in range(columns):
        draw.text((24 + column * scale + 2, 0), str(column % 100), fill=(200, 200, 200))
    for row in range(rows):
        draw.text((2, 14 + row * scale + 2), str(row), fill=(200, 200, 200))
    return framed


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--name', required=True)
    parser.add_argument('--scale', type=int, default=20)
    parser.add_argument('--out', required=True)
    parser.add_argument('--grounds', action='store_true')
    arguments = parser.parse_args()

    payload = load_cells('art-references/v4/nature/cells.json')
    sprite = payload['sprites'][NAMES.index(arguments.name)]
    array = np.array(Image.open(payload['image']).convert('RGB'))
    scale = arguments.scale
    columns = len(sprite['cells'][0])
    rows = len(sprite['cells'])
    tiles = [ruler(reference_tile(array, sprite, scale, True), columns, rows, scale)]
    grids, legends = load_art(ART)
    palette = load_palette()
    if arguments.name in grids:
        colors = grid_colors(grids[arguments.name], legends['NATURE_LEGEND'], palette)
        tiles.append(ruler(render_colors(colors, scale, BACKGROUND), len(colors[0]), len(colors), scale))
        if arguments.grounds:
            for ground in GROUNDS:
                small = render_colors(colors, 4)
                backed = Image.new('RGB', (small.width + 16, small.height + 16), ground)
                backed.paste(small.convert('RGB'), (8, 8), small)
                tiles.append(backed)
    width = sum(tile.width for tile in tiles) + 16 * (len(tiles) + 1)
    height = max(tile.height for tile in tiles) + 32
    sheet = Image.new('RGB', (width, height), BACKGROUND)
    left = 16
    for tile in tiles:
        sheet.paste(tile, (left, 16))
        left += tile.width + 16
    sheet.save(arguments.out)
    print('wrote', arguments.out, sheet.size)


if __name__ == '__main__':
    main()
