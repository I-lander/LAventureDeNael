EMPTY = '.'

BASE = [
    '........................',
    '........................',
    '........................',
    '..xxxxxxxxxxxxxxxxxxxx..',
    '.xuuuuuuuuuuuuuuuuuuuux.',
    'xuuuuuuuuuuuuuuuuuuuuuux',
    'xuuuuuuuuuuuuuuuuuuuuuux',
    'xuuuuuuuuuuuuuuuuuuuuuux',
    '.xuuuuuuuuuuuuuuuuuuuuux',
    '.xuuuuuuuuuuuuuuuuuuuux.',
    'xuuuuuuuuuuuuuuuuuuuuux.',
    'xuuuuuuuuuuuuuuuuuuuuuux',
    'xuuuuuuuuuuuuuuuuuuuuuux',
    'xvuuvvuuuvuuvvuuuvvuuvvx',
    '.xvvvvvvvvvvvvvvvvvvvvx.',
    '..xxxxxxxxxxxxxxxxxxxx..',
]

BLOSSOMS = [
    (3, 4, 'r', 'y', 's'),
    (6, 6, 'r', 'y', 's'),
    (11, 2, 'y', 'z', 'y'),
    (14, 5, 'y', 'z', 'y'),
    (18, 3, 'w', 'y', 'w'),
    (21, 6, 'w', 'y', 'w'),
    (3, 9, 'w', 'z', 'w'),
    (6, 11, 'w', 'z', 'w'),
    (11, 9, 'q', 'r', 'q'),
    (14, 11, 'q', 'r', 'q'),
    (18, 9, 'b', 'y', 'a'),
    (21, 11, 'b', 'y', 'a'),
]

EXTRA = {
    (11, 0): 'k', (9, 2): 'k', (13, 2): 'k',
    (18, 1): 'k', (16, 3): 'k', (20, 3): 'k',
    (3, 2): 'k', (1, 4): 'k',
    (22, 10): 'x',
}


def main():
    canvas = [list(row) for row in BASE]
    height = len(canvas)
    width = len(canvas[0])
    for center_x, center_y, petal, heart, shade in BLOSSOMS:
        top = 'k' if center_y <= 4 else 'v'
        for offset_x in (-1, 1):
            canvas[center_y - 1][center_x + offset_x] = top
    for center_x, center_y, petal, heart, shade in BLOSSOMS:
        for offset_x in (-1, 1):
            canvas[center_y + 1][center_x + offset_x] = 'k'
        stem_y = center_y + 2
        if stem_y < height and canvas[stem_y][center_x] in ('u', 'v'):
            canvas[stem_y][center_x] = 'k'
    for center_x, center_y, petal, heart, shade in BLOSSOMS:
        canvas[center_y - 1][center_x] = petal
        canvas[center_y][center_x - 1] = petal
        canvas[center_y][center_x + 1] = petal
        canvas[center_y + 1][center_x] = shade
        canvas[center_y][center_x] = heart
    for (x, y), symbol in EXTRA.items():
        canvas[y][x] = symbol
    for row in canvas:
        assert len(row) == width
        print("  '" + ''.join(row) + "',")


if __name__ == '__main__':
    main()
