import colorsys
import json
import os
import sys
from collections import Counter, deque

SCRATCH = os.path.dirname(os.path.abspath(__file__))
PROJECT = sys.argv[1]
SYMBOLS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&()*+,-/:;<=>?@[]^_{|}~'
TILE = 16
ROOF_BOTTOM_ROW = 124


def load(name):
    return json.load(open(os.path.join(SCRATCH, name + '.json'), encoding='utf-8'))


def hls(rgb):
    hue, lightness, saturation = colorsys.rgb_to_hls(*(channel / 255 for channel in rgb))
    return hue * 360, lightness, saturation


def shift_hue(rgb, source_hue, target_hue, spread=0.5):
    hue, lightness, saturation = hls(rgb)
    delta = ((hue - source_hue + 180) % 360) - 180
    new_hue = ((target_hue + delta * spread) % 360) / 360
    return tuple(int(round(channel * 255)) for channel in colorsys.hls_to_rgb(new_hue, lightness, saturation))


def grid_literal(name, rows):
    width = max(len(row) for row in rows)
    body = '\n'.join("  '" + row.ljust(width, '.') + "'," for row in rows)
    return f'export const {name}: PixelGrid = [\n{body}\n];\n'


def legend_literal(name, mapping, base=None):
    lines = [f"  '{symbol}': '{key}'," for symbol, key in mapping.items()]
    spread = f'  ...{base},\n' if base else ''
    return f'export const {name}: PixelLegend = {{\n{spread}' + '\n'.join(lines) + '\n};\n'


def used_symbols(rows):
    return {symbol for row in rows for symbol in row if symbol != '.'}


palette_entries = {}


def register(trace):
    for entry in trace['palette']:
        palette_entries[entry['name']] = tuple(entry['rgb'])
    return {entry['symbol']: entry['name'] for entry in trace['palette']}


def recolor(legend, symbols, suffix, source_hue, target_hue, predicate):
    variant = {}
    for symbol in sorted(symbols):
        name = legend[symbol]
        rgb = palette_entries[name]
        if not predicate(rgb):
            continue
        new_name = name + suffix
        palette_entries[new_name] = shift_hue(rgb, source_hue, target_hue)
        variant[symbol] = new_name
    return variant


def is_green(rgb):
    hue, lightness, saturation = hls(rgb)
    return 70 <= hue <= 170 and saturation > 0.12


def is_roof_red(rgb):
    hue, lightness, saturation = hls(rgb)
    return (hue <= 20 or hue >= 340) and saturation > 0.3


HEADER = "import type { PixelGrid, PixelLegend } from '../../game/elements';\n\n"

hero = load('hero-trace')
hero_legend = register(hero)
hero_names = ['HERO_SOUTH', 'HERO_SOUTH_EAST', 'HERO_EAST', 'HERO_NORTH_EAST', 'HERO_NORTH']
hero_source = HEADER
for name, sprite in zip(hero_names, hero['sprites']):
    hero_source += grid_literal(name, sprite['rows']) + '\n'
hero_source += legend_literal('HERO_LEGEND', hero_legend)
open(os.path.join(PROJECT, 'src/tools/spriteBaker/HeroArt.ts'), 'w', encoding='utf-8', newline='\n').write(hero_source)

monsters = load('monsters-trace')
monster_legend = register(monsters)
monster_names = ['SLIME_FRONT', 'SLIME_SIDE', 'SLIME_BACK', 'KING_SLIME', 'ARCHER_FRONT', 'ARCHER_SIDE', 'ARCHER_BACK', 'BOMBER_FRONT']
monster_source = HEADER
for name, sprite in zip(monster_names, monsters['sprites']):
    monster_source += grid_literal(name, sprite['rows']) + '\n'
monster_source += legend_literal('MONSTER_LEGEND', monster_legend) + '\n'
slime_symbols = set().union(*(used_symbols(monsters['sprites'][index]['rows']) for index in range(3)))
king_symbols = used_symbols(monsters['sprites'][3]['rows'])
monster_source += legend_literal('BLUE_SLIME_LEGEND', recolor(monster_legend, slime_symbols, 'AsBlue', 110, 212, is_green), 'MONSTER_LEGEND') + '\n'
monster_source += legend_literal('RED_SLIME_LEGEND', recolor(monster_legend, slime_symbols, 'AsRed', 110, 352, is_green), 'MONSTER_LEGEND') + '\n'
monster_source += legend_literal('KING_SLIME_ANGRY_LEGEND', recolor(monster_legend, king_symbols, 'AsAngry', 110, 14, is_green), 'MONSTER_LEGEND')
open(os.path.join(PROJECT, 'src/tools/spriteBaker/MonsterArt.ts'), 'w', encoding='utf-8', newline='\n').write(monster_source)

world = load('environment-trace')
world_legend = register(world)
tree, pine, rock = (world['sprites'][index]['rows'] for index in range(3))

house_trace = load('house-trace')
house_legend = register(house_trace)
house = house_trace['sprites'][0]['rows']
free_symbols = [symbol for symbol in SYMBOLS if symbol not in house_legend]
roof_map = {}
house_rows = []
for y, row in enumerate(house):
    new_row = ''
    for symbol in row:
        if symbol != '.' and y < ROOF_BOTTOM_ROW and is_roof_red(palette_entries[house_legend[symbol]]):
            if symbol not in roof_map:
                roof_map[symbol] = free_symbols.pop(0)
            new_row += roof_map[symbol]
        else:
            new_row += symbol
    house_rows.append(new_row)
