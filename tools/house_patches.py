SETTINGS = {
    'HOUSE_THATCH': {'index': 0, 'symbols': 'knabcdehijpqtuvgwQS', 'weights': {'k': 1.3}},
    'HOUSE_STONE': {'index': 1, 'symbols': 'knabcdestuvwxyz', 'weights': {'k': 1.3}},
    'HOUSE_CABIN': {'index': 2, 'symbols': 'knabcdeABCstuYj', 'weights': {'k': 1.3}},
    'HOUSE_ADOBE': {'index': 3, 'symbols': 'knabDEHIJOr', 'weights': {'k': 1.3}},
    'HOUSE_STILT': {'index': 4, 'symbols': 'knbcdePQRSUVWtY', 'weights': {'k': 1.3}},
    'HOUSE_FORGE': {'index': 5, 'symbols': 'knstuMNacJYFO', 'weights': {'k': 1.3}},
    'SHOP_HOUSE': {'index': 6, 'symbols': 'k12345rqabcdestuvgxQFYIJ', 'weights': {'k': 1.3}},
}


def put(rows, x, y, lines):
    for offset, line in enumerate(lines):
        row = rows[y + offset]
        merged = ''.join(new if new != ' ' else old for old, new in zip(row[x:x + len(line)], line))
        rows[y + offset] = row[:x] + merged + row[x + len(line):]


def adobe():
    rows = ['....' + 'k' * 44 + '....', '...k' + 'H' * 44 + 'k...']
    rows += ['...kHH' + 'J' * 40 + 'HHk...'] * 2
    rows += ['...kHHJ' + 'E' * 38 + 'JHHk...'] * 6
    rows += ['...kHH' + 'J' * 40 + 'HHk...']
    rows += ['kkkk' + 'H' * 44 + 'kkkk', 'kIJk' + 'H' * 44 + 'kIJk']
    rows += ['kJJk' + 'I' * 44 + 'kJJk', 'kkkk' + 'I' * 44 + 'kkkk']
    rows += ['...' + 'k' * 46 + '...', '...k' + 'E' * 44 + 'k...']
    rows += ['...k' + 'D' * 43 + 'Ek...'] * 32
    rows += ['...' + 'k' * 46 + '...']
    put(rows, 10, 13, ['J', 'J'])
    put(rows, 24, 13, ['J', 'J'])
    put(rows, 33, 13, ['J', 'J'])
    put(rows, 43, 13, ['J', 'J'])
    put(rows, 4, 17, ['EE        E                     EE        EE'])
    put(rows, 4, 18, ['E                                          E'])
    viga = [' kkk ', 'kIIIk', 'kJJJk', 'kJJJk', 'EkkkE', ' EEE ']
    for left in (7, 18, 29, 40):
        put(rows, left, 19, viga)
    put(rows, 42, 34, ['EE', 'EE'])
    put(rows, 4, 46, ['        EEE', '   EEEEEEEEE', 'EEEEEEEEEEEEE'])
    put(rows, 36, 45, ['       EEE  ', '     EEE    ', '    EE      ', 'EEEEEEEEEEEE'])
    put(rows, 16, 27, ['k' * 20, 'k' + 'I' * 18 + 'k', 'k' + 'J' * 18 + 'k', 'k' * 20])
    curtain = [
        'IIIIIIIIIIII',
        'IOOIOOOOIOOI',
        'IOOIOOOOIOOI',
        'IOOIOOOOIOOI',
        'IOOIOOOOIOOI',
        'IOOIOOOOIOOI',
        'IOOIOOOOIOOI',
        'IOOIOOnOIOOI',
        'IOOIOOnOIOOI',
        'IOOIOnnOIOOI',
        'IOOIOnnOIOOI',
        'IOOIOnnnIOOI',
        'IOOIOnnnIOOI',
        'IOOInnnnIOOI',
        'IOOnnnnnnOOI',
        'nOOnnnnnnOOn',
        'nnnnnnnnnnnn',
        'nnnnnnnnnnnn',
    ]
    put(rows, 17, 31, ['kIk' + line + 'kJk' for line in curtain])
    return rows


def shingles(first, last, shift, height, light, dark):
    rows = []
    for level in range(height):
        line = ''
        for column in range(first, last + 1):
            tile = (column + shift) // 6
            if (column + shift) % 6 == 0:
                line += 'x'
            elif tile in dark:
                line += 'x'
            elif tile in light and level == 0:
                line += 'z'
            else:
                line += 'y'
        rows.append(line)
    return rows


STONE_WINDOW = [
    'kkkkkkkkkkkkk',
    'keeeeeeedddck',
    'kkkkkkkkkkkkk',
    ' kdnnndnnnck ',
    ' kdnnndnnnck ',
    ' kdnnndnnnck ',
    ' kdddddddcck ',
    ' kdnnndnnnck ',
    ' kdnnndnnnck ',
    ' kdnnndnnnck ',
    'kkkkkkkkkkkkk',
    'keeeeeeedddck',
    'kkkkkkkkkkkkk',
    ' ttttttttttt ',
]


