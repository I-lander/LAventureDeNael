import argparse
import colorsys
import json
from collections import Counter, deque

import numpy as np
from PIL import Image

SYMBOLS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&()*+,-/:;<=>?@[]^_{|}~'


def edge_profile(array, axis):
    diff = np.abs(np.diff(array.astype(np.int32), axis=axis)).sum(axis=2)
    return diff.sum(axis=0 if axis == 1 else 1).astype(np.float64)


def fit_grid(profile, nominal):
    best = (-1, nominal, 0)
    for period in np.arange(nominal - 0.12, nominal + 0.12, 0.004):
        for phase in np.arange(0, period, 0.5):
            indices = np.round(np.arange(phase, len(profile) - 1, period)).astype(int)
            indices = indices[indices < len(profile)]
            score = profile[indices].mean()
            if score > best[0]:
                best = (score, period, phase)
    return best[1], best[2]


def cell_colors(array, period_x, phase_x, period_y, phase_y):
    height, width, _ = array.shape
    xs = np.arange(phase_x + 1 - period_x, width, period_x)
    ys = np.arange(phase_y + 1 - period_y, height, period_y)
    grid = np.zeros((len(ys), len(xs), 3), dtype=np.int32)
    valid = np.zeros((len(ys), len(xs)), dtype=bool)
    for row, top in enumerate(ys):
        for column, left in enumerate(xs):
            x0, x1 = int(round(left + period_x * 0.25)), int(round(left + period_x * 0.75))
            y0, y1 = int(round(top + period_y * 0.25)), int(round(top + period_y * 0.75))
            if x0 < 0 or y0 < 0 or x1 > width or y1 > height or x1 <= x0 or y1 <= y0:
                continue
            block = array[y0:y1, x0:x1].reshape(-1, 3)
            grid[row, column] = np.median(block, axis=0)
            valid[row, column] = True
    return grid, valid


def components(mask, min_cells, attach_gap):
    height, width = mask.shape
    labels = -np.ones(mask.shape, dtype=int)
    groups = []
    for start_y in range(height):
        for start_x in range(width):
            if not mask[start_y, start_x] or labels[start_y, start_x] >= 0:
                continue
            index = len(groups)
            queue = deque([(start_x, start_y)])
            labels[start_y, start_x] = index
            cells = []
            while queue:
                x, y = queue.popleft()
                cells.append((x, y))
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < width and 0 <= ny < height and mask[ny, nx] and labels[ny, nx] < 0:
                            labels[ny, nx] = index
                            queue.append((nx, ny))
            groups.append(cells)
    big = [cells for cells in groups if len(cells) >= min_cells]
    small = [cells for cells in groups if len(cells) < min_cells]

    def bounds(cells):
        xs = [x for x, _ in cells]
        ys = [y for _, y in cells]
        return min(xs), min(ys), max(xs), max(ys)

    for cells in small:
        sx0, sy0, sx1, sy1 = bounds(cells)
        for target in big:
            bx0, by0, bx1, by1 = bounds(target)
            if sx0 <= bx1 + attach_gap and sx1 >= bx0 - attach_gap and sy0 <= by1 + attach_gap and sy1 >= by0 - attach_gap:
                target.extend(cells)
                break
    return [(bounds(cells), cells) for cells in big]


def cluster_colors(colors, threshold, min_count):
    counts = Counter(colors)
    centers = []
    assignment = {}
    for color, count in counts.most_common():
        nearest = None
        for index, (center, _) in enumerate(centers):
            distance = sum((color[channel] - center[channel]) ** 2 for channel in range(3)) ** 0.5
            if distance < threshold and (nearest is None or distance < nearest[1]):
                nearest = (index, distance)
        if nearest is None:
            centers.append((color, count))
            assignment[color] = len(centers) - 1
        else:
            index = nearest[0]
            centers[index] = (centers[index][0], centers[index][1] + count)
            assignment[color] = index
    kept = [index for index, (_, count) in enumerate(centers) if count >= min_count]
    remap = {}
    for index, (center, _) in enumerate(centers):
        if index in kept:
            remap[index] = kept.index(index)
        else:
            nearest = min(kept, key=lambda other: sum((center[channel] - centers[other][0][channel]) ** 2 for channel in range(3)))
            remap[index] = kept.index(nearest)
    members = {}
    for color, count in counts.items():
        members.setdefault(remap[assignment[color]], []).append((color, count))
    palette = []
    for index in range(len(kept)):
        total = sum(count for _, count in members[index])
        palette.append(tuple(int(round(sum(color[channel] * count for color, count in members[index]) / total)) for channel in range(3)))
    return palette, {color: remap[assignment[color]] for color in counts}


