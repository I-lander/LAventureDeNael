import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from spritelib import EMPTY, load_art, load_palette, luminance

FOOT_ROWS = 3
LIFT = 1
ART = 'src/tools/spriteBaker/half/GolemHalf.ts'
INK = 'k'


def bob_down(rows):
    matrix = [list(row) for row in rows]
    del matrix[len(matrix) - FOOT_ROWS - 1]
    matrix.insert(0, [EMPTY] * len(rows[0]))
    return matrix


def feet_center(matrix):
    columns = [x for row in matrix[len(matrix) - FOOT_ROWS:] for x, cell in enumerate(row) if cell != EMPTY]
    return (min(columns) + max(columns) + 1) / 2


def lift_foot(matrix, side):
    result = [list(row) for row in matrix]
    middle = int(feet_center(matrix))
    width = len(matrix[0])
    first, last = (0, middle - 1) if side == 'left' else (middle, width - 1)
    for y in range(len(result) - FOOT_ROWS, len(result)):
        for x in range(first, last + 1):
            if result[y][x] != EMPTY:
                result[y - LIFT][x] = result[y][x]
                result[y][x] = EMPTY
    return result


def exposed(matrix, legend, palette):
    height, width = len(matrix), len(matrix[0])
    found = []
    for y in range(height):
        for x in range(width):
            cell = matrix[y][x]
            if cell == EMPTY or cell == INK:
                continue
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if not (0 <= nx < width and 0 <= ny < height) or matrix[ny][nx] == EMPTY:
                    found.append((x, y, cell, round(luminance(palette[legend[cell]]))))
                    break
    return found


def main():
    grids, legends = load_art(ART)
    palette = load_palette()
    legend = legends['GOLEM_LEGEND']
    for name in ('GOLEM_FRONT', 'GOLEM_SIDE', 'GOLEM_BACK'):
        rows = grids[name]
        idle = [list(row) for row in rows]
        lowered = bob_down(rows)
        frames = {'idle': idle, 'attack': lowered, 'walk left': lift_foot(lowered, 'left'), 'walk right': lift_foot(lowered, 'right')}
        for label, matrix in frames.items():
            print(name, label, 'non-ink edge cells:', exposed(matrix, legend, palette))


if __name__ == '__main__':
    main()
