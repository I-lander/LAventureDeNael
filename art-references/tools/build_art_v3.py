import colorsys
import json
import os
import sys

PROJECT = sys.argv[1]
CHOICES = json.loads(sys.argv[2])
TRACE = os.path.join(PROJECT, 'art-references', 'v3', 'trace')
ART = os.path.join(PROJECT, 'src', 'tools', 'spriteBaker', 'half')
HEADER = "import type { PixelGrid, PixelLegend } from '../../../game/elements';\n\n"

palette_entries = {}


def load(name):
    with open(os.path.join(TRACE, name + '.json'), encoding='utf-8') as handle:
        return json.load(handle)


def register(trace):
    for entry in trace['palette']:
        palette_entries[entry['name']] = tuple(entry['rgb'])
    return {entry['symbol']: entry['name'] for entry in trace['palette']}


def grid_literal(name, rows):
    width = max(len(row) for row in rows)
    body = '\n'.join("  '" + row.ljust(width, '.') + "'," for row in rows)
    return f'export const {name}: PixelGrid = [\n{body}\n];\n'


def used_symbols(rows_list):
    return {symbol for rows in rows_list for row in rows for symbol in row if symbol != '.'}


def legend_literal(name, mapping, base=None):
    lines = [f"  '{symbol}': '{key}'," for symbol, key in sorted(mapping.items())]
    spread = f'  ...{base},\n' if base else ''
    return f'export const {name}: PixelLegend = {{\n{spread}' + '\n'.join(lines) + '\n};\n'


def hls(rgb):
    hue, lightness, saturation = colorsys.rgb_to_hls(*(channel / 255 for channel in rgb))
    return hue * 360, lightness, saturation


def to_rgb(hue, lightness, saturation):
    return tuple(int(round(channel * 255)) for channel in colorsys.hls_to_rgb((hue % 360) / 360, lightness, saturation))


def recolor(legend, symbols, suffix, transform, predicate):
    variant = {}
    for symbol in sorted(symbols):
        name = legend[symbol]
        rgb = palette_entries[name]
        if not predicate(rgb):
            continue
        palette_entries[name + suffix] = transform(rgb)
        variant[symbol] = name + suffix
    return variant


def is_green(rgb):
    hue, lightness, saturation = hls(rgb)
    return 70 <= hue <= 170 and saturation > 0.12


def shift_hue(source_hue, target_hue):
    def transform(rgb):
        hue, lightness, saturation = hls(rgb)
        delta = ((hue - source_hue + 180) % 360) - 180
        return to_rgb(target_hue + delta * 0.5, lightness, saturation)
    return transform


def dim(rgb):
    hue, lightness, saturation = hls(rgb)
    return to_rgb(hue, 0.12 + lightness * 0.22, saturation * 0.25)


def write(file_name, source):
    os.makedirs(ART, exist_ok=True)
    with open(os.path.join(ART, file_name), 'w', encoding='utf-8', newline='\n') as handle:
        handle.write(source.rstrip('\n') + '\n')


def section(trace_name, legend_name, picks):
    trace = load(trace_name)
    legend = register(trace)
    source = ''
    chosen = []
    for index, grid_name in picks:
        rows = trace['sprites'][index]['rows']
        chosen.append(rows)
        source += grid_literal(grid_name, rows) + '\n'
    used = used_symbols(chosen)
    source += legend_literal(legend_name, {symbol: key for symbol, key in legend.items() if symbol in used}) + '\n'
    return source, legend, chosen


hero_source, _, _ = section('hero', 'HERO_LEGEND', [
    (0, 'HERO_SOUTH'), (1, 'HERO_SOUTH_EAST'), (2, 'HERO_EAST'), (3, 'HERO_NORTH_EAST'), (4, 'HERO_NORTH'),
    (5, 'DOG_FRONT'), (6, 'DOG_SIDE'), (7, 'DOG_BACK'),
])
write('HeroHalf.ts', HEADER + hero_source)

slime_source, slime_legend, slime_grids = section('slimes', 'MONSTER_LEGEND', [
    (0, 'SLIME_FRONT'), (1, 'SLIME_SIDE'), (2, 'SLIME_BACK'), (3, 'KING_SLIME'),
    (4, 'ARCHER_FRONT'), (5, 'ARCHER_SIDE'), (6, 'ARCHER_BACK'), (7, 'BOMBER_FRONT'),
])
slime_symbols = used_symbols(slime_grids[:3])
king_symbols = used_symbols(slime_grids[3:4])
slime_source += legend_literal('BLUE_SLIME_LEGEND', recolor(slime_legend, slime_symbols, 'AsBlue', shift_hue(110, 212), is_green), 'MONSTER_LEGEND') + '\n'
slime_source += legend_literal('RED_SLIME_LEGEND', recolor(slime_legend, slime_symbols, 'AsRed', shift_hue(110, 352), is_green), 'MONSTER_LEGEND') + '\n'
slime_source += legend_literal('KING_SLIME_ANGRY_LEGEND', recolor(slime_legend, king_symbols, 'AsAngry', shift_hue(110, 14), is_green), 'MONSTER_LEGEND')
write('MonsterHalf.ts', HEADER + slime_source)

golem_source, _, _ = section('golem', 'GOLEM_LEGEND', [
    (0, 'BAT_WINGS_UP'), (1, 'BAT_WINGS_DOWN'), (2, 'GOLEM_FRONT'), (3, 'GOLEM_SIDE'), (4, 'GOLEM_BACK'),
    (5, 'LAVA_BALL'), (6, 'COIN'), (7, 'COIN_STACK'),
])
write('GolemHalf.ts', HEADER + golem_source)

