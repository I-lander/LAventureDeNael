import argparse
import json
import os
import re
from collections import Counter, deque

import numpy as np
from PIL import Image

from ref_extract import cells_tile, reference_tile
from ref_quantize import load_cells, perceptual_distance
from spritelib import (
    BACKGROUND,
    EMPTY,
    COLOR_PATTERN,
    palette_paths,
    grid_colors,
    labelled_sheet,
    legend_for,
    load_art,
    load_palette,
    luminance,
    outside_mask,
    read_text,
    render_colors,
)

HOLE = (255, 0, 255)
STRAY = (255, 255, 0)
GAP = (0, 255, 255)
GRASS = (0x6a, 0xa8, 0x4a)
DARK_LUMINANCE = 80
NEAR_DUPLICATE = 50
STRAY_DISTANCE = 150
MAX_COLORS = 16


def neighbours4(x, y):
    return ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))


def neighbours8(x, y):
    return [(x + dx, y + dy) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dx or dy]


def inside(x, y, width, height):
    return 0 <= x < width and 0 <= y < height


def fragments(opaque):
    height, width = len(opaque), len(opaque[0])
    seen = [[False] * width for _ in range(height)]
    groups = []
    for start_y in range(height):
        for start_x in range(width):
            if not opaque[start_y][start_x] or seen[start_y][start_x]:
                continue
            seen[start_y][start_x] = True
            queue = deque([(start_x, start_y)])
            cells = []
            while queue:
                x, y = queue.popleft()
                cells.append((x, y))
                for nx, ny in neighbours8(x, y):
                    if inside(nx, ny, width, height) and opaque[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = True
                        queue.append((nx, ny))
            groups.append(cells)
    return sorted(groups, key=len, reverse=True)


def feet_center(opaque, foot_rows):
    columns = [x for row in opaque[len(opaque) - foot_rows:] for x, filled in enumerate(row) if filled]
    return (min(columns) + max(columns) + 1) / 2


def box_issue(opaque, box):
    box_width, box_height, foot_rows = box
    height, width = len(opaque), len(opaque[0])
    x = round(box_width / 2 - feet_center(opaque, foot_rows))
    y = box_height - height
    if x < 0 or y < 0 or x + width > box_width:
        return f'does not fit its {box_width}x{box_height} frame (x {x}, y {y}, width {width})'
    return None


def align(sprite_opaque, reference_cells):
    height, width = len(sprite_opaque), len(sprite_opaque[0])
    ref_height, ref_width = len(reference_cells), len(reference_cells[0])
    best = None
    for offset_y in range(-3, 4):
        for offset_x in range(-3, 4):
            overlap = 0
            for y in range(height):
                for x in range(width):
                    ref_x, ref_y = x + offset_x, y + offset_y
                    ref_filled = inside(ref_x, ref_y, ref_width, ref_height) and reference_cells[ref_y][ref_x] is not None
                    if sprite_opaque[y][x] and ref_filled:
                        overlap += 1
            score = (overlap, -abs(offset_x) - abs(offset_y))
            if best is None or score > best[0]:
                best = (score, offset_x, offset_y)
    return best[1], best[2]


def audit_sprite(name, rows, legend, palette, box, limit, reference_cells):
    errors, warnings, info = [], [], []
    unknown = sorted({symbol for row in rows for symbol in row if symbol != EMPTY and symbol not in legend})
    if unknown:
        errors.append(f'symbols without legend entry: {unknown}')
    missing = sorted({legend[symbol] for row in rows for symbol in row if symbol in legend and legend[symbol] not in palette})
    if missing:
        errors.append(f'legend keys missing from the palette: {missing}')
    colors = grid_colors(rows, legend, palette)
    height, width = len(colors), len(colors[0])
    opaque = [[color is not None for color in row] for row in colors]
    outside = outside_mask(opaque)
    overlay = [list(row) for row in colors]

    holes = [(x, y) for y in range(height) for x in range(width) if not opaque[y][x] and not outside[y][x]]
    if holes:
        errors.append(f'{len(holes)} enclosed empty cells (holes) at {holes[:20]}')
        for x, y in holes:
            overlay[y][x] = HOLE

    notches = []
    for y in range(height):
        for x in range(width):
            if opaque[y][x] or not outside[y][x]:
                continue
            filled = sum(1 for nx, ny in neighbours4(x, y) if inside(nx, ny, width, height) and opaque[ny][nx])
            if filled >= 3:
                notches.append((x, y))
    if notches:
        warnings.append(f'{len(notches)} one-cell notches in the silhouette at {notches[:20]}')
        for x, y in notches:
            overlay[y][x] = HOLE

    strays = []
    for y in range(height):
        for x in range(width):
            if not opaque[y][x]:
                continue
            close = any(
                inside(nx, ny, width, height) and colors[ny][nx] is not None and perceptual_distance(colors[ny][nx], colors[y][x]) < STRAY_DISTANCE
                for nx, ny in neighbours8(x, y)
            )
            if not close:
                strays.append((x, y))
                overlay[y][x] = STRAY
    if strays:
        warnings.append(f'{len(strays)} lone cells whose color matches none of their neighbours (yellow, keep only deliberate ones: eye, glint) at {strays[:30]}')

    groups = fragments(opaque)
    if len(groups) > 1:
        detail = [(len(cells), cells[0]) for cells in groups[1:]]
        warnings.append(f'{len(groups) - 1} detached fragments (size, first cell): {detail[:10]}')

    gaps = []
    edge_count = 0
    for y in range(height):
        for x in range(width):
            if not opaque[y][x]:
                continue
            exposed = any(not inside(nx, ny, width, height) or outside[ny][nx] for nx, ny in neighbours4(x, y))
            if not exposed:
                continue
            edge_count += 1
            if luminance(colors[y][x]) > DARK_LUMINANCE:
                gaps.append((x, y))
                overlay[y][x] = GAP
    if gaps:
        share = round(100 * len(gaps) / max(edge_count, 1))
        warnings.append(f'{len(gaps)} silhouette edge cells are not dark outline ({share}% of the edge) at {gaps[:20]}')

    used = Counter(color for row in colors for color in row if color is not None)
    info.append(f'{width}x{height}, {len(used)} colors')
    if len(used) > MAX_COLORS:
        warnings.append(f'{len(used)} colors (target is {MAX_COLORS} or fewer per sprite)')
    key_of = {}
    for symbol, key in legend.items():
        if key in palette:
            key_of.setdefault(palette[key], key)
    listed = sorted(used)
    twins = []
    for first_index, first in enumerate(listed):
        for second in listed[first_index + 1:]:
            if perceptual_distance(first, second) < NEAR_DUPLICATE:
                twins.append(f'{key_of.get(first)}~{key_of.get(second)}')
    if twins:
        warnings.append(f'near-duplicate tones used together: {twins[:10]}')

    if box:
        issue = box_issue(opaque, box)
        if issue:
            errors.append(issue)
    if limit and (width > limit[0] or height > limit[1]):
        errors.append(f'{width}x{height} is larger than the allowed {limit[0]}x{limit[1]}')
    ragged = sorted({len(row) for row in rows})
    if len(ragged) > 1:
        errors.append(f'rows have different lengths: {ragged}')

    diff_tile = None
    if reference_cells is not None:
        offset_x, offset_y = align(opaque, reference_cells)
        ref_height, ref_width = len(reference_cells), len(reference_cells[0])
        only_sprite = only_reference = far = compared = 0
        total_distance = 0.0
        diff = [[None] * width for _ in range(height)]
        for y in range(height):
            for x in range(width):
                ref_x, ref_y = x + offset_x, y + offset_y
                ref_color = reference_cells[ref_y][ref_x] if inside(ref_x, ref_y, ref_width, ref_height) else None
                if opaque[y][x] and ref_color is None:
                    only_sprite += 1
                    diff[y][x] = (0, 255, 0)
                elif not opaque[y][x] and ref_color is not None:
                    only_reference += 1
                    diff[y][x] = (255, 0, 0)
                elif opaque[y][x]:
                    distance = perceptual_distance(colors[y][x], ref_color)
                    compared += 1
                    total_distance += distance
                    if distance > 90:
                        far += 1
                        diff[y][x] = (255, 160, 0)
                    else:
                        diff[y][x] = (40, 40, 48)
        mean = round(total_distance / max(compared, 1), 1)
        info.append(
            f'vs reference {ref_width}x{ref_height} (offset {offset_x},{offset_y}): '
            f'{only_sprite} cells added, {only_reference} cells missing, {far} cells of a different color, mean distance {mean}'
        )
        if only_reference > max(2, compared * 0.03):
            warnings.append(f'{only_reference} cells of the reference are missing from the sprite (red in the diff tile)')
        if only_sprite > max(2, compared * 0.03):
            warnings.append(f'{only_sprite} cells were added outside the reference silhouette (green in the diff tile)')
        if far > compared * 0.08:
            warnings.append(f'{far} cells differ strongly in color from the reference (orange in the diff tile)')
        diff_tile = diff
    return errors, warnings, info, colors, overlay, diff_tile


def duplicate_palette_keys():
    seen = {}
    duplicates = []
    for path in palette_paths():
        file_name = os.path.basename(path)
        for key, _ in COLOR_PATTERN.findall(read_text(path)):
            if key in seen and seen[key] != file_name:
                duplicates.append(f'{key} ({seen[key]} and {file_name})')
            seen[key] = file_name
    return duplicates


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--family', required=True)
    parser.add_argument('--out', default='')
    parser.add_argument('--scale', type=int, default=10)
    parser.add_argument('--names', default='')
    arguments = parser.parse_args()

    with open(arguments.family, encoding='utf-8') as handle:
        family = json.load(handle)
    palette = load_palette()
    grids, legends = load_art(family['art'])
    cells_cache = {}
    image_cache = {}
    wanted = [name for name in arguments.names.split(',') if name]
    tiles = []
    game_tiles = []
    total_errors = total_warnings = 0
    listed = {entry['name'] for entry in family['sprites']}
    for name in grids:
        if name not in listed:
            print(f'NOTE {name}: grid in the art file but not listed in the family file')
    for entry in family['sprites']:
        name = entry['name']
        if wanted and name not in wanted:
            continue
        if name not in grids:
            print(f'ERROR {name}: grid not found in {family["art"]}')
            total_errors += 1
            continue
        rows = grids[name]
        legend_names = entry.get('legends') or [entry.get('legend') or legend_for(rows, legends)[0]]
        reference_cells = None
        reference_sprite = None
        if entry.get('cells') and entry.get('index') is not None:
            if entry['cells'] not in cells_cache:
                cells_cache[entry['cells']] = load_cells(entry['cells'])
            payload = cells_cache[entry['cells']]
            reference_sprite = payload['sprites'][entry['index']]
            reference_cells = reference_sprite['cells']
            if payload['image'] not in image_cache:
                image_cache[payload['image']] = np.array(Image.open(payload['image']).convert('RGB'))
        for position, legend_name in enumerate(legend_names):
            if legend_name not in legends:
                print(f'ERROR {name}: legend {legend_name} not found')
                total_errors += 1
                continue
            label = name if position == 0 else f'{name}[{legend_name}]'
            errors, warnings, info, colors, overlay, diff = audit_sprite(
                name, rows, legends[legend_name], palette, entry.get('box'), entry.get('max'), reference_cells if position == 0 else None
            )
            total_errors += len(errors)
            total_warnings += len(warnings)
            status = 'ERROR' if errors else ('WARN' if warnings else 'OK')
            print(f'{status} {label}: {"; ".join(info)}')
            for message in errors:
                print(f'   ERROR {message}')
            for message in warnings:
                print(f'   warn  {message}')
            if position == 0 and reference_sprite is not None:
                tiles.append((f'{name} reference', reference_tile(image_cache[cells_cache[entry["cells"]]['image']], reference_sprite, arguments.scale, False)))
            tiles.append((f'{label} sprite', render_colors(colors, arguments.scale, BACKGROUND)))
            tiles.append((f'{label} flags', render_colors(overlay, arguments.scale, BACKGROUND)))
            if diff is not None:
                tiles.append((f'{name} diff', render_colors(diff, arguments.scale, BACKGROUND)))
            game_tiles.append((label[:18], render_colors(colors, 3)))
    duplicates = duplicate_palette_keys()
    if duplicates:
        total_errors += 1
        print('ERROR palette keys defined in two files:', duplicates[:20])
    print(f'TOTAL {total_errors} errors, {total_warnings} warnings')
    if arguments.out:
        os.makedirs(os.path.dirname(os.path.abspath(arguments.out)), exist_ok=True)
        labelled_sheet(tiles, columns=4).save(arguments.out + '.png')
        labelled_sheet(game_tiles, columns=8, gap=12, background=GRASS, label_color=(20, 30, 20)).save(arguments.out + '-game.png')
        print('wrote', arguments.out + '.png', arguments.out + '-game.png')


if __name__ == '__main__':
    main()