def hue_name(color):
    red, green, blue = (channel / 255 for channel in color)
    hue, lightness, saturation = colorsys.rgb_to_hls(red, green, blue)
    degrees = hue * 360
    if lightness < 0.13:
        return 'Ink'
    if saturation < 0.14:
        return 'White' if lightness > 0.82 else 'Grey'
    if lightness > 0.9:
        return 'White'
    if degrees < 18 or degrees >= 340:
        return 'Red'
    if degrees < 45:
        return 'Brown' if lightness < 0.5 or saturation < 0.55 else 'Orange'
    if degrees < 68:
        return 'Yellow' if lightness > 0.45 else 'Brown'
    if degrees < 165:
        return 'Green'
    if degrees < 195:
        return 'Teal'
    if degrees < 255:
        return 'Blue'
    if degrees < 300:
        return 'Purple'
    return 'Pink'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--image', required=True)
    parser.add_argument('--cell', type=float, required=True)
    parser.add_argument('--family', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--threshold', type=float, default=26)
    parser.add_argument('--min-count', type=int, default=4)
    parser.add_argument('--min-cells', type=int, default=40)
    parser.add_argument('--background-tolerance', type=float, default=22)
    arguments = parser.parse_args()

    array = np.array(Image.open(arguments.image).convert('RGB'))
    period_x, phase_x = fit_grid(edge_profile(array, 1), arguments.cell)
    period_y, phase_y = fit_grid(edge_profile(array, 0), arguments.cell)
    print('grid', round(period_x, 3), phase_x, round(period_y, 3), phase_y)
    grid, valid = cell_colors(array, period_x, phase_x, period_y, phase_y)
    background = np.median(array[:24, :24].reshape(-1, 3), axis=0)
    distance = np.sqrt(((grid - background) ** 2).sum(axis=2))
    mask = valid & (distance > arguments.background_tolerance)
    sprites = components(mask, arguments.min_cells, 3)
    sprites.sort(key=lambda sprite: (round((sprite[0][1] + sprite[0][3]) / 2 / 40), sprite[0][0]))

    all_colors = [tuple(int(value) for value in grid[y, x]) for _, cells in sprites for x, y in cells]
    palette, assignment = cluster_colors(all_colors, arguments.threshold, arguments.min_count)
    order = sorted(range(len(palette)), key=lambda index: (hue_name(palette[index]), sum(palette[index])))
    names = {}
    seen = Counter()
    for index in order:
        name = hue_name(palette[index])
        seen[name] += 1
        names[index] = f'{arguments.family}{name}{seen[name]}'
    symbols = {index: SYMBOLS[position] for position, index in enumerate(order)}

    result = {'palette': [{'name': names[index], 'symbol': symbols[index], 'rgb': palette[index]} for index in order], 'sprites': []}
    for (x0, y0, x1, y1), cells in sprites:
        rows = [['.'] * (x1 - x0 + 1) for _ in range(y1 - y0 + 1)]
        for x, y in cells:
            rows[y - y0][x - x0] = symbols[assignment[tuple(int(value) for value in grid[y, x])]]
        result['sprites'].append({'box': [x0, y0, x1, y1], 'rows': [''.join(row) for row in rows]})
        print('sprite', len(result['sprites']) - 1, 'size', x1 - x0 + 1, 'x', y1 - y0 + 1)
    print('colors', len(palette))
    for entry in result['palette']:
        print(' ', entry['symbol'], entry['name'], '#%02x%02x%02x' % tuple(entry['rgb']))
    with open(arguments.out + '.json', 'w', encoding='utf-8') as handle:
        json.dump(result, handle, indent=1)

    by_symbol = {entry['symbol']: tuple(entry['rgb']) for entry in result['palette']}
    scale = 5
    gap = 4
    width = sum(len(sprite['rows'][0]) + gap for sprite in result['sprites']) + gap
    height = max(len(sprite['rows']) for sprite in result['sprites']) + gap * 2
    preview = Image.new('RGB', (width, height), (0x2a, 0x20, 0x30))
    cursor = gap
    for sprite in result['sprites']:
        for y, row in enumerate(sprite['rows']):
            for x, symbol in enumerate(row):
                if symbol != '.':
                    preview.putpixel((cursor + x, gap + y), by_symbol[symbol])
        cursor += len(sprite['rows'][0]) + gap
    preview.resize((width * scale, height * scale), Image.NEAREST).save(arguments.out + '.png')


if __name__ == '__main__':
    main()
