import json
import os
import sys
from collections import Counter, deque

PROJECT = sys.argv[1]
TRACE = os.path.join(PROJECT, 'art-references', 'v2', 'trace')
ART = os.path.join(PROJECT, 'src', 'tools', 'spriteBaker')
TILE = 16
HEADER = "import type { PixelGrid, PixelLegend } from '../../game/elements';\n\n"

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


def legend_literal(name, legend, rows_list):
    used = set()
    for rows in rows_list:
        for row in rows:
            used.update(symbol for symbol in row if symbol != '.')
    lines = [f"  '{symbol}': '{key}'," for symbol, key in sorted(legend.items()) if symbol in used]
    return f'export const {name}: PixelLegend = {{\n' + '\n'.join(lines) + '\n};\n'


def write_art(file_name, sections):
    source = HEADER
    for trace_name, legend_name, picks in sections:
        trace = load(trace_name)
        legend = register(trace)
        chosen = []
        for index, grid_name in picks:
            rows = trace['sprites'][index]['rows']
            chosen.append(rows)
            source += grid_literal(grid_name, rows) + '\n'
        source += legend_literal(legend_name, legend, chosen) + '\n'
    with open(os.path.join(ART, file_name), 'w', encoding='utf-8', newline='\n') as handle:
        handle.write(source.rstrip('\n') + '\n')


def cut_tiles(rows, count):
    size = min(len(rows), min(len(row) for row in rows))
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


write_art('SkeletonArt.ts', [
    ('monsters-a', 'NEW_MONSTER_LEGEND', [
        (0, 'SKELETON_FRONT'), (1, 'SKELETON_SIDE'), (2, 'SKELETON_BACK'),
        (4, 'MUSHROOM_FRONT'), (5, 'MUSHROOM_SIDE'), (6, 'MUSHROOM_BACK'),
    ]),
    ('small-a', 'SMALL_PROJECTILE_LEGEND', [(3, 'BONE'), (7, 'SPORE')]),
])
write_art('GolemArt.ts', [
    ('monsters-b', 'GOLEM_LEGEND', [(2, 'GOLEM_FRONT'), (3, 'GOLEM_SIDE'), (4, 'GOLEM_BACK')]),
    ('small-b', 'BAT_COIN_LEGEND', [(0, 'BAT_WINGS_UP'), (1, 'BAT_WINGS_DOWN'), (5, 'LAVA_BALL'), (6, 'COIN'), (7, 'COIN_STACK')]),
])
write_art('VillagerArt.ts', [
    ('villagers', 'VILLAGER_LEGEND', [
        (0, 'VILLAGER_ELDER'), (1, 'VILLAGER_FARMER'), (2, 'VILLAGER_SMITH'), (3, 'VILLAGER_BOY'),
        (4, 'VILLAGER_WIZARD'), (5, 'VILLAGER_HUNTER'), (6, 'BUBBLE_QUEST'), (7, 'BUBBLE_DONE'),
    ]),
])
write_art('VillageArt.ts', [
    ('houses', 'VILLAGE_HOUSE_LEGEND', [
        (0, 'HOUSE_THATCH'), (1, 'HOUSE_STONE'), (2, 'HOUSE_CABIN'),
        (3, 'HOUSE_ADOBE'), (4, 'HOUSE_STILT'), (5, 'HOUSE_FORGE'),
    ]),
    ('decor', 'VILLAGE_DECOR_LEGEND', [
        (0, 'FOUNTAIN'), (1, 'STREET_LAMP'), (2, 'WELL'), (3, 'BENCH'),
        (4, 'MARKET_STALL'), (5, 'FLOWER_BED'), (6, 'BARRELS'), (7, 'FENCE'),
    ]),
])
write_art('BreakableArt.ts', [
    ('breakables', 'BREAKABLE_LEGEND', [
        (0, 'BUSH'), (1, 'SNOW_BUSH'), (2, 'CLAY_POT'), (3, 'LAVA_CRYSTAL'),
        (4, 'BARREL_CACTUS'), (5, 'REEDS'), (6, 'CRATE'), (7, 'TALL_GRASS'),
    ]),
])

biomes = load('biomes')
biome_legend = register(biomes)
biome_source = HEADER
biome_grids = []
for index, name in ((0, 'CACTUS'), (1, 'DEAD_TREE'), (2, 'WILLOW'), (3, 'MOSSY_LOG'), (4, 'LILY_PADS'), (5, 'DESERT_SKULL')):
    rows = biomes['sprites'][index]['rows']
    biome_grids.append(rows)
    biome_source += grid_literal(name, rows) + '\n'
for index, name in ((6, 'SAND'), (7, 'SWAMP')):
    plain, variants = cut_tiles(biomes['sprites'][index]['rows'], 3)
    print(name, 'variants', len(variants))
    biome_grids.append(plain)
    biome_source += grid_literal(f'{name}_PLAIN', plain) + '\n'
    for variant_index, variant in enumerate(variants):
        biome_grids.append(variant)
        biome_source += grid_literal(f'{name}_DETAIL_{variant_index + 1}', variant) + '\n'
biome_source += legend_literal('BIOME_LEGEND', biome_legend, biome_grids)
with open(os.path.join(ART, 'BiomeArt.ts'), 'w', encoding='utf-8', newline='\n') as handle:
    handle.write(biome_source)

palette_lines = '\n'.join(f"  {name}: 0x{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}," for name, rgb in palette_entries.items())
with open(os.path.join(PROJECT, 'src', 'game', 'elements', 'WorldArtPalette.ts'), 'w', encoding='utf-8', newline='\n') as handle:
    handle.write(f'export const WORLD_ART_PALETTE = {{\n{palette_lines}\n}} as const;\n')
print('palette entries', len(palette_entries))
