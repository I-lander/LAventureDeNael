import os
import sys

from spritelib import HALF, load_art, symbols_of

names = sys.argv[1:] or sorted(name for name in os.listdir(HALF) if name.endswith('.ts'))
for file_name in names:
    grids, legends = load_art(os.path.join(HALF, file_name))
    print(file_name, 'legends', {name: len(legend) for name, legend in legends.items()})
    for name, rows in grids.items():
        print(f'  {name}: {len(rows[0]) if rows else 0}x{len(rows)}, {len(symbols_of(rows))} symbols')
