import {
  BIOME_BLEND_JITTER,
  BIOME_SCALE_TILES,
  BiomeKind,
  BreakableKind,
  DecorKind,
  GROUND_DETAIL_CHANCE,
  GROUND_VARIANT_COUNT,
  HOME_BIOME_BLEND_TILES,
  HOME_BIOME_RADIUS_TILES,
  PIXEL_SCALE,
  TILE_ART_SIZE,
  TILE_SIZE,
  VILLAGE_CELL_TILES,
  WORLD_SEED,
  getBiomeDef,
} from '../../elements';

export interface Climate {
  heat: number;
  wetness: number;
}

const DETAIL_SCALE_FACTOR = 0.4;
const DETAIL_WEIGHT = 0.3;
const HOME_HEAT = 0.5;
const HOME_WETNESS = 0.4;
const COLD_BELOW = 0.4;
const HOT_ABOVE = 0.58;
const DRY_BELOW = 0.5;
const WET_ABOVE = 0.55;
const GROVE_SCALE_TILES = 9;
const GROVE_THRESHOLD = 0.6;
const CLUSTER_SCALE_TILES = 6;
const CLUSTER_THRESHOLD = 0.58;
const CLUSTER_BOOST = 3;
const CLUSTER_DAMP = 0.35;
const JITTER_FINE_PIXELS = 3.5;
const JITTER_COARSE_PIXELS = 9;

export const HOME_TILE = { x: Math.floor(VILLAGE_CELL_TILES / 2), y: Math.floor(VILLAGE_CELL_TILES / 2) };

export function hash(x: number, y: number, salt: number): number {
  let value = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(salt + WORLD_SEED, 1274126177);
  value = Math.imul(value ^ (value >>> 13), 1103515245);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967296;
}

function smoothStep(amount: number): number {
  return amount * amount * (3 - 2 * amount);
}

export function valueNoise(x: number, y: number, salt: number): number {
  const baseX = Math.floor(x);
  const baseY = Math.floor(y);
  const blendX = smoothStep(x - baseX);
  const blendY = smoothStep(y - baseY);
  const top = hash(baseX, baseY, salt) * (1 - blendX) + hash(baseX + 1, baseY, salt) * blendX;
  const bottom = hash(baseX, baseY + 1, salt) * (1 - blendX) + hash(baseX + 1, baseY + 1, salt) * blendX;
  return top * (1 - blendY) + bottom * blendY;
}

export function createRandom(seed: number): () => number {
  let state = Math.floor(seed * 4294967296) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

export function shuffled<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function tileOf(worldCoordinate: number): number {
  return Math.floor(worldCoordinate / TILE_SIZE);
}

export function tileCenter(tile: number): number {
  return (tile + 0.5) * TILE_SIZE;
}

function layeredNoise(tileX: number, tileY: number, salt: number): number {
  const turnedX = tileX * 0.8 - tileY * 0.6;
  const turnedY = tileX * 0.6 + tileY * 0.8;
  const wide = valueNoise(turnedX / BIOME_SCALE_TILES, turnedY / BIOME_SCALE_TILES, salt);
  const detailScale = BIOME_SCALE_TILES * DETAIL_SCALE_FACTOR;
  const detail = valueNoise(turnedY / detailScale, -turnedX / detailScale, salt + 1);
  return wide * (1 - DETAIL_WEIGHT) + detail * DETAIL_WEIGHT;
}

export function climateAt(tileX: number, tileY: number): Climate {
  const heat = layeredNoise(tileX, tileY, 11);
  const wetness = layeredNoise(tileX, tileY, 37);
  const homeDistance = Math.hypot(tileX - HOME_TILE.x, tileY - HOME_TILE.y);
  const homePull = Math.min(
    1,
    Math.max(0, (HOME_BIOME_RADIUS_TILES + HOME_BIOME_BLEND_TILES - homeDistance) / HOME_BIOME_BLEND_TILES),
  );
  return {
    heat: heat + (HOME_HEAT - heat) * homePull,
    wetness: wetness + (HOME_WETNESS - wetness) * homePull,
  };
}

export function classifyClimate(heat: number, wetness: number): BiomeKind {
  if (heat < COLD_BELOW) {
    return 'snow';
  }
  if (heat > HOT_ABOVE) {
    return wetness < DRY_BELOW ? 'desert' : 'volcano';
  }
  return wetness > WET_ABOVE ? 'swamp' : 'forest';
}

export function biomeAtTile(tileX: number, tileY: number): BiomeKind {
  const climate = climateAt(tileX + 0.5, tileY + 0.5);
  return classifyClimate(climate.heat, climate.wetness);
}

export function biomeAt(worldX: number, worldY: number): BiomeKind {
  return biomeAtTile(tileOf(worldX), tileOf(worldY));
}

export function blendJitter(pixelX: number, pixelY: number, salt: number): number {
  const fine = valueNoise(pixelX / JITTER_FINE_PIXELS, pixelY / JITTER_FINE_PIXELS, salt) - 0.5;
  const coarse = valueNoise(pixelX / JITTER_COARSE_PIXELS, pixelY / JITTER_COARSE_PIXELS, salt + 7) - 0.5;
  return (fine * 0.35 + coarse * 0.65) * 2 * BIOME_BLEND_JITTER;
}

export function groundVariant(tileX: number, tileY: number): number {
  const roll = hash(tileX, tileY, 404);
  if (roll >= GROUND_DETAIL_CHANCE) {
    return 0;
  }
  const detailCount = GROUND_VARIANT_COUNT - 1;
  return 1 + Math.min(detailCount - 1, Math.floor((roll / GROUND_DETAIL_CHANCE) * detailCount));
}

function isGrove(tileX: number, tileY: number): boolean {
  return valueNoise(tileX / GROVE_SCALE_TILES, tileY / GROVE_SCALE_TILES, 515) > GROVE_THRESHOLD;
}

function pickWeighted<T>(entries: { kind: T; chance: number }[], roll: number, factor: number): T | null {
  let threshold = 0;
  for (const entry of entries) {
    threshold += entry.chance * factor;
    if (roll < threshold) {
      return entry.kind;
    }
  }
  return null;
}

export function decorAtTile(tileX: number, tileY: number, biome: BiomeKind): DecorKind | null {
  const biomeDef = getBiomeDef(biome);
  const entries = isGrove(tileX, tileY) ? biomeDef.groveDecor : biomeDef.scatterDecor;
  return pickWeighted(entries, hash(tileX, tileY, 505), 1);
}

export function breakableAtTile(tileX: number, tileY: number, biome: BiomeKind): BreakableKind | null {
  const clustered = valueNoise(tileX / CLUSTER_SCALE_TILES, tileY / CLUSTER_SCALE_TILES, 616) > CLUSTER_THRESHOLD;
  return pickWeighted(getBiomeDef(biome).breakables, hash(tileX, tileY, 626), clustered ? CLUSTER_BOOST : CLUSTER_DAMP);
}

export function objectOffset(tileX: number, tileY: number): { dx: number; dy: number } {
  return {
    dx: Math.round((hash(tileX, tileY, 606) - 0.5) * TILE_ART_SIZE * 0.5) * PIXEL_SCALE,
    dy: Math.round((hash(tileX, tileY, 707) - 0.5) * TILE_ART_SIZE * 0.5) * PIXEL_SCALE,
  };
}
