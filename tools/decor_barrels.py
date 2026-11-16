EMPTY = '.'
WIDTH = 23
HEIGHT = 21

BARREL = [
    '...kkkkkk...',
    '..kooooook..',
    '.kommmnnnok.',
    '.kpmnnnnnpk.',
    '.kopnnnnpnk.',
    'koooppppnnnk',
    'knoooonnnmmk',
    'keeeeeeedddk',
    'knoooonnnmmk',
    'knoooonnnmmk',
    'knoooonnnmmk',
    '.keeeeedddk.',
    '.knnnnnnmmk.',
    '..knnnnmmk..',
    '...kkkkkk...',
]

RIGHT_APPLES = {
    (17, 0): 'k', (18, 0): 'k',
    (17, 1): 'r', (18, 1): 'r',
    (15, 2): 'v', (16, 2): 'v', (17, 2): 'r', (18, 2): 's',
    (15, 3): 'r', (16, 3): 'r', (17, 3): 'm', (18, 3): 'm',
    (15, 4): 'r', (16, 4): 's',
    (15, 5): 'm', (16, 5): 'm',
}

FRONT_APPLES = {
    (9, 7): 'v', (10, 7): 'v', (11, 7): 'm', (12, 7): 'r', (13, 7): 'r',
    (8, 8): 'r', (9, 8): 'r', (10, 8): 'm', (11, 8): 'm', (12, 8): 'r', (13, 8): 's',
    (8, 9): 'r', (9, 9): 's', (10, 9): 'r', (11, 9): 'r', (12, 9): 'm', (13, 9): 'm',
    (9, 10): 'm', (10, 10): 'r', (11, 10): 's', (12, 10): 'm',
}

BETWEEN = {(11, 3): 'k', (11, 4): 'k', (11, 5): 'k'}


def stamp(canvas, origin_x, origin_y):
    for y, row in enumerate(BARREL):
        for x, symbol in enumerate(row):
            if symbol != EMPTY:
                canvas[origin_y + y][origin_x + x] = symbol


def overlay(canvas, cells):
    for (x, y), symbol in cells.items():
        canvas[y][x] = symbol


def main():
    canvas = [[EMPTY] * WIDTH for _ in range(HEIGHT)]
    stamp(canvas, 0, 1)
    stamp(canvas, 11, 1)
    overlay(canvas, RIGHT_APPLES)
    overlay(canvas, BETWEEN)
    stamp(canvas, 5, 6)
    overlay(canvas, FRONT_APPLES)
    for row in canvas:
        print("  '" + ''.join(row) + "',")


if __name__ == '__main__':
    main()
