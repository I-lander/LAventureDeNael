import json
import os
import re

from spritelib import ELEMENTS, HALF_PALETTES, PROJECT, read_text

V3 = 'art-references/v3'
V4 = 'art-references/v4'

FAMILIES = [
    {
        'family': 'hero', 'art': 'HeroHalf.ts', 'oldPrefix': 'hero2', 'paletteFile': 'HeroPalette.ts', 'paletteConst': 'HERO_PALETTE', 'keyPrefix': 'hero',
        'reference': f'{V3}/hero-b.jpg', 'design': [f'{V3}/input/hero-design.png'], 'cells': 'cells.json', 'legend': 'HERO_LEGEND',
        'sprites': [
            ('HERO_SOUTH', 0, {'box': [30, 30, 4]}), ('HERO_SOUTH_EAST', 1, {'box': [30, 30, 4]}), ('HERO_EAST', 2, {'box': [30, 30, 4]}),
            ('HERO_NORTH_EAST', 3, {'box': [30, 30, 4]}), ('HERO_NORTH', 4, {'box': [30, 30, 4]}),
            ('DOG_FRONT', 5, {'box': [18, 16, 2]}), ('DOG_SIDE', 6, {'box': [18, 16, 2]}), ('DOG_BACK', 7, {'box': [18, 16, 2]}),
        ],
    },
    {
        'family': 'monster', 'art': 'MonsterHalf.ts', 'oldPrefix': 'slime2', 'paletteFile': 'MonsterPalette.ts', 'paletteConst': 'MONSTER_PALETTE', 'keyPrefix': 'monster',
        'reference': f'{V3}/slimes-a.jpg', 'design': [f'{V3}/input/slimes-design.png'], 'cells': 'cells.json', 'legend': 'MONSTER_LEGEND',
        'sprites': [
            ('SLIME_FRONT', 0, {'box': [28, 22, 2], 'legends': ['MONSTER_LEGEND', 'BLUE_SLIME_LEGEND', 'RED_SLIME_LEGEND']}),
            ('SLIME_SIDE', 1, {'box': [28, 22, 2], 'legends': ['MONSTER_LEGEND', 'BLUE_SLIME_LEGEND', 'RED_SLIME_LEGEND']}),
            ('SLIME_BACK', 2, {'box': [28, 22, 2], 'legends': ['MONSTER_LEGEND', 'BLUE_SLIME_LEGEND', 'RED_SLIME_LEGEND']}),
            ('KING_SLIME', 3, {'legends': ['MONSTER_LEGEND', 'KING_SLIME_ANGRY_LEGEND']}),
            ('ARCHER_FRONT', 4, {'box': [38, 32, 3]}), ('ARCHER_SIDE', 5, {'box': [38, 32, 3]}), ('ARCHER_BACK', 6, {'box': [38, 32, 3]}),
            ('BOMBER_FRONT', 7, {'box': [38, 32, 3]}),
        ],
    },
    {
        'family': 'skeleton', 'art': 'SkeletonHalf.ts', 'oldPrefix': 'skel2', 'paletteFile': 'SkeletonPalette.ts', 'paletteConst': 'SKELETON_PALETTE', 'keyPrefix': 'skeleton',
        'reference': f'{V3}/skeleton3-a.jpg', 'design': [f'{V3}/input/skeleton-design.png'], 'cells': 'cells.json', 'legend': 'NEW_MONSTER_LEGEND',
        'sprites': [
            ('SKELETON_FRONT', 0, {'box': [38, 34, 3]}), ('SKELETON_SIDE', 1, {'box': [38, 34, 3]}), ('SKELETON_BACK', 2, {'box': [38, 34, 3]}),
            ('BONE', 3, {}),
            ('MUSHROOM_FRONT', 4, {'box': [34, 31, 2]}), ('MUSHROOM_SIDE', 5, {'box': [34, 31, 2]}), ('MUSHROOM_BACK', 6, {'box': [34, 31, 2]}),
            ('SPORE', 7, {}),
        ],
    },
    {
        'family': 'golem', 'art': 'GolemHalf.ts', 'oldPrefix': 'golem2', 'paletteFile': 'GolemPalette.ts', 'paletteConst': 'GOLEM_PALETTE', 'keyPrefix': 'golem',
        'reference': f'{V3}/golem-b.jpg', 'design': [f'{V3}/input/golem-design.png', f'{V3}/golem-a.jpg'], 'cells': 'cells.json', 'legend': 'GOLEM_LEGEND',
        'sprites': [
            ('BAT_WINGS_UP', 0, {'max': [20, 13]}), ('BAT_WINGS_DOWN', 1, {'max': [20, 13]}),
            ('GOLEM_FRONT', 2, {'box': [44, 32, 3]}), ('GOLEM_SIDE', 3, {'box': [44, 32, 3]}), ('GOLEM_BACK', 4, {'box': [44, 32, 3]}),
            ('LAVA_BALL', 5, {}), ('COIN', 6, {}), ('COIN_STACK', 7, {}),
        ],
    },
    {
        'family': 'villager', 'art': 'VillagerHalf.ts', 'oldPrefix': 'villager2', 'paletteFile': 'VillagerPalette.ts', 'paletteConst': 'VILLAGER_PALETTE', 'keyPrefix': 'villager',
        'reference': f'{V3}/villagers3-b.jpg', 'design': [f'{V3}/input/villagers-design.png'], 'cells': 'cells.json', 'legend': 'VILLAGER_LEGEND',
        'sprites': [
            ('VILLAGER_ELDER', 0, {}), ('VILLAGER_FARMER', 1, {}), ('VILLAGER_SMITH', 2, {}), ('VILLAGER_BOY', 3, {}),
            ('VILLAGER_WIZARD', 4, {}), ('VILLAGER_HUNTER', 5, {}), ('BUBBLE_QUEST', 6, {}), ('BUBBLE_DONE', 7, {}),
        ],
    },
    {
        'family': 'nature', 'art': 'NatureHalf.ts', 'oldPrefix': 'nature2', 'paletteFile': 'NaturePalette.ts', 'paletteConst': 'NATURE_PALETTE', 'keyPrefix': 'nature',
        'reference': f'{V3}/nature3-a.jpg', 'design': [f'{V3}/input/nature-design.png'], 'cells': 'cells.json', 'legend': 'NATURE_LEGEND',
        'sprites': [
            ('TREE', 0, {}), ('PINE', 1, {}), ('ROCK', 2, {}), ('CACTUS', 3, {}),
            ('DEAD_TREE', 4, {}), ('WILLOW', 5, {}), ('MOSSY_LOG', 6, {}), ('LILY_PADS', 7, {}),
        ],
    },
    {
        'family': 'decor', 'art': 'DecorHalf.ts', 'oldPrefix': 'decor2', 'paletteFile': 'DecorPalette.ts', 'paletteConst': 'DECOR_PALETTE', 'keyPrefix': 'decor',
        'reference': f'{V3}/decor-a.jpg', 'design': [f'{V3}/input/decor-design.png'], 'cells': 'cells.json', 'legend': 'VILLAGE_DECOR_LEGEND',
        'sprites': [
            ('FOUNTAIN', 0, {}), ('STREET_LAMP', 1, {}), ('WELL', 2, {}), ('BENCH', 3, {}),
            ('MARKET_STALL', 4, {}), ('FLOWER_BED', 5, {}), ('BARRELS', 6, {}), ('FENCE', 7, {}),
        ],
    },
    {
        'family': 'breakable', 'art': 'BreakableHalf.ts', 'oldPrefix': 'breakable2', 'paletteFile': 'BreakablePalette.ts', 'paletteConst': 'BREAKABLE_PALETTE', 'keyPrefix': 'breakable',
        'reference': f'{V3}/breakables3-a.jpg', 'design': [f'{V3}/input/breakables-design.png'], 'cells': 'cells.json', 'legend': 'BREAKABLE_LEGEND',
        'sprites': [
            ('BUSH', 0, {}), ('SNOW_BUSH', 1, {}), ('CLAY_POT', 2, {}), ('LAVA_CRYSTAL', 3, {}),
            ('BARREL_CACTUS', 4, {}), ('REEDS', 5, {}), ('CRATE', 6, {}), ('TALL_GRASS', 7, {}),
        ],
    },
    {
        'family': 'item', 'art': 'ItemHalf.ts', 'oldPrefix': 'item2', 'paletteFile': 'ItemPalette.ts', 'paletteConst': 'ITEM_PALETTE', 'keyPrefix': 'item',
        'reference': f'{V3}/items-b.jpg', 'design': [f'{V3}/input/items-design.png', f'{V3}/items-a.jpg'], 'cells': 'cells-b.json', 'legend': 'ITEM_LEGEND',
        'sprites': [
            ('HEART', 0, {'legends': ['ITEM_LEGEND', 'EMPTY_HEART_LEGEND']}), ('STAR', 1, {}), ('BOMB', 2, {}),
            ('EXPLOSION', 3, {}), ('DESERT_SKULL', 4, {}), ('ARROW', 7, {}),
        ],
    },
    {
        'family': 'house', 'art': 'HouseHalf.ts', 'oldPrefix': 'house2', 'paletteFile': 'HousePalette.ts', 'paletteConst': 'HOUSE_PALETTE', 'keyPrefix': 'house',
        'reference': f'{V3}/houses-b.jpg', 'design': ['art-references/input/house-approved.png', f'{V3}/input/shop-design.png'], 'cells': 'cells.json', 'legend': 'HOUSE_LEGEND',
        'sprites': [
            ('HOUSE_THATCH', 0, {}), ('HOUSE_STONE', 1, {}), ('HOUSE_CABIN', 2, {}), ('HOUSE_ADOBE', 3, {}),
            ('HOUSE_STILT', 4, {}), ('HOUSE_FORGE', 5, {}), ('SHOP_HOUSE', 6, {}),
            ('SHOP_HOUSE_SPLIT', 6, {'legends': ['SHOP_RED_LEGEND', 'SHOP_PURPLE_LEGEND', 'SHOP_GOLD_LEGEND']}),
        ],
    },
]


