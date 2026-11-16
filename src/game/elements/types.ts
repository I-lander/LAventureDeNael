import type { PaletteKey } from './Palette';

export type PixelGrid = string[];

export type PixelLegend = Record<string, PaletteKey>;

export interface PixelArtDef {
  key: string;
  rows: PixelGrid;
  legend: PixelLegend;
}

export interface PixelStamp {
  rows: PixelGrid;
  legend: PixelLegend;
  x: number;
  y: number;
}

export interface CompositeArtDef {
  key: string;
  width: number;
  height: number;
  fill: PaletteKey | null;
  bands: { y: number; height: number; color: PaletteKey }[];
  stamps: PixelStamp[];
}

export interface AnimationDef {
  key: string;
  atlas: string;
  frames: string[];
  frameRate: number;
  repeat: number;
}

export type EnemyKind =
  | 'greenSlime'
  | 'blueSlime'
  | 'redSlime'
  | 'goblinArcher'
  | 'goblinBomber'
  | 'skeleton'
  | 'mushroom'
  | 'bat'
  | 'lavaGolem';

export type EnemyMovement = 'hop' | 'wave' | 'turret' | 'archer' | 'bomber' | 'thrower' | 'spore' | 'flutter' | 'golem';

export type EnemyView = 'front' | 'side' | 'back';

export type EnemyPose = 'idle' | 'squash' | 'attack';

export interface EnemyLook {
  view: EnemyView;
  flipX: boolean;
}

export interface EnemyDef {
  kind: EnemyKind;
  hitPoints: number;
  speed: number;
  movement: EnemyMovement;
  score: number;
  xp: number;
  hitRadius: number;
  heartDropChance: number;
  specialDropChance: number;
  name: string;
  pluralName: string;
}

export interface WaveEntry {
  atSecond: number;
  kind: EnemyKind;
  count: number;
  intervalSeconds: number;
  lane: 'random' | 'top' | 'middle' | 'bottom' | 'player';
}

export interface CombatContext {
  timeMs: number;
  playerX: number;
  playerY: number;
  fireEnemyBall: (x: number, y: number, angle: number, speed: number, texture: string) => void;
  spawnEnemy: (kind: EnemyKind, x: number, groundY: number) => void;
  throwBomb: (fromX: number, fromY: number, targetX: number, targetGroundY: number) => void;
  shake: (intensity: number) => void;
  burstGoo: (x: number, y: number, groundY: number, texture: string, count: number) => void;
}

export type GamePhase = 'title' | 'playing' | 'bossIntro' | 'boss' | 'victory' | 'shop' | 'dialog' | 'skills' | 'gameOver';

export interface ShopCardDef {
  name: string;
  description: [string, string];
  maxLevel: number | null;
  icon: PixelArtDef;
  badge?: string;
}

export type UpgradeKind = 'potion' | 'pet';

export type ShopKind = 'weapons' | 'potions' | 'pet';

export interface ShopDef {
  kind: ShopKind;
  name: string;
  houseTexture: string;
  footprint: FootprintRatio;
  doorWidth: number;
}

export type SkillBranch = 'force' | 'life' | 'speed';

export type SkillKind =
  | 'power'
  | 'multishot'
  | 'critical'
  | 'vitality'
  | 'regeneration'
  | 'luck'
  | 'fireRate'
  | 'swiftness'
  | 'reach';

export interface SkillDef {
  kind: SkillKind;
  branch: SkillBranch;
  name: string;
  description: [string, string];
  maxLevel: number;
  requires: SkillKind | null;
  icon: PixelArtDef;
}

export type SkillStatus = 'available' | 'locked' | 'noPoints' | 'maxed';

export type QuestGoal = EnemyKind | 'breakables';

export type QuestState = 'offered' | 'active' | 'complete';

export interface Quest {
  id: string;
  giverId: string;
  giverName: string;
  goal: QuestGoal;
  count: number;
  progress: number;
  rewardXp: number;
  rewardCoins: number;
  state: QuestState;
}

export type HouseKind = 'thatch' | 'stone' | 'cabin' | 'adobe' | 'stilt' | 'forge';

export interface FootprintRatio {
  width: number;
  depth: number;
}

export interface HouseDef {
  kind: HouseKind;
  texture: string;
  footprint: FootprintRatio;
  doorOffsetX: number;
}

export type VillagePropKind =
  | 'fountain'
  | 'well'
  | 'streetLamp'
  | 'bench'
  | 'marketStall'
  | 'flowerBed'
  | 'barrels'
  | 'fence';

export interface VillagePropDef {
  kind: VillagePropKind;
  texture: string;
  footprint: FootprintRatio | null;
}

export type VillagerKind = 'elder' | 'farmer' | 'smith' | 'boy' | 'wizard' | 'hunter';

export interface VillagerDef {
  kind: VillagerKind;
  texture: string;
  names: string[];
}

export type BreakableKind =
  | 'bush'
  | 'snowBush'
  | 'clayPot'
  | 'lavaCrystal'
  | 'barrelCactus'
  | 'reeds'
  | 'crate'
  | 'tallGrass';

export interface BreakableDef {
  kind: BreakableKind;
  texture: string;
  blockRadius: number;
  hitRadius: number;
  debrisTexture: string;
}

export type Direction8 =
  | 'east'
  | 'southEast'
  | 'south'
  | 'southWest'
  | 'west'
  | 'northWest'
  | 'north'
  | 'northEast';

export type ArtDirection = 'south' | 'south-east' | 'east' | 'north-east' | 'north';

export interface DirectionArt {
  art: ArtDirection;
  flipX: boolean;
}

export type BiomeKind = 'forest' | 'snow' | 'volcano' | 'desert' | 'swamp';

export type GroundKind = BiomeKind | 'path';

export type DecorKind = 'tree' | 'pine' | 'rock' | 'cactus' | 'deadTree' | 'willow' | 'mossyLog' | 'lilyPads' | 'desertSkull';

export interface DecorDef {
  kind: DecorKind;
  texture: string;
  blockRadius: number;
}

export interface BiomeDef {
  kind: BiomeKind;
  name: string;
  groveDecor: { kind: DecorKind; chance: number }[];
  scatterDecor: { kind: DecorKind; chance: number }[];
  breakables: { kind: BreakableKind; chance: number }[];
  enemies: { kind: EnemyKind; weight: number }[];
  houses: HouseKind[];
}

export interface UpgradeDef extends ShopCardDef {
  kind: UpgradeKind;
  shop: ShopKind;
  basePrice: number;
  priceGrowth: number;
}

export type WeaponKind = 'pistol' | 'shotgun' | 'laserGun' | 'rocketLauncher';

export interface WeaponDef extends ShopCardDef {
  kind: WeaponKind;
  price: number;
  projectileTexture: string;
  heldTexture: string;
  fireIntervalFactor: number;
  speedFactor: number;
  damageFactor: number;
  basePellets: number;
  pelletsPerMultishot: number;
  pelletSpacing: number;
  spreadSpeed: number;
  lifetimeMs: number | null;
  piercing: boolean;
  explosionRadius: number;
}

export type SpecialKind = 'bombRain' | 'shield' | 'megaLaser';

export type PickupKind = 'heart' | 'star' | 'coin' | 'coinStack';

export type UpgradeStatus = 'available' | 'tooExpensive' | 'maxed' | 'useless' | 'owned' | 'equipped';

export interface UpgradeOffer {
  status: UpgradeStatus;
  price: number;
  level: number;
}