roof_legend = {}
for source_symbol, roof_symbol in roof_map.items():
    roof_name = house_legend[source_symbol].replace('house', 'roof')
    palette_entries[roof_name] = palette_entries[house_legend[source_symbol]]
    roof_legend[roof_symbol] = roof_name
house_legend.update(roof_legend)
roof_symbols = set(roof_legend)
always = lambda rgb: True
house_source = HEADER + grid_literal('HOUSE', house_rows) + '\n' + legend_literal('HOUSE_LEGEND', house_legend) + '\n'
house_source += legend_literal('PURPLE_ROOF_LEGEND', recolor(house_legend, roof_symbols, 'AsPurple', 5, 278, always), 'HOUSE_LEGEND') + '\n'
house_source += legend_literal('BLUE_ROOF_LEGEND', recolor(house_legend, roof_symbols, 'AsBlue', 5, 212, always), 'HOUSE_LEGEND') + '\n'
house_source += legend_literal('GOLD_ROOF_LEGEND', recolor(house_legend, roof_symbols, 'AsGold', 5, 40, always), 'HOUSE_LEGEND')
open(os.path.join(PROJECT, 'src/tools/spriteBaker/HouseArt.ts'), 'w', encoding='utf-8', newline='\n').write(house_source)


def cut_tiles(rows, count):
    size = len(rows)
    base = Counter(symbol for row in rows for symbol in row).most_common(1)[0][0]
    candidates = []
    for top in range(0, size - TILE + 1):
        for left in range(0, size - TILE + 1):
            window = [list(rows[top + y][left:left + TILE]) for y in range(TILE)]
            queue = deque()
            for index in range(TILE):
                for x, y in ((index, 0), (index, TILE - 1), (0, index), (TILE - 1, index)):
                    if window[y][x] != base:
                        queue.append((x, y))
            removed = 0
            while queue:
                x, y = queue.popleft()
                if not (0 <= x < TILE and 0 <= y < TILE) or window[y][x] == base:
                    continue
                window[y][x] = base
                removed += 1
                queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
            detail = sum(1 for row in window for symbol in row if symbol != base)
            candidates.append((detail - removed * 2, top, left, [''.join(row) for row in window]))
    if max(candidate[0] for candidate in candidates) < 4:
        candidates = []
        for top in range(0, size - TILE + 1):
            for left in range(0, size - TILE + 1):
                window = [
                    ''.join(
                        rows[top + y][left + x] if 2 <= x < TILE - 2 and 2 <= y < TILE - 2 else base
                        for x in range(TILE)
                    )
                    for y in range(TILE)
                ]
                detail = sum(1 for row in window for symbol in row if symbol != base)
                candidates.append((detail if 10 <= detail <= 45 else 0, top, left, window))
    candidates.sort(key=lambda candidate: -candidate[0])
    chosen = []
    for score, top, left, window in candidates:
        if score < 4:
            break
        if all(abs(top - other_top) >= TILE - 4 or abs(left - other_left) >= TILE - 4 for _, other_top, other_left, _ in chosen):
            chosen.append((score, top, left, window))
        if len(chosen) == count:
            break
    return [base * TILE for _ in range(TILE)], [window for _, _, _, window in chosen]


terrain_source = HEADER
terrain_source += grid_literal('TREE', tree) + '\n' + grid_literal('PINE', pine) + '\n' + grid_literal('ROCK', rock) + '\n'
for name, index in (('GRASS', 4), ('SNOW', 5), ('ASH', 6), ('PATH', 7)):
    plain, variants = cut_tiles(world['sprites'][index]['rows'], 3)
    print(name, 'variants', len(variants))
    terrain_source += grid_literal(f'{name}_PLAIN', plain) + '\n'
    for variant_index, variant in enumerate(variants):
        terrain_source += grid_literal(f'{name}_DETAIL_{variant_index + 1}', variant) + '\n'
terrain_source += legend_literal('WORLD_LEGEND', world_legend)
open(os.path.join(PROJECT, 'src/tools/spriteBaker/TerrainArt.ts'), 'w', encoding='utf-8', newline='\n').write(terrain_source)

items = load('extras-trace')
item_legend = register(items)
item_names = ['DOG_FRONT', 'DOG_SIDE', 'DOG_BACK', 'HEART', 'STAR', 'BOMB', 'POTION', 'EXPLOSION']
item_source = HEADER
for name, sprite in zip(item_names, items['sprites']):
    item_source += grid_literal(name, sprite['rows']) + '\n'
item_source += legend_literal('ITEM_LEGEND', item_legend) + '\n'
empty_heart = {}
for symbol in sorted(used_symbols(items['sprites'][3]['rows'])):
    name = item_legend[symbol]
    hue, lightness, saturation = hls(palette_entries[name])
    if lightness < 0.13:
        continue
    dimmed = colorsys.hls_to_rgb(hue / 360, 0.12 + lightness * 0.22, saturation * 0.25)
    palette_entries[name + 'AsEmpty'] = tuple(int(round(channel * 255)) for channel in dimmed)
    empty_heart[symbol] = name + 'AsEmpty'
item_source += legend_literal('EMPTY_HEART_LEGEND', empty_heart, 'ITEM_LEGEND')
open(os.path.join(PROJECT, 'src/tools/spriteBaker/ItemArt.ts'), 'w', encoding='utf-8', newline='\n').write(item_source)

palette_lines = '\n'.join(f"  {name}: 0x{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}," for name, rgb in palette_entries.items())
open(os.path.join(PROJECT, 'src/game/elements/ArtPalette.ts'), 'w', encoding='utf-8', newline='\n').write(
    f'export const ART_PALETTE = {{\n{palette_lines}\n}} as const;\n')
print('palette entries', len(palette_entries), 'roof symbols', len(roof_legend))