def stone():
    operations = []
    roof = ['....' + 'k' * 44 + '....', '...k' + 'e' * 44 + 'k...', '...k' + 'd' * 44 + 'k...', '...k' + 'b' * 44 + 'k...']
    roof += ['...k' + line + 'k...' for line in shingles(4, 47, 0, 2, {2, 5}, set())]
    roof += ['..k' + 'x' * 46 + 'k..']
    roof += ['..k' + line + 'k..' for line in shingles(3, 48, 3, 2, {1, 4, 7}, set())]
    roof += ['..k' + 'x' * 46 + 'k..']
    roof += ['..k' + line + 'k..' for line in shingles(3, 48, 0, 2, {3, 6}, set())]
    roof += ['..k' + 'x' * 46 + 'k..']
    roof += ['.k' + line + 'k.' for line in shingles(2, 49, 3, 3, {2, 5, 8}, set())]
    roof += ['.k' + 'x' * 48 + 'k.']
    roof += ['k' + line + 'k' for line in shingles(1, 50, 0, 2, {1, 4, 7}, set())]
    roof += ['k' + 'w' * 50 + 'k', '.' + 'k' * 50 + '.']
    put(roof, 9, 2, ['b'])
    put(roof, 41, 2, ['b'])
    operations.append(('rows', 0, 0, roof))
    operations.append(('rows', 3, 21, ['k' + 't' * 44 + 'k', 'kvvvtvvvvvvvtvvvvvvvvvtvvvvvvvvtvvvvvvvvtvvvvk']))
    operations.append(('rows', 10, 23, STONE_WINDOW))
    operations.append(('rows', 29, 23, STONE_WINDOW))
    operations.append(('rows', 10, 43, STONE_WINDOW))
    beam = ['..' + 'k' * 48 + '..', '..k' + 'e' * 30 + 'd' * 16 + 'k..', '..k' + 'd' * 12 + 'c' * 9 + 'd' * 14 + 'c' * 11 + 'k..', '..' + 'k' * 48 + '..', '...k' + 't' * 44 + 'k...']
    operations.append(('rows', 0, 37, beam))
    door = ['k' * 19, 'k' + 'e' * 11 + 'd' * 6 + 'k', 'k' + 'd' * 10 + 'c' * 7 + 'k', 'k' * 19]
    door += [' kcckccbcccbcckcck ']
    door += [' kedkddbdddbddkdck '] * 5
    door += [' kedkddbdddbvdkdck ', ' kedkddbdddbudkdck ', ' kedkddbdddbddkdck ']
    door += [' kedkddbdddbddkdck '] * 6
    operations.append(('rows', 26, 42, door))
    operations.append(('swap', 4, 21, 47, 60, 's', 't'))
    operations.append(('rows', 47, 34, ['v', 'v', 'v']))
    return operations


SHOP_ROOF_EDGE = {
    1: (45, 47), 2: (48, 50), 3: (51, 53), 4: (54, 55), 5: (56, 56), 6: (57, 57), 7: (58, 58), 8: (59, 59),
    9: (60, 60), 10: (61, 61), 11: (62, 62), 12: (63, 63), 13: (64, 64), 14: (65, 65), 15: (66, 66), 16: (67, 67),
    17: (68, 69), 18: (70, 70), 19: (71, 71), 20: (72, 72), 21: (73, 73),
}
SHOP_EAVE_START = {24: (45, 48), 25: (49, 50), 26: (51, 52)}
SHOP_INNER_ARCH = {27: (37, 43), 28: (42, 46), 29: (46, 48), 30: (48, 50), 31: (50, 52), 32: (52, 53), 33: (54, 55)}
SHOP_TILE_PHASE = [0, 3, 0, 3, 0]

SHOP_WINDOW = [
    'kkkkkkkkkkk',
    'keeeeedddck',
    'kkkkkkkkkkk',
    ' kdggdggck ',
    ' kdggdggck ',
    ' kdddddcck ',
    ' kdggdggck ',
    ' kdggdggck ',
    ' kQFFQHHQk ',
    'keeeeeedddk',
    'kdddddddcck',
    'kkkkkkkkkkk',
    ' qqqqqqqqq ',
]

SHOP_DOOR = [
    '      kkkkkk      ',
    '   kkkeeeeeekkk   ',
    '  keeeeddddddddk  ',
    ' keedddddddddddck ',
    'keedddkkkkkkdddcck',
    'keeddkcbccbckddcck',
    'keedkddbddbddkdcck',
    'keedkddbddbddkdcck',
    'keedkuuuudbddkdcck',
    'keedkssssdbddkdcck',
    'keedkddbddbddkdcck',
    'keedkddbddbudkdcck',
    'keedkddbddbtdkdcck',
    'keedkddbddbddkdcck',
    'keedkddbddbddkdcck',
    'keedkddbddbddkdcck',
    'keedkuuuudbddkdcck',
    'keedkssssdbddkdcck',
    'keedkddbddbddkdcck',
    'keedkddbddbddkdcck',
    'keedkddbddbddkdcck',
]