def split_palette():
    aggregator = os.path.join(ELEMENTS, 'HalfArtPalette.ts')
    source = read_text(aggregator)
    entries = re.findall(r'^\s*(\w+): (0x[0-9a-fA-F]{6}),', source, re.M)
    if not entries:
        print('HalfArtPalette.ts is already split')
        return
    os.makedirs(HALF_PALETTES, exist_ok=True)
    assigned = 0
    for family in FAMILIES:
        lines = [f'  {key}: {value},' for key, value in entries if key.startswith(family['oldPrefix'])]
        assigned += len(lines)
        body = f"export const {family['paletteConst']} = {{\n" + '\n'.join(lines) + '\n} as const;\n'
        with open(os.path.join(HALF_PALETTES, family['paletteFile']), 'w', encoding='utf-8', newline='\n') as handle:
            handle.write(body)
    if assigned != len(entries):
        raise SystemExit(f'{len(entries) - assigned} palette entries match no family prefix')
    imports = '\n'.join(f"import {{ {family['paletteConst']} }} from './halfPalette/{family['paletteFile'][:-3]}';" for family in FAMILIES)
    spreads = '\n'.join(f"  ...{family['paletteConst']}," for family in FAMILIES)
    with open(aggregator, 'w', encoding='utf-8', newline='\n') as handle:
        handle.write(f'{imports}\n\nexport const HALF_ART_PALETTE = {{\n{spreads}\n}} as const;\n')
    print('split', len(entries), 'palette entries into', len(FAMILIES), 'files')


def write_families():
    for family in FAMILIES:
        folder = os.path.join(PROJECT, V4, family['family'])
        os.makedirs(folder, exist_ok=True)
        cells = f"{V4}/{family['family']}/{family['cells']}"
        sprites = []
        for name, index, extra in family['sprites']:
            entry = {'name': name, 'cells': cells, 'index': index}
            if 'legends' not in extra:
                entry['legend'] = family['legend']
            entry.update(extra)
            sprites.append(entry)
        payload = {
            'family': family['family'],
            'art': f"src/tools/spriteBaker/half/{family['art']}",
            'palette': f"src/game/elements/halfPalette/{family['paletteFile']}",
            'paletteConst': family['paletteConst'],
            'keyPrefix': family['keyPrefix'],
            'reference': family['reference'],
            'design': family['design'],
            'sprites': sprites,
        }
        with open(os.path.join(folder, 'family.json'), 'w', encoding='utf-8', newline='\n') as handle:
            json.dump(payload, handle, indent=2)
            handle.write('\n')
        print('wrote', f"{V4}/{family['family']}/family.json")


split_palette()
write_families()
