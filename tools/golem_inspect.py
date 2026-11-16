import argparse
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ref_extract import cluster_report, hue_name
from ref_quantize import load_cells

MARGIN = 22


def zoom_tile(array, sprite, zoom, grid):
    period_x, period_y = sprite['period']
    origin_x, origin_y = sprite['origin']
    columns = len(sprite['cells'][0])
    rows = len(sprite['cells'])
    height, width, _ = array.shape
    left = max(0, int(round(origin_x)))
    top = max(0, int(round(origin_y)))
    right = min(width, int(round(origin_x + columns * period_x)))
    bottom = min(height, int(round(origin_y + rows * period_y)))
    crop = Image.fromarray(array[top:bottom, left:right])
    crop = crop.resize((crop.width * zoom, crop.height * zoom), Image.NEAREST)
    sheet = Image.new('RGB', (crop.width + MARGIN, crop.height + MARGIN), (20, 20, 20))
    sheet.paste(crop, (MARGIN, MARGIN))
    draw = ImageDraw.Draw(sheet)
    for column in range(columns + 1):
        x = MARGIN + (origin_x + column * period_x - left) * zoom
        if grid:
            draw.line([(x, MARGIN), (x, sheet.height)], fill=(0, 255, 120), width=1)
        if column < columns:
            draw.text((x + 2, 4), str(column), fill=(255, 255, 255))
    for row in range(rows + 1):
        y = MARGIN + (origin_y + row * period_y - top) * zoom
        if grid:
            draw.line([(MARGIN, y), (sheet.width, y)], fill=(0, 255, 120), width=1)
        if row < rows:
            draw.text((2, y + 2), str(row), fill=(255, 255, 255))
    return sheet


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cells', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--zoom', type=int, default=4)
    parser.add_argument('--cluster', type=float, default=18)
    parser.add_argument('--indices', default='')
    parser.add_argument('--no-grid', action='store_true')
    parser.add_argument('--quiet', action='store_true')
    arguments = parser.parse_args()

    payload = load_cells(arguments.cells)
    array = np.array(Image.open(payload['image']).convert('RGB'))
    wanted = [int(item) for item in arguments.indices.split(',') if item]
    for sprite in payload['sprites']:
        if wanted and sprite['index'] not in wanted:
            continue
        columns = len(sprite['cells'][0])
        rows = len(sprite['cells'])
        print('sprite', sprite['index'], f'{columns}x{rows}', 'period', sprite['period'], 'origin', sprite['origin'], 'box', sprite['box'])
        if not arguments.quiet:
            colors = [cell for line in sprite['cells'] for cell in line if cell is not None]
            for color, count in cluster_report(colors, arguments.cluster):
                print('   #%02x%02x%02x' % color, hue_name(color).ljust(7), count)
        zoom_tile(array, sprite, arguments.zoom, not arguments.no_grid).save(f"{arguments.out}-{sprite['index']}.png")


if __name__ == '__main__':
    main()
