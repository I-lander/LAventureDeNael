import argparse
import json
import os

import numpy as np
from PIL import Image, ImageDraw

from ref_extract import cells_tile, find_sprites, flood_background, order_sprites
from spritelib import BACKGROUND, labelled_sheet

UPSCALE = 2


def edge_strength(region, axis):
    diff = np.abs(np.diff(region.astype(np.int32), axis=axis)).sum(axis=2).astype(np.float64)
    diff = np.minimum(diff, 160)
    return diff.sum(axis=0 if axis == 1 else 1)


def smooth(profile):
    kernel = np.array([0.25, 0.5, 0.25])
    return np.convolve(profile, kernel, mode='same')


def snap_lines(profile, nominal, slack, stiffness):
    length = len(profile)
    normalized = profile / max(profile.mean(), 1e-6) - 1
    low = int(np.floor(nominal - slack))
    high = int(np.ceil(nominal + slack))
    best = np.full(length, -1e18)
    previous = np.full(length, -1, dtype=int)
    for position in range(length):
        if position < high:
            best[position] = normalized[position]
        for spacing in range(low, high + 1):
            origin = position - spacing
            if origin < 0:
                continue
            candidate = best[origin] + normalized[position] - stiffness * (spacing - nominal) ** 2
            if candidate > best[position]:
                best[position] = candidate
                previous[position] = origin
    end = int(np.argmax(best[length - high:])) + length - high
    lines = []
    position = end
    while position >= 0:
        lines.append(position)
        position = previous[position]
    return lines[::-1]


def sample(array, background_mask, box, nominal, slack, stiffness, inner):
    x0, y0, x1, y1 = box
    margin = int(round(nominal * 1.5))
    height, width, _ = array.shape
    left, top = max(0, x0 - margin), max(0, y0 - margin)
    right, bottom = min(width, x1 + margin), min(height, y1 + margin)
    region = array[top:bottom, left:right]
    big = np.array(Image.fromarray(region).resize(((right - left) * UPSCALE, (bottom - top) * UPSCALE), Image.BICUBIC))
    mask = np.repeat(np.repeat(background_mask[top:bottom, left:right], UPSCALE, axis=0), UPSCALE, axis=1)
    xs = [value + 1 for value in snap_lines(smooth(edge_strength(big, 1)), nominal * UPSCALE, slack * UPSCALE, stiffness)]
    ys = [value + 1 for value in snap_lines(smooth(edge_strength(big, 0)), nominal * UPSCALE, slack * UPSCALE, stiffness)]
    rows = []
    for row in range(len(ys) - 1):
        line = []
        cell_top, cell_bottom = ys[row], ys[row + 1]
        for column in range(len(xs) - 1):
            cell_left, cell_right = xs[column], xs[column + 1]
            pad_x = max(1, int(round((cell_right - cell_left) * inner)))
            pad_y = max(1, int(round((cell_bottom - cell_top) * inner)))
            block_mask = mask[cell_top + pad_y:cell_bottom - pad_y, cell_left + pad_x:cell_right - pad_x]
            if block_mask.size == 0 or block_mask.mean() >= 0.5:
                line.append(None)
                continue
            block = big[cell_top + pad_y:cell_bottom - pad_y, cell_left + pad_x:cell_right - pad_x].reshape(-1, 3)
            line.append(tuple(int(value) for value in np.median(block, axis=0)))
        rows.append(line)
    filled_rows = [index for index, line in enumerate(rows) if any(cell is not None for cell in line)]
    filled_columns = [index for index in range(len(xs) - 1) if any(rows[row][index] is not None for row in range(len(rows)))]
    r0, r1 = filled_rows[0], filled_rows[-1]
    c0, c1 = filled_columns[0], filled_columns[-1]
    trimmed = [line[c0:c1 + 1] for line in rows[r0:r1 + 1]]
    line_xs = [left + value / UPSCALE for value in xs[c0:c1 + 2]]
    line_ys = [top + value / UPSCALE for value in ys[r0:r1 + 2]]
    return trimmed, line_xs, line_ys


