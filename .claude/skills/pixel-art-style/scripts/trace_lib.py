import re

Cells = dict
Spec = list


def load_trace(path: str) -> list:
    return [list(row) for row in open(path, encoding='utf-8').read().split('\n')]


def read_part_mask(art_path: str, part_name: str) -> set:
    source = open(art_path, encoding='utf-8').read()
    match = re.search(r'const ' + re.escape(part_name) + r': PixelPart = \{\n  left: (-?\d+),\n  top: (-?\d+),\n  rows: \[\n(.*?)\n  \],', source, re.S)
    if not match:
        raise ValueError(f'part {part_name} not found in {art_path}')
    left, top = int(match.group(1)), int(match.group(2))
    mask = set()
    for row_index, row in enumerate(re.findall(r"'([^']*)'", match.group(3))):
        for column_index, symbol in enumerate(row):
            if symbol != '.':
                mask.add((left + column_index, top + row_index))
    return mask


def cells_to_spec(cells: Cells) -> Spec:
    by_row = {}
    for (x, y), symbol in cells.items():
        by_row.setdefault(y, {})[x] = symbol
    spec = []
    for y in sorted(by_row):
        columns = sorted(by_row[y])
        segments = []
        start = columns[0]
        text = ''
        previous = start - 1
        for x in columns:
            if x != previous + 1:
                segments.append((start, text))
                start, text = x, ''
            text += by_row[y][x]
            previous = x
        segments.append((start, text))
        spec.append((y, segments))
    return spec


def spec_to_rows(spec: Spec) -> tuple:
    top = min(y for y, _ in spec)
    rows = {}
    for y, segments in spec:
        line = rows.setdefault(y, [])
        for x, pattern in segments:
            while len(line) < x + len(pattern):
                line.append('.')
            for index, symbol in enumerate(pattern):
                if symbol != ' ':
                    line[x + index] = symbol
    bottom = max(rows)
    return top, [''.join(rows.get(y, [])).rstrip('.') for y in range(top, bottom + 1)]


def keep_inside_canvas(cells: Cells, max_column: int) -> None:
    for x, y in [cell for cell in cells if cell[0] > max_column]:
        del cells[(x, y)]
        cells[(max_column, y)] = 'o'


def show(parts: dict, order: list, size: int = 64) -> str:
    canvas = [['.'] * size for _ in range(size)]
    for name in order:
        for y, segments in parts[name]:
            for x, pattern in segments:
                for index, symbol in enumerate(pattern):
                    column = x + index
                    if symbol not in ' .' and 0 <= y < size and 0 <= column < size:
                        canvas[y][column] = symbol
    return '\n'.join(f'{y:2d} ' + ''.join(row) for y, row in enumerate(canvas))
