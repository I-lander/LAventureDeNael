import type {
  BiomeDef,
  BiomeKind,
  BreakableDef,
  BreakableKind,
  DecorDef,
  DecorKind,
  HouseDef,
  HouseKind,
  ShopDef,
  ShopKind,
  VillagePropDef,
  VillagePropKind,
  VillagerDef,
  VillagerKind,
} from './types';
import { TEXTURE } from './SpriteCatalog';
import { LAYOUT_UNIT, PIXEL_SCALE } from './constants';

export const WORLD_SEED = 1337;
export const TILE_ART_SIZE = 8;
export const TILE_SIZE = TILE_ART_SIZE * PIXEL_SCALE;
export const CHUNK_TILES = 16;
export const CHUNK_SIZE = CHUNK_TILES * TILE_SIZE;

export const VILLAGE_CELL_TILES = 150;
export const VILLAGE_MARGIN_TILES = 36;
export const VILLAGE_SAFE_MARGIN_TILES = 4;
export const VILLAGE_NAME = 'VILLAGE';

export const GROUND_DETAIL_CHANCE = 0.12;
export const BIOME_SCALE_TILES = 150;
export const BIOME_BLEND_JITTER = 0.022;
export const HOME_BIOME_RADIUS_TILES = 45;
export const HOME_BIOME_BLEND_TILES = 45;

export const SHOP_DOOR_RADIUS = 10 * LAYOUT_UNIT;
export const SHOP_DOOR_RELEASE_RADIUS = 22 * LAYOUT_UNIT;
export const NPC_TALK_RADIUS = 14 * LAYOUT_UNIT;
export const NPC_RELEASE_RADIUS = 26 * LAYOUT_UNIT;

export const BIOMES: BiomeDef[] = [
  {
    kind: 'forest',
    name: 'LA FORET',
    groveDecor: [{ kind: 'tree', chance: 0.09 }],
    scatterDecor: [
      { kind: 'tree', chance: 0.006 },
      { kind: 'mossyLog', chance: 0.0015 },
    ],
    breakables: [
      { kind: 'bush', chance: 0.009 },
      { kind: 'tallGrass', chance: 0.012 },
    ],
    enemies: [
      { kind: 'greenSlime', weight: 5 },
      { kind: 'mushroom', weight: 3 },
      { kind: 'goblinArcher', weight: 2 },
      { kind: 'blueSlime', weight: 1 },
    ],
    houses: ['thatch', 'stone', 'forge'],
  },
  {
    kind: 'snow',
    name: 'LA NEIGE',
    groveDecor: [{ kind: 'pine', chance: 0.09 }],
    scatterDecor: [{ kind: 'pine', chance: 0.007 }],
    breakables: [{ kind: 'snowBush', chance: 0.013 }],
    enemies: [
      { kind: 'blueSlime', weight: 5 },
      { kind: 'bat', weight: 3 },
      { kind: 'goblinArcher', weight: 2 },
      { kind: 'skeleton', weight: 1 },
    ],
    houses: ['cabin', 'stone', 'cabin'],
  },
  {
    kind: 'volcano',
    name: 'LE VOLCAN',
    groveDecor: [
      { kind: 'rock', chance: 0.05 },
      { kind: 'deadTree', chance: 0.025 },
    ],
    scatterDecor: [
      { kind: 'rock', chance: 0.005 },
      { kind: 'deadTree', chance: 0.002 },
    ],
    breakables: [{ kind: 'lavaCrystal', chance: 0.011 }],
    enemies: [
      { kind: 'redSlime', weight: 4 },
      { kind: 'goblinBomber', weight: 3 },
      { kind: 'lavaGolem', weight: 2 },
    ],
    houses: ['stone', 'forge'],
  },
  {
    kind: 'desert',
    name: 'LE DESERT',
    groveDecor: [
      { kind: 'cactus', chance: 0.035 },
      { kind: 'deadTree', chance: 0.008 },
    ],
    scatterDecor: [
      { kind: 'cactus', chance: 0.004 },
      { kind: 'desertSkull', chance: 0.002 },
    ],
    breakables: [
      { kind: 'barrelCactus', chance: 0.01 },
      { kind: 'clayPot', chance: 0.003 },
    ],
    enemies: [
      { kind: 'skeleton', weight: 5 },
      { kind: 'goblinBomber', weight: 2 },
      { kind: 'bat', weight: 1 },
      { kind: 'redSlime', weight: 1 },
    ],
    houses: ['adobe'],
  },
  {
    kind: 'swamp',
    name: 'LE MARAIS',
    groveDecor: [
      { kind: 'willow', chance: 0.07 },
      { kind: 'lilyPads', chance: 0.02 },
    ],
    scatterDecor: [
      { kind: 'lilyPads', chance: 0.006 },
      { kind: 'willow', chance: 0.004 },
      { kind: 'mossyLog', chance: 0.002 },
    ],
    breakables: [
      { kind: 'reeds', chance: 0.014 },
      { kind: 'bush', chance: 0.004 },
    ],
    enemies: [
      { kind: 'mushroom', weight: 4 },
      { kind: 'bat', weight: 3 },
      { kind: 'greenSlime', weight: 3 },
    ],
    houses: ['stilt', 'thatch', 'stilt'],
  },
];

