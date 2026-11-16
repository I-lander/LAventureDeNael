import argparse
import math
import os

from audit_sprites import fragments
from spritelib import EMPTY, grid_colors, labelled_sheet, load_art, load_palette, luminance, render_colors

VIEWS = ['HERO_SOUTH', 'HERO_SOUTH_EAST', 'HERO_EAST', 'HERO_NORTH_EAST', 'HERO_NORTH']
FOOT_ROWS = 4
FOOT_LIFT = 1
BOX_WIDTH = 30
BOX_HEIGHT = 30
GRASS = (0x6a, 0xa8, 0x4a)
DARK_LUMINANCE = 80


def to_matrix(rows):
    width = max(len(row) for row in rows)
    return [list(row.ljust(width, EMPTY)) for row in rows]


def feet_center(matrix, foot_rows):
    columns = [x for row in matrix[len(matrix) - foot_rows:] for x, cell in enumerate(row) if cell != EMPTY]
    return (min(columns) + max(columns) + 1) / 2


def bob_down(rows, foot_rows):
    matrix = to_matrix(rows)
    width = len(matrix[0])
    del matrix[len(matrix) - foot_rows - 1]
    matrix.insert(0, [EMPTY] * width)
    return [''.join(cells) for cells in matrix]


def lift_foot(rows, side, foot_rows, lift):
    matrix = to_matrix(rows)
    width = len(matrix[0])
    first_foot_row = len(matrix) - foot_rows
    middle = math.floor(feet_center(matrix, foot_rows))
    first_column = 0 if side == 'left' else middle
    last_column = middle - 1 if side == 'left' else width - 1
    for row_index in range(first_foot_row, len(matrix)):
        for column in range(first_column, last_column + 1):
            cell = matrix[row_index][column]
            if cell == EMPTY:
                continue
            matrix[row_index - lift][column] = cell
            matrix[row_index][column] = EMPTY
    return [''.join(cells) for cells in matrix]


def walk_pose(rows, step):
    if step in ('a', 'c'):
        return rows
    return lift_foot(bob_down(rows, FOOT_ROWS), 'left' if step == 'b' else 'right', FOOT_ROWS, FOOT_LIFT)


def open_cells(colors):
    height, width = len(colors), len(colors[0])
    found = []
    for y in range(height):
        for x in range(width):
            color = colors[y][x]
            if color is None or luminance(color) <= DARK_LUMINANCE:
                continue
            if y + 1 >= height or colors[y + 1][x] is None:
                found.append((x, y))
    return found


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--file', default='src/tools/spriteBaker/half/HeroHalf.ts')
    parser.add_argument('--out', default='sprite-preview/audit/hero-walk.png')
    parser.add_argument('--scale', type=int, default=8)
    arguments = parser.parse_args()
    palette = load_palette()
    grids, legends = load_art(arguments.file)
    legend = legends['HERO_LEGEND']
    tiles = []
    problems = 0
    for name in VIEWS:
        for step in 'abcd':
            rows = walk_pose(grids[name], step)
            colors = grid_colors(rows, legend, palette)
            opaque = [[color is not None for color in row] for row in colors]
            groups = fragments(opaque)
            opened = open_cells(colors)
            matrix = to_matrix(rows)
            offset = round(BOX_WIDTH / 2 - feet_center(matrix, FOOT_ROWS))
            status = 'OK'
            if len(groups) > 1 or opened:
                status = 'PROBLEM'
                problems += 1
            print(f'{status} {name} {step}: fragments {len(groups)}, cells without ink below {opened}, frame x {offset}')
            tiles.append((f'{name[5:]} {step}', render_colors(colors, arguments.scale)))
    os.makedirs(os.path.dirname(os.path.abspath(arguments.out)), exist_ok=True)
    labelled_sheet(tiles, columns=4, background=GRASS, label_color=(20, 30, 20)).save(arguments.out)
    print(f'TOTAL {problems} problems, wrote {arguments.out}')


if __name__ == '__main__':
    main()
