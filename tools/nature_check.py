import re

from spritelib import COLOR_PATTERN, GRID_PATTERN, LEGEND_PATTERN, PAIR_PATTERN, ROW_PATTERN, read_text

ART = 'src/tools/spriteBaker/half/NatureHalf.ts'
PALETTE = 'src/game/elements/halfPalette/NaturePalette.ts'


def main():
    source = read_text(ART)
    used_symbols = set()
    for name, body in GRID_PATTERN.findall(source):
        rows = ROW_PATTERN.findall(body)
        lengths = sorted({len(row) for row in rows})
        symbols = {symbol for row in rows for symbol in row if symbol != '.'}
        used_symbols |= symbols
        status = 'OK' if len(lengths) == 1 else 'RAGGED'
        print(status, name, f'{lengths}x{len(rows)}', len(symbols), 'colors', ''.join(sorted(symbols)))
        if len(lengths) > 1:
            for index, row in enumerate(rows):
                print('   ', index, len(row), row)
    legend = {}
    for name, body in LEGEND_PATTERN.findall(source):
        for quoted, double_quoted, bare, key in PAIR_PATTERN.findall(body):
            legend[quoted or double_quoted or bare] = key
    palette_keys = [key for key, _ in COLOR_PATTERN.findall(read_text(PALETTE))]
    print('legend symbols never drawn:', sorted(set(legend) - used_symbols))
    print('drawn symbols without legend:', sorted(used_symbols - set(legend)))
    print('palette keys without legend:', sorted(set(palette_keys) - set(legend.values())))
    print('legend keys without palette:', sorted(set(legend.values()) - set(palette_keys)))
    print('palette size', len(palette_keys))
    bad_keys = [key for key in palette_keys if not re.match(r'^nature[A-Z]', key)]
    print('keys without the nature prefix:', bad_keys)


if __name__ == '__main__':
    main()