skeleton_source, _, _ = section('skeleton', 'NEW_MONSTER_LEGEND', [
    (0, 'SKELETON_FRONT'), (1, 'SKELETON_SIDE'), (2, 'SKELETON_BACK'), (3, 'BONE'),
    (4, 'MUSHROOM_FRONT'), (5, 'MUSHROOM_SIDE'), (6, 'MUSHROOM_BACK'), (7, 'SPORE'),
])
write('SkeletonHalf.ts', HEADER + skeleton_source)

villager_source, _, _ = section('villagers', 'VILLAGER_LEGEND', [
    (0, 'VILLAGER_ELDER'), (1, 'VILLAGER_FARMER'), (2, 'VILLAGER_SMITH'), (3, 'VILLAGER_BOY'),
    (4, 'VILLAGER_WIZARD'), (5, 'VILLAGER_HUNTER'), (6, 'BUBBLE_QUEST'), (7, 'BUBBLE_DONE'),
])
write('VillagerHalf.ts', HEADER + villager_source)

nature_source, _, _ = section('nature', 'NATURE_LEGEND', [
    (0, 'TREE'), (1, 'PINE'), (2, 'ROCK'), (3, 'CACTUS'), (4, 'DEAD_TREE'), (5, 'WILLOW'), (6, 'MOSSY_LOG'), (7, 'LILY_PADS'),
])
write('NatureHalf.ts', HEADER + nature_source)

decor_source, _, _ = section('decor', 'VILLAGE_DECOR_LEGEND', [
    (0, 'FOUNTAIN'), (1, 'STREET_LAMP'), (2, 'WELL'), (3, 'BENCH'), (4, 'MARKET_STALL'), (5, 'FLOWER_BED'), (6, 'BARRELS'), (7, 'FENCE'),
])
write('DecorHalf.ts', HEADER + decor_source)

breakable_source, _, _ = section('breakables', 'BREAKABLE_LEGEND', [
    (0, 'BUSH'), (1, 'SNOW_BUSH'), (2, 'CLAY_POT'), (3, 'LAVA_CRYSTAL'), (4, 'BARREL_CACTUS'), (5, 'REEDS'), (6, 'CRATE'), (7, 'TALL_GRASS'),
])
write('BreakableHalf.ts', HEADER + breakable_source)

item_source, item_legend, item_grids = section('items', 'ITEM_LEGEND', [
    (0, 'HEART'), (1, 'STAR'), (2, 'BOMB'), (3, 'EXPLOSION'), (4, 'DESERT_SKULL'), (CHOICES['arrowIndex'], 'ARROW'),
])
heart_symbols = used_symbols(item_grids[:1])
item_source += legend_literal('EMPTY_HEART_LEGEND', recolor(item_legend, heart_symbols, 'AsEmpty', dim, lambda rgb: hls(rgb)[1] >= 0.13), 'ITEM_LEGEND')
write('ItemHalf.ts', HEADER + item_source)

house_trace = load('houses')
house_legend = register(house_trace)
house_names = ['HOUSE_THATCH', 'HOUSE_STONE', 'HOUSE_CABIN', 'HOUSE_ADOBE', 'HOUSE_STILT', 'HOUSE_FORGE', 'SHOP_HOUSE']
house_grids = [house_trace['sprites'][index]['rows'] for index in range(len(house_names))]
house_source = HEADER + ''.join(grid_literal(name, rows) + '\n' for name, rows in zip(house_names, house_grids))
house_source += legend_literal('HOUSE_LEGEND', {symbol: key for symbol, key in house_legend.items() if symbol in used_symbols(house_grids)}) + '\n'
shop_rows = house_grids[6]
roof_bottom = CHOICES['shopRoofBottom']


def is_roof_red(rgb):
    hue, lightness, saturation = hls(rgb)
    return (hue <= 20 or hue >= 340) and saturation > 0.3


roof_symbols = {symbol for row in shop_rows[:roof_bottom] for symbol in row if symbol != '.' and is_roof_red(palette_entries[house_legend[symbol]])}
free_symbols = [symbol for symbol in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&()*+,-/:;<=>?@[]^_{|}~' if symbol not in house_legend]
roof_map = {symbol: free_symbols.pop(0) for symbol in sorted(roof_symbols)}
shop_split = [''.join(roof_map.get(symbol, symbol) if y < roof_bottom else symbol for symbol in row) for y, row in enumerate(shop_rows)]
roof_legend = {}
for source_symbol, roof_symbol in roof_map.items():
    roof_name = house_legend[source_symbol] + 'Roof'
    palette_entries[roof_name] = palette_entries[house_legend[source_symbol]]
    roof_legend[roof_symbol] = roof_name
house_source += grid_literal('SHOP_HOUSE_SPLIT', shop_split) + '\n'
house_source += legend_literal('SHOP_RED_LEGEND', roof_legend, 'HOUSE_LEGEND') + '\n'
for suffix, hue in (('Purple', 278), ('Gold', 40)):
    legend_name = f'SHOP_{suffix.upper()}_LEGEND'
    house_source += legend_literal(legend_name, recolor(roof_legend, set(roof_legend), 'As' + suffix, shift_hue(5, hue), lambda rgb: True), 'SHOP_RED_LEGEND') + '\n'
write('HouseHalf.ts', house_source)

palette_lines = '\n'.join(f"  {name}: 0x{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}," for name, rgb in palette_entries.items())
with open(os.path.join(PROJECT, 'src', 'game', 'elements', 'HalfArtPalette.ts'), 'w', encoding='utf-8', newline='\n') as handle:
    handle.write(f'export const HALF_ART_PALETTE = {{\n{palette_lines}\n}} as const;\n')
print('palette entries', len(palette_entries), 'roof symbols', len(roof_map))
