import argparse
import colorsys
import json
import os
from collections import Counter, deque

import numpy as np
from PIL import Image, ImageDraw

from spritelib import BACKGROUND, labelled_sheet

BLOCK = 4


def flood_background(array, background, tolerance):
    height, width, _ = array.shape
    distance = np.sqrt(((array.astype(np.int32) - background) ** 2).sum(axis=2))
    candidate = distance < tolerance
    reached = np.zeros((height, width), dtype=bool)
    queue = deque()
    for x in range(width):
        for y in (0, height - 1):
            if candidate[y, x] and not reached[y, x]:
                reached[y, x] = True
                queue.append((x, y))
    for y in range(height):
        for x in (0, width - 1):
            if candidate[y, x] and not reached[y, x]:
                reached[y, x] = True
                queue.append((x, y))
    while queue:
        x, y = queue.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and candidate[ny, nx] and not reached[ny, nx]:
                reached[ny, nx] = True
                queue.append((nx, ny))
    return reached


def find_sprites(foreground, merge, min_area):
    height, width = foreground.shape
    small_height = height // BLOCK
    small_width = width // BLOCK
    small = foreground[: small_height * BLOCK, : small_width * BLOCK].reshape(small_height, BLOCK, small_width, BLOCK).any(axis=(1, 3))
    reach = max(1, round(merge / BLOCK))
    labels = -np.ones(small.shape, dtype=int)
    boxes = []
    for start_y in range(small_height):
        for start_x in range(small_width):
            if not small[start_y, start_x] or labels[start_y, start_x] >= 0:
                continue
            index = len(boxes)
            labels[start_y, start_x] = index
            queue = deque([(start_x, start_y)])
            x0 = x1 = start_x
            y0 = y1 = start_y
            count = 0
            while queue:
                x, y = queue.popleft()
                count += 1
                x0, x1, y0, y1 = min(x0, x), max(x1, x), min(y0, y), max(y1, y)
                for ny in range(max(0, y - reach), min(small_height, y + reach + 1)):
                    for nx in range(max(0, x - reach), min(small_width, x + reach + 1)):
                        if small[ny, nx] and labels[ny, nx] < 0:
                            labels[ny, nx] = index
                            queue.append((nx, ny))
            boxes.append((count * BLOCK * BLOCK, x0 * BLOCK, y0 * BLOCK, (x1 + 1) * BLOCK, (y1 + 1) * BLOCK))
    result = []
    for area, x0, y0, x1, y1 in boxes:
        if area < min_area:
            continue
        region = foreground[y0:y1, x0:x1]
        ys, xs = np.nonzero(region)
        result.append((x0 + int(xs.min()), y0 + int(ys.min()), x0 + int(xs.max()) + 1, y0 + int(ys.max()) + 1))
    return result


