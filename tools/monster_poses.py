import math

from spritelib import BACKGROUND, EMPTY, grid_colors, labelled_sheet, load_art, load_palette, luminance, outside_mask, render_colors

ART = 'src/tools/spriteBaker/half/MonsterHalf.ts'
OUT = 'sprite-preview/audit/monster-poses.png'
GAP = (0, 255, 255)
SLIMES = ['SLIME_FRONT', 'SLIME_SIDE', 'SLIME_BACK']
WALKERS = ['ARCHER_FRONT', 'ARCHER_SIDE', 'ARCHER_BACK', 'BOMBER_FRONT']
FOOT_ROWS = 3


def js_round(value):
    return math.floor(value + 0.5)


def squash_down(rows, removed):
    matrix = [list(row) for row in rows]
    height = len(matrix)
    width = len(matrix[0])
    for index in range(removed, 0, -1):
        del matrix[js_round(height * index / (removed + 1))]
    return [EMPTY * width for _ in range(removed)] + [''.join(row) for row in matrix]


def bob_down(rows, foot_rows):
    matrix = list(rows)
    del matrix[len(matrix) - foot_rows - 1]
    return [EMPTY * len(rows[0])] + matrix


def lift_foot(rows, side, foot_rows, lift):
    matrix = [list(row) for row in rows]
    first = len(matrix) - foot_rows
    columns = [x for row in matrix[first:] for x, cell in enumerate(row) if cell != EMPTY]
    middle = math.floor((min(columns) + max(columns) + 1) / 2)
    span = range(0, middle) if side == 'left' else range(middle, len(matrix[0]))
    for row_index in range(first, len(matrix)):
        for column in span:
            cell = matrix[row_index][column]
            if cell == EMPTY:
                continue
            matrix[row_index - lift][column] = cell
            matrix[row_index][column] = EMPTY
    return [''.join(row) for row in matrix]


def exposed_light(colors):
    opaque = [[color is not None for color in row] for row in colors]
    outside = outside_mask(opaque)
    height, width = len(colors), len(colors[0])
    found = []
    for y in range(height):
        for x in range(width):
            if not opaque[y][x] or luminance(colors[y][x]) <= 80:
                continue
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if not (0 <= nx < width and 0 <= ny < height) or outside[ny][nx]:
                    found.append((x, y))
                    break
    return found


def main():
    grids, legends = load_art(ART)
    palette = load_palette()
    legend = legends['MONSTER_LEGEND']
    frames = []
    for name in SLIMES:
        frames.append((f'{name} squash', squash_down(grids[name], 2)))
    for name in WALKERS:
        lowered = bob_down(grids[name], FOOT_ROWS)
        frames.append((f'{name} attack', lowered))
        frames.append((f'{name} walk L', lift_foot(lowered, 'left', FOOT_ROWS, 1)))
        frames.append((f'{name} walk R', lift_foot(lowered, 'right', FOOT_ROWS, 1)))
    tiles = []
    for label, rows in frames:
        colors = grid_colors(rows, legend, palette)
        gaps = exposed_light(colors)
        print(label, 'light edge cells', gaps)
        tiles.append((label, render_colors(colors, 8, BACKGROUND)))
        flagged = [list(row) for row in colors]
        for x, y in gaps:
            flagged[y][x] = GAP
        tiles.append((label + ' flags', render_colors(flagged, 8, BACKGROUND)))
    labelled_sheet(tiles, columns=6).save(OUT)
    print('wrote', OUT)


if __name__ == '__main__':
    main()