SHOP_CHIMNEY = [
    '.kkkkkkkkkkkkk',
    'kHHHHHHHHHHHHk',
    'kHHaaaaaaaaHHk',
    'kHHaaaaaaaaHHk',
    'kHHaaaaaaaaHHk',
    'kHHHHHHHHHHHHk',
    'kIIIIIIIIIIIIk',
    'keeeeeeeeeeeek',
    'kddddddddddddk',
    'kkkkkkkkkkkkkk',
    ' kbbbbbbbbbbk ',
    ' kdddbIIIIbdk ',
    ' kdddbIIIIbdk ',
    ' kbbbbbbbbbbk ',
    ' kdbddddbIIIk ',
    ' kdbddddbIIkk ',
    ' kbbbbbbbbkk  ',
    ' kIIIbddkkk   ',
    ' kIIIbdkk     ',
    ' kbbbbkkk     ',
    ' kdbddkk      ',
    ' kdbkk        ',
    ' kddkk        ',
    ' kkkkk        ',
]


def shop_tile(x, y):
    offset = x - 45
    if offset % 6 == 5:
        return '5'
    column, local = offset // 6, offset % 6
    if (y - SHOP_TILE_PHASE[column] - (1 if local >= 3 else 0)) % 6 == 0:
        return '5'
    if column == 0:
        return '1' if local == 4 else '2'
    return '3'


def shop():
    width, height = 74, 69
    grid = [['.'] * width for _ in range(height)]

    def span(y, first, last, symbol):
        for x in range(first, last + 1):
            grid[y][x] = symbol

    for y in range(1, 45):
        edge = SHOP_ROOF_EDGE.get(y, (73, 73))
        span(y, edge[0], edge[1], 'k')
        if y <= 23:
            low = 45
        elif y in SHOP_EAVE_START:
            start = SHOP_EAVE_START[y]
            span(y, start[0], start[1], 'k')
            low = start[1] + 1
        else:
            grid[y][y + 26] = 'k'
            low = y + 27
        for x in range(low, edge[0]):
            grid[y][x] = shop_tile(x, y)
    span(23, 37, 43, '4')
    grid[23][44] = 'k'
    span(24, 37, 44, '4')
    span(25, 37, 48, '4')
    span(26, 37, 50, '4')
    for y in range(27, 47):
        inner = SHOP_INNER_ARCH.get(y, (y + 21, y + 22))
        span(y, inner[0], inner[1], 'k')
        span(y, inner[1] + 1, min(y + 25, 70), '4')
        if y >= 28:
            shade_start = {28: 37, 29: 37}.get(y, inner[0] - 4 if y <= 33 else inner[0] - 3)
            span(y, 37, shade_start - 1, 'r')
            span(y, shade_start, inner[0] - 1, 'q')
    for y in range(41, 45):
        span(y, 48, y + 20, 'eddb'[y - 41])
    span(45, 71, 73, 'k')
    grid[46][71] = 'k'
    span(47, 68, 70, 'k')
    span(45, 37, 65, 'q')
    span(46, 37, 66, 'r')
    span(47, 37, 67, 'r')
    for y in range(48):
        for x in range(37):
            grid[y][x] = grid[y][73 - x]
    for y in range(45):
        for x in range(29):
            if grid[y][x] == '3':
                grid[y][x] = '2'
    rows = [''.join(line) for line in grid]
    put(rows, 29, 0, ['k' * 16, 'k' + '1' * 14 + 'k'])
    put(rows, 29, 2, ['k1' + '2' * 12 + '1k'] * 19)
    put(rows, 29, 21, ['k' + '1' * 14 + 'k', 'k' * 16, 'k' + '4' * 14 + 'k'])
    put(rows, 7, 4, SHOP_CHIMNEY)
    put(rows, 27, 33, ['k' * 20])
    put(rows, 26, 34, ['k' + 'd' * 20 + 'k'] * 11)
    put(rows, 27, 45, ['k' * 20])
    put(rows, 28, 35, ['b'])
    put(rows, 45, 35, ['b'])
    put(rows, 28, 43, ['b'])
    put(rows, 45, 43, ['b'])
    put(rows, 31, 28, ['tk', 'tk', 'kk', 'tk', 'tk'])
    put(rows, 41, 28, ['tk', 'tk', 'kk', 'tk', 'tk'])
    put(rows, 26, 46, ['q' * 22])
    for y in range(48, 68):
        rows[y] = '....k' + 'r' * 64 + 'k....'
    rows[68] = '....' + 'k' * 66 + '....'
    stones = ['vvvvvtvvvvvvv', 'uuuuutuuuuuuu', 'ttttttttttttt', 'vvtvvvvvvtvvv', 'uutuuuuuutuuu', 'uutuuuuuutuuu']
    narrow = ['vvv', 'uuu', 'ttt', 'vtv', 'utu', 'utu']
    put(rows, 9, 62, stones)
    put(rows, 52, 62, stones)
    put(rows, 25, 62, narrow)
    put(rows, 46, 62, narrow)
    put(rows, 5, 48, ['eddc'] * 20)
    put(rows, 65, 48, ['eddc'] * 20)
    put(rows, 7, 46, ['dc'])
    put(rows, 6, 47, ['ddc'])
    put(rows, 65, 46, ['ed', 'edd'])
    put(rows, 22, 45, ['dcb'] + ['edb'] * 22)
    put(rows, 49, 45, ['dcb'] + ['edb'] * 22)
    put(rows, 10, 48, SHOP_WINDOW)
    put(rows, 53, 48, SHOP_WINDOW)
    put(rows, 28, 47, SHOP_DOOR)
    return rows