export function getBiomeDef(kind: BiomeKind): BiomeDef {
  const biomeDef = BIOMES.find((entry) => entry.kind === kind);
  if (!biomeDef) {
    throw new Error(`Unknown biome kind ${kind}`);
  }
  return biomeDef;
}

export const DECORS: DecorDef[] = [
  { kind: 'tree', texture: TEXTURE.tree, blockRadius: 5 * LAYOUT_UNIT },
  { kind: 'pine', texture: TEXTURE.pine, blockRadius: 5 * LAYOUT_UNIT },
  { kind: 'rock', texture: TEXTURE.rock, blockRadius: 8 * LAYOUT_UNIT },
  { kind: 'cactus', texture: TEXTURE.cactus, blockRadius: 4 * LAYOUT_UNIT },
  { kind: 'deadTree', texture: TEXTURE.deadTree, blockRadius: 4 * LAYOUT_UNIT },
  { kind: 'willow', texture: TEXTURE.willow, blockRadius: 5 * LAYOUT_UNIT },
  { kind: 'mossyLog', texture: TEXTURE.mossyLog, blockRadius: 8 * LAYOUT_UNIT },
  { kind: 'lilyPads', texture: TEXTURE.lilyPads, blockRadius: 0 },
  { kind: 'desertSkull', texture: TEXTURE.desertSkull, blockRadius: 0 },
];

export function getDecorDef(kind: DecorKind): DecorDef {
  const decorDef = DECORS.find((entry) => entry.kind === kind);
  if (!decorDef) {
    throw new Error(`Unknown decor kind ${kind}`);
  }
  return decorDef;
}

export const BREAKABLES: BreakableDef[] = [
  { kind: 'bush', texture: TEXTURE.bush, blockRadius: 6 * LAYOUT_UNIT, hitRadius: 8 * LAYOUT_UNIT, debrisTexture: TEXTURE.leafBits },
  { kind: 'snowBush', texture: TEXTURE.snowBush, blockRadius: 6 * LAYOUT_UNIT, hitRadius: 8 * LAYOUT_UNIT, debrisTexture: TEXTURE.snowBits },
  { kind: 'clayPot', texture: TEXTURE.clayPot, blockRadius: 5 * LAYOUT_UNIT, hitRadius: 7 * LAYOUT_UNIT, debrisTexture: TEXTURE.clayBits },
  { kind: 'lavaCrystal', texture: TEXTURE.lavaCrystal, blockRadius: 6 * LAYOUT_UNIT, hitRadius: 8 * LAYOUT_UNIT, debrisTexture: TEXTURE.crystalBits },
  { kind: 'barrelCactus', texture: TEXTURE.barrelCactus, blockRadius: 5 * LAYOUT_UNIT, hitRadius: 7 * LAYOUT_UNIT, debrisTexture: TEXTURE.leafBits },
  { kind: 'reeds', texture: TEXTURE.reeds, blockRadius: 0, hitRadius: 8 * LAYOUT_UNIT, debrisTexture: TEXTURE.leafBits },
  { kind: 'crate', texture: TEXTURE.crate, blockRadius: 5 * LAYOUT_UNIT, hitRadius: 7 * LAYOUT_UNIT, debrisTexture: TEXTURE.woodBits },
  { kind: 'tallGrass', texture: TEXTURE.tallGrass, blockRadius: 0, hitRadius: 8 * LAYOUT_UNIT, debrisTexture: TEXTURE.leafBits },
];

export function getBreakableDef(kind: BreakableKind): BreakableDef {
  const breakableDef = BREAKABLES.find((entry) => entry.kind === kind);
  if (!breakableDef) {
    throw new Error(`Unknown breakable kind ${kind}`);
  }
  return breakableDef;
}

export const BREAKABLE_HEART_CHANCE = 0.2;
export const BREAKABLE_COIN_CHANCE = 0.35;
export const BREAKABLE_COIN_STACK_CHANCE = 0.12;
export const COIN_STACK_VALUE = 5;

export const HOUSES: HouseDef[] = [
  { kind: 'thatch', texture: TEXTURE.houseThatch, footprint: { width: 0.86, depth: 0.75 }, doorOffsetX: 0 },
  { kind: 'stone', texture: TEXTURE.houseStone, footprint: { width: 0.94, depth: 0.8 }, doorOffsetX: 0.18 },
  { kind: 'cabin', texture: TEXTURE.houseCabin, footprint: { width: 0.88, depth: 0.75 }, doorOffsetX: 0.1 },
  { kind: 'adobe', texture: TEXTURE.houseAdobe, footprint: { width: 0.94, depth: 0.8 }, doorOffsetX: 0 },
  { kind: 'stilt', texture: TEXTURE.houseStilt, footprint: { width: 0.86, depth: 0.75 }, doorOffsetX: 0 },
  { kind: 'forge', texture: TEXTURE.houseForge, footprint: { width: 0.94, depth: 0.8 }, doorOffsetX: -0.2 },
];