def order_sprites(boxes):
    if not boxes:
        return []
    typical = sorted(box[3] - box[1] for box in boxes)[len(boxes) // 2]
    by_center = sorted(boxes, key=lambda box: (box[1] + box[3]) / 2)
    rows = [[by_center[0]]]
    for box in by_center[1:]:
        previous = rows[-1][-1]
        if (box[1] + box[3]) / 2 - (previous[1] + previous[3]) / 2 > max(typical * 0.6, 40):
            rows.append([box])
        else:
            rows[-1].append(box)
    return [box for row in rows for box in sorted(row, key=lambda item: item[0])]


def edge_profile(region, axis):
    diff = np.abs(np.diff(region.astype(np.int32), axis=axis)).sum(axis=2)
    return diff.sum(axis=0 if axis == 1 else 1).astype(np.float64)


def fit_axis(profile, low, high, step=0.01):
    best = (-1.0, low, 0.0)
    for period in np.arange(low, high + step, step):
        for phase in np.arange(0, period, 0.25):
            indices = np.round(np.arange(phase, len(profile), period)).astype(int)
            indices = indices[indices < len(profile)]
            if len(indices) < 3:
                continue
            score = float(profile[indices].mean())
            if score > best[0]:
                best = (score, float(period), float(phase))
    return best


def detect_cell(array, foreground_boxes):
    scores = Counter()
    for x0, y0, x1, y1 in foreground_boxes:
        region = array[y0:y1, x0:x1]
        for axis in (1, 0):
            profile = edge_profile(region, axis)
            if len(profile) < 40:
                continue
            ranked = []
            for nominal in np.arange(3.0, 26.0, 0.25):
                score, period, _ = fit_axis(profile, nominal, nominal + 0.24, 0.02)
                ranked.append((score, period))
            top = max(score for score, _ in ranked)
            period = min(period for score, period in ranked if score >= top * 0.82)
            scores[round(period * 2) / 2] += 1
    return scores.most_common(1)[0][0] if scores else 8.0


def sample_sprite(array, background_mask, box, nominal, spread):
    x0, y0, x1, y1 = box
    margin = int(round(nominal))
    height, width, _ = array.shape
    left, top = max(0, x0 - margin), max(0, y0 - margin)
    right, bottom = min(width, x1 + margin), min(height, y1 + margin)
    region = array[top:bottom, left:right]
    _, period_x, phase_x = fit_axis(edge_profile(region, 1), nominal * (1 - spread), nominal * (1 + spread))
    _, period_y, phase_y = fit_axis(edge_profile(region, 0), nominal * (1 - spread), nominal * (1 + spread))
    xs = np.arange(left + phase_x + 1, right, period_x)
    ys = np.arange(top + phase_y + 1, bottom, period_y)
    xs = np.concatenate(([xs[0] - period_x], xs))
    ys = np.concatenate(([ys[0] - period_y], ys))
    rows = []
    for cell_top in ys:
        line = []
        for cell_left in xs:
            cx0, cx1 = int(round(cell_left + period_x * 0.25)), int(round(cell_left + period_x * 0.75))
            cy0, cy1 = int(round(cell_top + period_y * 0.25)), int(round(cell_top + period_y * 0.75))
            if cx0 < 0 or cy0 < 0 or cx1 > width or cy1 > height or cx1 <= cx0 or cy1 <= cy0:
                line.append(None)
                continue
            if background_mask[cy0:cy1, cx0:cx1].mean() >= 0.5:
                line.append(None)
                continue
            block = array[cy0:cy1, cx0:cx1].reshape(-1, 3)
            line.append(tuple(int(value) for value in np.median(block, axis=0)))
        rows.append(line)
    filled_rows = [index for index, line in enumerate(rows) if any(cell is not None for cell in line)]
    filled_columns = [index for index in range(len(xs)) if any(rows[row][index] is not None for row in range(len(rows)))]
    if not filled_rows or not filled_columns:
        return None
    r0, r1 = filled_rows[0], filled_rows[-1]
    c0, c1 = filled_columns[0], filled_columns[-1]
    trimmed = [line[c0:c1 + 1] for line in rows[r0:r1 + 1]]
    origin = (float(xs[c0]), float(ys[r0]))
    return {'period': [round(period_x, 3), round(period_y, 3)], 'origin': [round(origin[0], 2), round(origin[1], 2)], 'cells': trimmed}


def hue_name(color):
    red, green, blue = (channel / 255 for channel in color)
    hue, lightness, saturation = colorsys.rgb_to_hls(red, green, blue)
    degrees = hue * 360
    if lightness < 0.13:
        return 'ink'
    if saturation < 0.14:
        return 'white' if lightness > 0.82 else 'grey'
    if lightness > 0.9:
        return 'white'
    if degrees < 18 or degrees >= 340:
        return 'red'
    if degrees < 45:
        return 'brown' if lightness < 0.5 or saturation < 0.55 else 'orange'
    if degrees < 68:
        return 'yellow' if lightness > 0.45 else 'brown'
    if degrees < 165:
        return 'green'
    if degrees < 195:
        return 'teal'
    if degrees < 255:
        return 'blue'
    if degrees < 300:
        return 'purple'
    return 'pink'


def cluster_report(colors, threshold):
    centers = []
    for color, count in Counter(colors).most_common():
        nearest = None
        for index, (center, _) in enumerate(centers):
            distance = sum((color[channel] - center[channel]) ** 2 for channel in range(3)) ** 0.5
            if distance < threshold and (nearest is None or distance < nearest[1]):
                nearest = (index, distance)
        if nearest is None:
            centers.append((color, count))
        else:
            centers[nearest[0]] = (centers[nearest[0]][0], centers[nearest[0]][1] + count)
    return sorted(centers, key=lambda item: (hue_name(item[0]), sum(item[0])))


def reference_tile(array, sprite, scale, grid):
    period_x, period_y = sprite['period']
    origin_x, origin_y = sprite['origin']
    columns = len(sprite['cells'][0])
    rows = len(sprite['cells'])
    x0, y0 = int(round(origin_x)), int(round(origin_y))
    x1, y1 = int(round(origin_x + columns * period_x)), int(round(origin_y + rows * period_y))
    height, width, _ = array.shape
    crop = Image.fromarray(array[max(0, y0):min(height, y1), max(0, x0):min(width, x1)])
    tile = crop.resize((columns * scale, rows * scale), Image.LANCZOS)
    if grid:
        draw = ImageDraw.Draw(tile)
        for column in range(1, columns):
            draw.line([(column * scale, 0), (column * scale, rows * scale)], fill=(255, 0, 255), width=1)
        for row in range(1, rows):
            draw.line([(0, row * scale), (columns * scale, row * scale)], fill=(255, 0, 255), width=1)
    return tile


def cells_tile(sprite, scale):
    columns = len(sprite['cells'][0])
    rows = len(sprite['cells'])
    tile = Image.new('RGB', (columns, rows), BACKGROUND)
    for y, line in enumerate(sprite['cells']):
        for x, color in enumerate(line):
            if color is not None:
                tile.putpixel((x, y), tuple(color))
    return tile.resize((columns * scale, rows * scale), Image.NEAREST)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--image', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--cell', type=float, default=0)
    parser.add_argument('--spread', type=float, default=0.05)
    parser.add_argument('--tolerance', type=float, default=16)
    parser.add_argument('--merge', type=float, default=20)
    parser.add_argument('--min-area', type=int, default=300)
    parser.add_argument('--scale', type=int, default=10)
    parser.add_argument('--cluster', type=float, default=18)
    parser.add_argument('--grid', action='store_true')
    parser.add_argument('--quiet', action='store_true')
    arguments = parser.parse_args()

    array = np.array(Image.open(arguments.image).convert('RGB'))
    corners = np.concatenate([array[:16, :16].reshape(-1, 3), array[:16, -16:].reshape(-1, 3), array[-16:, :16].reshape(-1, 3), array[-16:, -16:].reshape(-1, 3)])
    background = np.median(corners, axis=0)
    background_mask = flood_background(array, background, arguments.tolerance)
    boxes = order_sprites(find_sprites(~background_mask, arguments.merge, arguments.min_area))
    nominal = arguments.cell or detect_cell(array, boxes)
    print('background', tuple(int(value) for value in background), 'nominal cell', nominal, 'sprites', len(boxes))

    sprites = []
    for index, box in enumerate(boxes):
        sampled = sample_sprite(array, background_mask, box, nominal, arguments.spread)
        if sampled is None:
            continue
        sampled['index'] = len(sprites)
        sampled['box'] = list(box)
        sprites.append(sampled)
        print('sprite', sampled['index'], 'box', box, 'cells', f"{len(sampled['cells'][0])}x{len(sampled['cells'])}", 'period', sampled['period'])

    all_colors = [tuple(cell) for sprite in sprites for line in sprite['cells'] for cell in line if cell is not None]
    if not arguments.quiet:
        print('cell color clusters (threshold', arguments.cluster, ')')
        for color, count in cluster_report(all_colors, arguments.cluster):
            print('  #%02x%02x%02x' % color, hue_name(color).ljust(7), count)

    os.makedirs(os.path.dirname(os.path.abspath(arguments.out)), exist_ok=True)
    payload = {
        'image': arguments.image.replace('\\', '/'),
        'background': [int(value) for value in background],
        'nominal': nominal,
        'sprites': [
            {
                'index': sprite['index'],
                'box': sprite['box'],
                'period': sprite['period'],
                'origin': sprite['origin'],
                'rows': [['#%02x%02x%02x' % tuple(cell) if cell is not None else None for cell in line] for line in sprite['cells']],
            }
            for sprite in sprites
        ],
    }
    with open(arguments.out + '.json', 'w', encoding='utf-8') as handle:
        json.dump(payload, handle)
    tiles = []
    for sprite in sprites:
        size = f"{len(sprite['cells'][0])}x{len(sprite['cells'])}"
        tiles.append((f"{sprite['index']} ref {size}", reference_tile(array, sprite, arguments.scale, arguments.grid)))
        tiles.append((f"{sprite['index']} cells", cells_tile(sprite, arguments.scale)))
    labelled_sheet(tiles, columns=4).save(arguments.out + '.png')
    print('wrote', arguments.out + '.json', arguments.out + '.png')


if __name__ == '__main__':
    main()