FORGE_COURSES = [(16, 4), (20, 5), (25, 5), (30, 5), (35, 5)]
FORGE_HEARTH_EDGE = {35: 38, 36: 37, 37: 36, 38: 36, 39: 35, 40: 35, 41: 34, 42: 34}
FORGE_CAP = [
    '.kkkkkkkkkkkkkk.',
    'kttttttttttttttk',
    'kttkkkkkkkkkkttk',
    'kttkkkkkkkkkkttk',
    'kttttttttttttttk',
    'kuuuuuuuuuuuuuuk',
    'ktttttttnttttttk',
    'ktttttttnttttttk',
    'ktttttttnttttttk',
    'ktttttttnttttssk',
    'kssssssssssssssk',
]
FORGE_FIRE = [
    'kkkkkkkkkkkkkk',
    'kkaaaaaaaaaakk',
    'kaaaaaaaaaaaak',
    'kaaaaaOOaaaaak',
    'kaaOaaOOaaOaak',
    'kaaOOOFFOOOaak',
    'kaOOFFFFFFOOak',
    'kaOFFYYYYFFOak',
    'kJOFYYYYYYFOJk',
    'kkkkkkkkkkkkkk',
]
FORGE_DOOR = [
    'kkkkkkkkkkkkkkkkkkk',
    'kJJJJJJJJJJJJJJJJJk',
    'kNNNNNNNNNNNNNNNNNk',
    'kkkkkkkkkkkkkkkkkkk',
    ' kckbbbabbbabbbkbk ',
    ' kckcccacccaccckbk ',
    ' kckcccacccaccckbk ',
    ' kckcccacccaccckbk ',
    ' kcktttttccaccckbk ',
    ' kcksssssccaccckbk ',
    ' kckcccacccaccckbk ',
    ' kckcccacccactckbk ',
    ' kckcccacccactckbk ',
    ' kckcccacccaccckbk ',
    ' kckcccacccaccckbk ',
    ' kckcccacccaccckbk ',
    ' kcktttttccaccckbk ',
    ' kcksssssccaccckbk ',
    ' kckcccacccaccckbk ',
    ' kckcccacccaccckbk ',
    ' kckcccacccaccckbk ',
]


def forge_tile(x, y):
    for index, (start, size) in enumerate(FORGE_COURSES):
        if start <= y < start + size:
            local = (x - 2 + (3 if index % 2 else 0)) % 6
            last = index == len(FORGE_COURSES) - 1
            level = y - start
            if level == size - 1 and not last:
                return 'a'
            if level == size - (1 if last else 2):
                return 'N' if local in (1, 2, 3) else 'a'
            if local == 5:
                return 'a'
            return 'M' if level == 0 and local in (1, 2, 3) else 'N'
    return 'N'


