import argparse


def read_rows(path):
    with open(path, encoding='utf-8') as handle:
        rows = [line.rstrip('\n') for line in handle if line.strip()]
    width = max(len(row) for row in rows)
    return [row.ljust(width, '.') for row in rows]


def ring(rows, ink, dark):
    height, width = len(rows), len(rows[0])
    result = [list(row) for row in rows]
    for y in range(height):
        for x in range(width):
            if rows[y][x] != '.':
                continue
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < width and 0 <= ny < height and rows[ny][nx] != '.' and rows[ny][nx] not in dark:
                    result[y][x] = ink
                    break
    return [''.join(row) for row in result]


def outside_cells(rows):
    height, width = len(rows), len(rows[0])
    reached = set()
    stack = [(x, y) for y in range(height) for x in range(width) if (x in (0, width - 1) or y in (0, height - 1)) and rows[y][x] == '.']
    reached.update(stack)
    while stack:
        x, y = stack.pop()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < width and 0 <= ny < height and rows[ny][nx] == '.' and (nx, ny) not in reached:
                reached.add((nx, ny))
                stack.append((nx, ny))
    return reached


def seal(rows, ink):
    height, width = len(rows), len(rows[0])
    grid = [list(row) for row in rows]
    changed = True
    while changed:
        changed = False
        current = [''.join(row) for row in grid]
        outside = outside_cells(current)
        for y in range(height):
            for x in range(width):
                if grid[y][x] != '.':
                    continue
                filled = sum(1 for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)) if 0 <= nx < width and 0 <= ny < height and grid[ny][nx] != '.')
                if (x, y) not in outside or filled >= 3:
                    grid[y][x] = ink
                    changed = True
    return [''.join(row) for row in grid]


def exposed(rows, dark):
    height, width = len(rows), len(rows[0])
    found = []
    for y in range(height):
        for x in range(width):
            if rows[y][x] == '.' or rows[y][x] in dark:
                continue
            if x in (0, width - 1) or y in (0, height - 1):
                found.append((x, y))
    return found


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--fill', required=True)
    parser.add_argument('--ink', default='k')
    parser.add_argument('--dark', default='k')
    arguments = parser.parse_args()
    rows = read_rows(arguments.fill)
    dark = set(arguments.dark)
    lengths = sorted({len(row) for row in rows})
    print('size', f'{len(rows[0])}x{len(rows)}', 'row lengths', lengths)
    border = exposed(rows, dark)
    if border:
        print('light cells on the canvas border (no room for ink):', border)
    for row in seal(ring(rows, arguments.ink, dark), arguments.ink):
        print(f"  '{row}',")


if __name__ == '__main__':
    main()