export function getHouseDef(kind: HouseKind): HouseDef {
  const houseDef = HOUSES.find((entry) => entry.kind === kind);
  if (!houseDef) {
    throw new Error(`Unknown house kind ${kind}`);
  }
  return houseDef;
}

export const VILLAGE_PROPS: VillagePropDef[] = [
  { kind: 'fountain', texture: TEXTURE.fountain, footprint: { width: 0.92, depth: 0.6 } },
  { kind: 'well', texture: TEXTURE.well, footprint: { width: 0.75, depth: 0.45 } },
  { kind: 'streetLamp', texture: TEXTURE.streetLamp, footprint: { width: 0.6, depth: 0.12 } },
  { kind: 'bench', texture: TEXTURE.bench, footprint: { width: 0.9, depth: 0.35 } },
  { kind: 'marketStall', texture: TEXTURE.marketStall, footprint: { width: 0.92, depth: 0.4 } },
  { kind: 'flowerBed', texture: TEXTURE.flowerBed, footprint: null },
  { kind: 'barrels', texture: TEXTURE.barrels, footprint: { width: 0.9, depth: 0.5 } },
  { kind: 'fence', texture: TEXTURE.fence, footprint: { width: 1, depth: 0.25 } },
];

export function getVillagePropDef(kind: VillagePropKind): VillagePropDef {
  const propDef = VILLAGE_PROPS.find((entry) => entry.kind === kind);
  if (!propDef) {
    throw new Error(`Unknown village prop kind ${kind}`);
  }
  return propDef;
}

export const VILLAGERS: VillagerDef[] = [
  { kind: 'elder', texture: TEXTURE.villagerElder, names: ['PAPI JO', 'LE SAGE', 'GRAND-PERE'] },
  { kind: 'farmer', texture: TEXTURE.villagerFarmer, names: ['LILOU', 'ROSE', 'CAPUCINE'] },
  { kind: 'smith', texture: TEXTURE.villagerSmith, names: ['BRUNO', 'MARCEL', 'GASTON'] },
  { kind: 'boy', texture: TEXTURE.villagerBoy, names: ['TOM', 'LEO', 'HUGO'] },
  { kind: 'wizard', texture: TEXTURE.villagerWizard, names: ['MELODIE', 'LUNA', 'ESTELLE'] },
  { kind: 'hunter', texture: TEXTURE.villagerHunter, names: ['ARTHUR', 'GUS', 'VICTOR'] },
];

export function getVillagerDef(kind: VillagerKind): VillagerDef {
  const villagerDef = VILLAGERS.find((entry) => entry.kind === kind);
  if (!villagerDef) {
    throw new Error(`Unknown villager kind ${kind}`);
  }
  return villagerDef;
}

export const SHOPS: ShopDef[] = [
  { kind: 'weapons', name: 'ARMURERIE', houseTexture: TEXTURE.houseWeapons, footprint: { width: 0.95, depth: 0.9 }, doorWidth: 0.2 },
  { kind: 'potions', name: 'POTIONS', houseTexture: TEXTURE.housePotions, footprint: { width: 0.95, depth: 0.9 }, doorWidth: 0.2 },
  { kind: 'pet', name: 'ANIMALERIE', houseTexture: TEXTURE.housePet, footprint: { width: 0.95, depth: 0.9 }, doorWidth: 0.2 },
];

export function getShopDef(kind: ShopKind): ShopDef {
  const shopDef = SHOPS.find((entry) => entry.kind === kind);
  if (!shopDef) {
    throw new Error(`Unknown shop kind ${kind}`);
  }
  return shopDef;
}

export const VILLAGE_NAME_STARTS = ['BOURG', 'VAL', 'MONT', 'PRE', 'ROCHE', 'BOIS', 'LAC', 'PONT', 'CLAIR', 'PETIT'];

export const VILLAGE_NAME_ENDS: Record<BiomeKind, string[]> = {
  forest: ['FLEURI', 'VERT', 'JOLI', 'DES BOIS', 'MOUSSU'],
  snow: ['GIVRE', 'BLANC', 'FLOCON', 'DES NEIGES', 'GLACE'],
  volcano: ['BRULANT', 'CENDRE', 'DE FEU', 'ROUGE', 'FUMANT'],
  desert: ['DORE', 'SOLEIL', 'DES SABLES', 'CHAUD', 'DUNE'],
  swamp: ['BRUMEUX', 'DES JONCS', 'MOUILLE', 'GRENOUILLE', 'VASEUX'],
};