def forge_wall(x, y):
    if y == 41:
        return 'n'
    level = y - 42
    if level % 4 == 3:
        return 'n'
    return 'n' if (x + (4 if (level // 4) % 2 else 0)) % 7 == 0 else 's'


def forge_hearth(x, y, right):
    level = y - 13
    if y == 12:
        return 'n'
    if level % 4 == 3:
        return 's'
    if (x - 40 + (3 if (level // 4) % 2 else 0)) % 7 == 6:
        return 's'
    return 's' if x == right - 1 else 't'


def forge():
    width, height = 68, 68
    grid = [['.'] * width for _ in range(height)]

    def span(y, first, last, symbol):
        for x in range(first, last + 1):
            grid[y][x] = symbol

    span(11, 1, 66, 'k')
    span(15, 1, 66, 'k')
    for y, symbol in ((12, 'M'), (13, 'N'), (14, 'a')):
        span(y, 0, 67, 'k')
        span(y, 1, 66, symbol)
    for x in (13, 27, 59):
        grid[12][x] = 'a'
        grid[13][x] = 'a'
    for y in range(16, 40):
        grid[y][1] = 'k'
        grid[y][66] = 'k'
        for x in range(2, 66):
            grid[y][x] = forge_tile(x, y)
    span(40, 2, 65, 'k')
    for y in range(41, 66):
        grid[y][3] = 'k'
        grid[y][64] = 'k'
        for x in range(4, 64):
            grid[y][x] = forge_wall(x, y)
    span(66, 3, 64, 'k')
    for y in range(12, 67):
        left = 39 if y < 35 else FORGE_HEARTH_EDGE.get(y, 33 if y < 57 else 32)
        right = 91 - left
        grid[y][left] = 'k'
        grid[y][right] = 'k'
        for x in range(left + 1, right):
            grid[y][x] = forge_hearth(x, y, right)
    for y in (43, 57):
        span(y, 32 if y == 57 else 33, 34, 'k')
        span(y, 57, 59 if y == 57 else 58, 'k')
    span(67, 32, 59, 'k')
    span(58, 33, 58, 'c')
    span(58, 43, 48, 'J')
    span(59, 33, 58, 'a')
    for y in (60, 61, 62, 64, 65, 66):
        for x in range(33, 59):
            joint = (x + (3 if y > 63 else 0)) % 7 == 0
            grid[y][x] = 'n' if joint else ('s' if y in (62, 66) or x >= 56 else 't')
    span(63, 33, 58, 'n')
    rows = [''.join(line) for line in grid]
    put(rows, 38, 0, FORGE_CAP)
    put(rows, 38, 11, ['k' * 16])
    put(rows, 39, 48, FORGE_FIRE)
    put(rows, 10, 45, FORGE_DOOR)
    return rows


THATCH_ARCH = {22: (27, 30), 23: (24, 26), 24: (22, 23), 25: (21, 21), 26: (20, 20), 27: (19, 19), 28: (19, 19)}
THATCH_ROUND_WINDOW = [
    '   kkkkk   ',
    ' kkeeeddkk ',
    ' kewwdwwdk ',
    'kewggdgggdk',
    'kegggdgggdk',
    'kedddddddck',
    'kegggdgggck',
    'kdgggdgggck',
    ' kdggdggck ',
    ' kkdcccckk ',
    '   kkkkk   ',
]
THATCH_KNOT = [
    '.......kk.......',
    '..kk..kjjk..kk..',
    '.kjjk.kjjkkkjik.',
    '.kjjjkjjjjjjjik.',
    '..kjjjjjjjjiik..',
    '..kijjjjjjiihk..',
    '...kiijjiihhk...',
    '...keeedddddk...',
    '.kkkccccccccckk.',
]


def dash(x, y, length, lean):
    return [(x + lean * (step // 2), y + step) for step in range(length)]


def thatch_cells():
    strands = []
    for x, y, length in ((15, 18, 3), (11, 19, 3), (7, 21, 3), (16, 23, 4), (12, 24, 3), (8, 26, 3), (4, 27, 3), (14, 29, 3), (10, 30, 3), (6, 31, 3)):
        strands += dash(x, y, length, -1)
        strands += dash(59 - x, y, length, 1)
    for x, y, length in ((22, 17, 3), (26, 17, 2), (30, 17, 3), (34, 17, 2), (38, 17, 3), (27, 10, 3), (33, 10, 3)):
        strands += dash(x, y, length, 0)
    for x, y, length in ((22, 11, 2), (18, 12, 2)):
        strands += dash(x, y, length, -1)
        strands += dash(59 - x, y, length, 1)
    arc = [(x, 17) for x in range(9, 14)] + [(x, 16) for x in range(14, 20)] + [(x, 15) for x in range(20, 41)]
    arc += [(x, 16) for x in range(41, 47)] + [(x, 17) for x in range(47, 52)]
    return strands + arc


def thatch_shade(grid):
    family = 'hij'
    for y in range(9, 37):
        for x in range(60):
            if grid[y][x] in family:
                grid[y][x] = 'j'
    for x in range(60):
        for y in range(9, 37):
            if grid[y][x] not in family:
                continue
            depth = 0
            while y + depth + 1 < len(grid) and grid[y + depth + 1][x] in family:
                depth += 1
            above_arch = 19 <= x <= 41 and y <= 28
            if depth == 0:
                grid[y][x] = 'h' if above_arch or (y >= 30 and x % 4 == 0) else 'i'
            elif depth == 1 and (above_arch or x % 3):
                grid[y][x] = 'i'
    for y in range(14, 35):
        thatch_columns = [x for x in range(60) if grid[y][x] in family]
        if not thatch_columns:
            continue
        right = max(thatch_columns)
        for x in range(right - 2, right + 1):
            if grid[y][x] == 'j':
                grid[y][x] = 'i'
THATCH_SIDE_WINDOW = [
    'pppppp',
    'kkkkkk',
    'kdcccc',
    'kdwcwc',
    'kdwcwc',
    'kdcccc',
    'kdwcwc',
    'kdwcwc',
    'kdcccc',
    'kkkkkk',
]
THATCH_DOOR = [
    'kkkkkkkkkkkkkkkkk',
    'keeeeeeeedddddddk',
    'kkkkkkkkkkkkkkkkk',
    ' kekSSSSSSSSSkdk ',
    ' kekQQSQQQSQQkdk ',
    ' kekQQSQQQSQQkdk ',
    ' kekQQSQQQSQQkdk ',
    ' kekQQSQQQSQQkdk ',
    ' kekQQSQQQSQjkdk ',
    ' kekQQSQQQSQhkdk ',
    ' kekQQSQQQSQQkdk ',
    ' kekQQSQQQSQQkdk ',
    ' kekQQSQQQSQQkdk ',
    ' kekQQSQQQSQQkdk ',
    ' kekQQSQQQSQQkdk ',
    ' kekQQSQQQSQQkdk ',
    ' kekQQSQQQSQQkdk ',
]


def thatch():
    operations = [('swap', 0, 9, 59, 36, 'dcabe', 'j'), ('rows', 22, 0, THATCH_KNOT)]
    gable = []
    for y in range(22, 37):
        first = THATCH_ARCH.get(y, (18, 18))
        line = [' '] * 60
        for x in range(first[0], 61 - first[0]):
            inside = x > first[1] and x < 60 - first[1]
            shaded = y <= 24 or x <= first[1] + 2 or (y <= 28 and x >= 58 - first[1])
            line[x] = ('q' if shaded else 'p') if inside else 'k'
        gable.append(''.join(line))
    put(gable, 25, 3, THATCH_ROUND_WINDOW)
    operations.append(('rows', 0, 22, gable))
    width = 60
    grid = [['.'] * width for _ in range(23)]

    def span(y, first, last, symbol):
        for x in range(first, last + 1):
            grid[y - 37][x] = symbol

    span(37, 4, 56, 'k')
    for y in range(38, 55):
        for x in (4, 7, 53, 56):
            grid[y - 37][x] = 'k'
    for y in range(38, 54):
        span(y, 5, 6, 'e')
        span(y, 54, 55, 'd')
        grid[y - 37][6] = 'c'
        grid[y - 37][55] = 'c'
    span(54, 4, 7, 'k')
    span(54, 53, 56, 'k')
    for x in range(8, 14):
        bottom = 55 + (x - 8) // 2
        for mirrored in (x, 60 - x):
            for y in range(38, bottom):
                depth = bottom - y
                if depth <= 4:
                    symbol = 'v' if depth == 4 else ('t' if (x + depth) % 3 == 0 else 'u')
                elif y <= (39 if mirrored == x else 40):
                    symbol = 'q'
                else:
                    symbol = 'p'
                grid[y - 37][mirrored] = symbol
            grid[bottom - 37][mirrored] = 'k'
    for y in range(38, 59):
        for x in (14, 18, 42, 46):
            grid[y - 37][x] = 'k'
        for start in (15, 43):
            for offset, symbol in enumerate('edc'):
                grid[y - 37][start + offset] = symbol
    span(38, 19, 41, 'e')
    span(39, 19, 41, 'd')
    span(40, 19, 41, 'k')
    span(41, 19, 41, 'q')
    for y in range(42, 59):
        span(y, 19, 41, 'p')
    span(59, 14, 46, 'k')
    rows = [''.join(line) for line in grid]
    stones = ['vvvv', 'uutu', 'tttt', 'vvvv', 'utuu']
    put(rows, 19, 17, stones)
    put(rows, 38, 17, stones)
    put(rows, 8, 3, THATCH_SIDE_WINDOW)
    put(rows, 22, 5, THATCH_DOOR)
    put(rows, 9, 0, ['ih', 'kk'])
    put(rows, 49, 0, ['ji', 'kk'])
    operations.append(('rows', 0, 37, rows))
    operations.append(('call', thatch_shade))
    operations.append(('cells', 'i', thatch_cells(), 'j'))
    return operations


CABIN_WINDOW = [
    'kkkkkkkkkkkkk',
    'keeeeeeeddddk',
    'kkkkkkkkkkkkk',
    ' kbYYYbYYYbk ',
    ' kbYYYbYYYbk ',
    ' kbYYjbYYjbk ',
    ' kbbbbbbbbbk ',
    ' kbYYYbYYYbk ',
    ' kbYYYbYYYbk ',
    ' kbYYjbYYjbk ',
    ' kbbbbbbbbbk ',
    'keeeeeeeddddk',
    'kkkkkkkkkkkkk',
]
CABIN_LOG_END = [' aaaa ', 'aeedda', 'aecbda', 'addcca', ' aaaa ']
CABIN_CHIMNEY = [
    'kkkkkkkk',
    'kuuuuuuk',
    'kukkkkuk',
    'kuuuuuuk',
    'kttttttk',
    'ktttttsk',
    'kkkkkkkk',
    'ksssssk ',
    'kttsttk ',
    'kttsttk ',
    'ksssssk ',
    'ktsttsk ',
    'ktsttsk ',
    'ksssssk ',
    'kttsttk ',
]


def cabin_frame(grid):
    for y in range(16, 39):
        for x, symbol in ((40 - y, 'C'), (41 - y, 'C'), (42 - y, 'e'), (43 - y, 'd'), (44 - y, 'd'), (45 - y, 'b'), (46 - y, 'k')):
            if x >= 1:
                grid[y][x] = symbol
        for x, symbol in ((22 + y, 'C'), (21 + y, 'C'), (20 + y, 'd'), (19 + y, 'c'), (18 + y, 'c'), (17 + y, 'b'), (16 + y, 'k')):
            if x <= 61:
                grid[y][x] = symbol
    for y in range(19, 33):
        for x in range(47 - y, 16 + y):
            if (x - 31) % 5 == 0:
                grid[y][x] = 'a'
            elif y <= 20:
                grid[y][x] = 'b'
            else:
                grid[y][x] = 'c'
    for x in range(13, 50):
        grid[33][x] = 'k'
    for y, symbol in ((34, 'e'), (35, 'd'), (36, 'c'), (37, 'a')):
        for x in range(47 - y, 16 + y):
            grid[y][x] = symbol
    for x in range(9, 54):
        grid[38][x] = 'e'
    for y in range(39, 59):
        for x in range(6, 57):
            grid[y][x] = 'k' if x in (6, 56) else 'eddca'[(y - 38) % 5]
    for x in (4, 5, 57, 58):
        grid[39][x] = 'k'


def cabin():
    operations = [('smooth', 0, 0, 62, 40, 'ABC', 2), ('call', cabin_frame)]
    operations.append(('rows', 28, 14, [' eeeee ', 'kdddddk', 'kdddddk', 'kbbbbbk', 'kkkkkkk']))
    for top in (38, 43, 48, 53):
        operations.append(('rows', 8, top, CABIN_LOG_END))
        operations.append(('rows', 49, top, CABIN_LOG_END))
    operations.append(('rows', 8, 58, [' aaaa ']))
    operations.append(('rows', 49, 58, [' aaaa ']))
    operations.append(('rows', 15, 40, CABIN_WINDOW))
    door = ['k' * 18, 'k' + 'e' * 10 + 'd' * 6 + 'k', 'k' + 'd' * 8 + 'c' * 8 + 'k', 'k' * 18, ' kdk' + 'b' * 10 + 'kck ']
    door += [' kdkcccbccbccckck '] * 8
    door += [' kdkcccbccbcjckck ', ' kdkcccbccbcackck ']
    door += [' kdkcccbccbccckck '] * 6
    operations.append(('rows', 30, 40, door))
    ground = [
        '.....kk' + 'A' * 24 + ' ' * 16 + 'A' * 9 + 'kk.....',
        '....k' + 'B' * 26 + ' ' * 16 + 'B' * 11 + 'k....',
        '....' + 'k' * 55 + '....',
    ]
    operations.append(('rows', 0, 59, ground))
    operations.append(('rows', 46, 6, CABIN_CHIMNEY))
    operations.append(('rows', 2, 38, ['C']))
    operations.append(('rows', 0, 39, ['.kAkAk', '.kAkBk', '.kAkCk', '.kBkk ', '.kBk. ', '.kCk. ', '..k.. ', '..... ', '..... ']))
    operations.append(('rows', 56, 39, ['kAkAk..', 'kBkAk..', 'kCkAk..', ' kkBk..', ' .kBk..', ' .kCk..', ' ..k...', ' ......', ' ......']))
    operations.append(('rows', 20, 27, ['A', 'A', 'B', 'C']))
    operations.append(('rows', 41, 26, ['A', 'A', 'B', 'C']))
    operations.append(('rows', 45, 30, ['A', 'A', 'B', 'B', 'C']))
    return operations


STILT_ROUND_WINDOW = [
    '   kkkkk   ',
    ' kkdddddkk ',
    ' kdnndnnck ',
    'kdnnndnnnck',
    'kdnnndnnnck',
    'kdddddddcck',
    'kdnnndnnnck',
    'kdnnndnnnck',
    ' kdnndnnck ',
    ' kkccccckk ',
    '   kkkkk   ',
]
STILT_LANTERN = [
    '  k  ',
    ' ktk ',
    ' ktk ',
    'ktttk',
    'kkkkk',
    'kYYYk',
    'kYYYk',
    'kkkkk',
    'ktttk',
    ' kkk ',
]


def stilt_inner(y):
    value = 29
    if y >= 14:
        for row in range(15, y + 1):
            value -= 2 if (row - 14) % 4 == 0 else 1
    else:
        for row in range(13, y - 1, -1):
            value += 2 if (13 - row) % 4 == 0 else 1
    return value


def stilt_frame(grid):
    moss = 'UVWX'
    for y in range(0, 34):
        inner = stilt_inner(y)
        for x in range(62):
            if grid[y][x] not in moss:
                continue
            distance = inner - 3 - x if x <= 30 else x - 65 + inner
            below = grid[y + 1][x]
            if below not in moss and below not in 'cdb':
                grid[y][x] = 'W' if x % 3 == 0 else 'V'
            elif distance <= 0:
                grid[y][x] = 'W'
            elif distance % 7 >= 5 or distance == 1:
                grid[y][x] = 'V'
            else:
                grid[y][x] = 'U'
    for y in range(14, 33):
        inner = stilt_inner(y)
        for x, symbol in ((inner - 2, 'd'), (inner - 1, 'c'), (inner, 'k'), (62 - inner, 'k'), (63 - inner, 'c'), (64 - inner, 'b')):
            grid[y][x] = symbol
        for x in range(inner + 1, 62 - inner):
            if y == 14 or y == 32:
                grid[y][x] = 'k' if y == 14 else 'T'
            elif (x - 31) % 5 == 0:
                grid[y][x] = 'S'
            elif x - inner <= 3 or 62 - inner - x <= 3:
                grid[y][x] = 'R'
            else:
                grid[y][x] = 'Q'
    for y in range(33, 55):
        for x in range(53, 62):
            grid[y][x] = '.' if y > 33 else grid[y][x]
        for x in range(11, 52):
            if y == 33:
                symbol = 'R'
            elif (y - 34) % 4 == 3:
                symbol = 'S'
            else:
                symbol = 'Q'
            glow = ((x - 47) / 6.5) ** 2 + ((y - 44) / 7.5) ** 2 <= 1
            if glow:
                symbol = 'P' if symbol == 'Q' else 'R'
            grid[y][x] = symbol
    for y in range(30, 55):
        inner = stilt_inner(y) if y < 33 else 0
        for x, symbol in ((7, 'k'), (8, 'd'), (9, 'c'), (10, 'k')):
            if y >= 33 or x > inner:
                grid[y][x] = symbol
                grid[y][62 - x] = {'d': 'c', 'c': 'd'}.get(symbol, symbol)
    for x in range(0, 8):
        grid[33][x] = 'k' if grid[33][x] != '.' or x >= 4 else '.'
        if x >= 1:
            grid[33][62 - x] = 'k' if grid[33][62 - x] != '.' or x >= 4 else '.'
    grid[32][60] = 'k'


def stilt():
    operations = [('call', stilt_frame)]
    operations.append(('rows', 29, 9, [' kkk ', 'kedck', 'kedck', 'kedck', 'kdcck']))
    operations.append(('rows', 26, 18, STILT_ROUND_WINDOW))
    operations.append(('rows', 12, 37, STILT_ROUND_WINDOW))
    door = ['k' * 18, 'k' + 'e' * 9 + 'd' * 7 + 'k', 'k' + 'c' * 16 + 'k', 'k' * 18, ' kdk' + 'S' * 10 + 'kck ']
    door += [' kdkRRRSRRSRRRkck '] * 7
    door += [' kdkRRRSRRSReRkck ', ' kdkRRRSRRSRdRkck ']
    door += [' kdkRRRSRRSRRRkck '] * 7
    operations.append(('rows', 25, 34, door))
    operations.append(('rows', 45, 37, STILT_LANTERN))
    block = ['.kkk', 'kedc', 'kedc', 'kddc', 'kdcc', 'kdcc']
    operations.append(('rows', 3, 49, block))
    operations.append(('rows', 56, 49, ['kkk.', 'edck', 'edck', 'ddck', 'dcck', 'dcck']))
    planks = ''.join('b' if (x - 5) % 7 == 6 else 'e' for x in range(5, 58))
    deck = ['...' + 'k' * 56 + '...', '....k' + planks + 'k...', '....k' + 'c' * 53 + 'k...', '....' + 'k' * 55 + '...']
    deck += ['.' * 62] * 6
    put(deck, 7, 4, ['kbbk', 'kdck', 'kdck', '.kk.'])
    put(deck, 52, 4, ['kbbk', 'kdck', 'kdck', '.kk.'])
    steps = ['kkk' + 'k' * 10 + 'kkk', 'kdk' + 'e' * 10 + 'kck', 'kdk' + 'c' * 10 + 'kck', 'kdk' + 'k' * 10 + 'kck']
    steps += ['kdk' + symbol * 10 + 'kck' for symbol in 'ecnec']
    steps += ['kkk' + 'k' * 10 + 'kkk']
    put(deck, 26, 0, steps)
    operations.append(('rows', 0, 55, deck))
    return operations


PATCHES = {
    'HOUSE_STILT': stilt() + [('swap', 0, 0, 61, 64, 'T', 'S'), ('swap', 0, 0, 61, 64, 'a', 'b'), ('rows', 45, 13, ['U']), ('rows', 26, 12, ['UUV']), ('rows', 5, 48, ['..'])],
    'HOUSE_CABIN': cabin(),
    'HOUSE_THATCH': thatch(),
    'HOUSE_FORGE': [('rows', 0, 0, forge()), ('swap', 0, 44, 67, 47, 'J', 'M'), ('swap', 0, 48, 67, 57, 'J', 'a'), ('swap', 0, 58, 67, 58, 'J', 'O'), ('swap', 33, 58, 58, 58, 'c', 'M')],
    'HOUSE_ADOBE': [('rows', 0, 0, adobe())],
    'SHOP_HOUSE': [('rows', 0, 0, shop()), ('swap', 0, 0, 73, 68, 'a', 'b'), ('swap', 0, 0, 73, 68, 'I', 'c')],
    'HOUSE_STONE': stone(),
}
