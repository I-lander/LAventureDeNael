import argparse
import json

import numpy as np
from PIL import Image, ImageDraw

from ref_extract import cells_tile, reference_tile
from ref_quantize import load_cells
from spritelib import BACKGROUND, labelled_sheet


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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cells', required=True)
    parser.add_argument('--index', type=int, required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--scale', type=int, default=12)
    parser.add_argument('--grid', action='store_true')
    parser.add_argument('--info', action='store_true')
    arguments = parser.parse_args()

    payload = load_cells(arguments.cells)
    if arguments.info:
        for sprite in payload['sprites']:
            print(sprite['index'], 'box', sprite['box'], 'period', sprite['period'], 'origin', sprite['origin'], f"{len(sprite['cells'][0])}x{len(sprite['cells'])}")
    array = np.array(Image.open(payload['image']).convert('RGB'))
    sprite = payload['sprites'][arguments.index]
    columns = len(sprite['cells'][0])
    rows = len(sprite['cells'])
    tiles = [
        ('reference', ruler(reference_tile(array, sprite, arguments.scale, arguments.grid), columns, rows, arguments.scale)),
        ('cells', ruler(cells_tile(sprite, arguments.scale), columns, rows, arguments.scale)),
    ]
    labelled_sheet(tiles, columns=2).save(arguments.out)
    print('wrote', arguments.out)


if __name__ == '__main__':
    main()