def grid_tile(array, line_xs, line_ys, scale):
    x0, x1 = int(round(line_xs[0])), int(round(line_xs[-1]))
    y0, y1 = int(round(line_ys[0])), int(round(line_ys[-1]))
    crop = Image.fromarray(array[y0:y1, x0:x1]).resize(((x1 - x0) * scale, (y1 - y0) * scale), Image.NEAREST)
    draw = ImageDraw.Draw(crop)
    for index, value in enumerate(line_xs):
        position = int(round((value - x0) * scale))
        draw.line([(position, 0), (position, crop.height)], fill=(255, 0, 255) if index % 5 else (0, 255, 255), width=1)
    for index, value in enumerate(line_ys):
        position = int(round((value - y0) * scale))
        draw.line([(0, position), (crop.width, position)], fill=(255, 0, 255) if index % 5 else (0, 255, 255), width=1)
    return crop


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--image', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--cell', type=float, default=5.25)
    parser.add_argument('--slack', type=float, default=1.0)
    parser.add_argument('--stiffness', type=float, default=0.15)
    parser.add_argument('--inner', type=float, default=0.25)
    parser.add_argument('--tolerance', type=float, default=16)
    parser.add_argument('--scale', type=int, default=10)
    parser.add_argument('--verbose', action='store_true')
    parser.add_argument('--grid', default='')
    parser.add_argument('--grid-scale', type=int, default=4)
    arguments = parser.parse_args()

    array = np.array(Image.open(arguments.image).convert('RGB'))
    corners = np.concatenate([array[:16, :16].reshape(-1, 3), array[:16, -16:].reshape(-1, 3), array[-16:, :16].reshape(-1, 3), array[-16:, -16:].reshape(-1, 3)])
    background = np.median(corners, axis=0)
    background_mask = flood_background(array, background, arguments.tolerance)
    boxes = order_sprites(find_sprites(~background_mask, 20, 300))
    sprites = []
    tiles = []
    for index, box in enumerate(boxes):
        cells, line_xs, line_ys = sample(array, background_mask, box, arguments.cell, arguments.slack, arguments.stiffness, arguments.inner)
        columns, rows = len(cells[0]), len(cells)
        period = [round((line_xs[-1] - line_xs[0]) / columns, 3), round((line_ys[-1] - line_ys[0]) / rows, 3)]
        spacing_x = ''.join(str(int(round((second - first) * UPSCALE)) % 36) for first, second in zip(line_xs, line_xs[1:]))
        spacing_y = ''.join(str(int(round((second - first) * UPSCALE)) % 36) for first, second in zip(line_ys, line_ys[1:]))
        print('sprite', index, 'cells', f'{columns}x{rows}', 'period', [float(value) for value in period])
        if arguments.verbose:
            print('   x half-pixel spacing', spacing_x)
            print('   y half-pixel spacing', spacing_y)
        sprite = {'index': index, 'box': list(box), 'period': period, 'origin': [round(line_xs[0], 2), round(line_ys[0], 2)], 'cells': cells, 'xs': line_xs, 'ys': line_ys}
        sprites.append(sprite)
        tiles.append((f'{index} cells {columns}x{rows}', cells_tile(sprite, arguments.scale)))
        if arguments.grid:
            grid_tile(array, line_xs, line_ys, arguments.grid_scale).save(f'{arguments.grid}-{index}.png')
    payload = {
        'image': arguments.image.replace('\\', '/'),
        'background': [int(value) for value in background],
        'nominal': arguments.cell,
        'sprites': [
            {
                'index': sprite['index'],
                'box': sprite['box'],
                'period': sprite['period'],
                'origin': sprite['origin'],
                'xs': sprite['xs'],
                'ys': sprite['ys'],
                'rows': [['#%02x%02x%02x' % tuple(cell) if cell is not None else None for cell in line] for line in sprite['cells']],
            }
            for sprite in sprites
        ],
    }
    os.makedirs(os.path.dirname(os.path.abspath(arguments.out)), exist_ok=True)
    with open(arguments.out + '.json', 'w', encoding='utf-8') as handle:
        json.dump(payload, handle)
    labelled_sheet(tiles, columns=4).save(arguments.out + '.png')
    print('wrote', arguments.out + '.json', arguments.out + '.png')


if __name__ == '__main__':
    main()
