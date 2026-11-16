import argparse

import numpy as np
from PIL import Image, ImageDraw

from ref_extract import cells_tile, reference_tile
from ref_quantize import load_cells
from spritelib import BACKGROUND

NAMES = ['FOUNTAIN', 'STREET_LAMP', 'WELL', 'BENCH', 'MARKET_STALL', 'FLOWER_BED', 'BARRELS', 'FENCE']


def ruled(tile, columns, rows, scale):
    margin = 16
    sheet = Image.new('RGB', (tile.width + margin, tile.height + margin), BACKGROUND)
    sheet.paste(tile, (margin, margin))
    draw = ImageDraw.Draw(sheet)
    for column in range(columns):
        draw.line([(margin + column * scale, margin), (margin + column * scale, margin + rows * scale)], fill=(70, 60, 80), width=1)
        if column % 2 == 0:
            draw.text((margin + column * scale + 2, 2), str(column), fill=(244, 242, 234))
    for row in range(rows):
        draw.line([(margin, margin + row * scale), (margin + columns * scale, margin + row * scale)], fill=(70, 60, 80), width=1)
        draw.text((0, margin + row * scale + 4), str(row), fill=(244, 242, 234))
    return sheet


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cells', default='art-references/v4/decor/cells.json')
    parser.add_argument('--name', required=True)
    parser.add_argument('--scale', type=int, default=24)
    parser.add_argument('--out', required=True)
    arguments = parser.parse_args()
    payload = load_cells(arguments.cells)
    sprite = payload['sprites'][NAMES.index(arguments.name)]
    array = np.array(Image.open(payload['image']).convert('RGB'))
    columns = len(sprite['cells'][0])
    rows = len(sprite['cells'])
    reference = ruled(reference_tile(array, sprite, arguments.scale, False), columns, rows, arguments.scale)
    sampled = ruled(cells_tile(sprite, arguments.scale), columns, rows, arguments.scale)
    sheet = Image.new('RGB', (reference.width + sampled.width + 16, reference.height), BACKGROUND)
    sheet.paste(reference, (0, 0))
    sheet.paste(sampled, (reference.width + 16, 0))
    sheet.save(arguments.out)
    print('wrote', arguments.out)


if __name__ == '__main__':
    main()
