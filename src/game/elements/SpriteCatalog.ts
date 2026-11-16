import type { AnimationDef, ArtDirection, EnemyKind, EnemyPose, EnemyView, GroundKind } from './types';

export const SPRITE_ATLAS = 'sprites';
export const FOREST_ATLAS = 'forest';
export const WORLD_ATLAS = 'world';
export const ATLAS_KEYS = [SPRITE_ATLAS, WORLD_ATLAS] as const;
export const ATLAS_DIRECTORY = 'assets/sprites';

export const ART_DIRECTIONS: ArtDirection[] = ['south', 'south-east', 'east', 'north-east', 'north'];

export const WALK_STEPS = ['a', 'b', 'c', 'd'] as const;

export type WalkStep = (typeof WALK_STEPS)[number];

export function playerFrame(direction: ArtDirection, step: WalkStep): string {
  return `player-${direction}-${step}`;
}

export function playerWalkAnimation(direction: ArtDirection): string {
  return `player-walk-${direction}`;
}

export const ENEMY_VIEWS: EnemyView[] = ['front', 'side', 'back'];

export const ENEMY_POSES: EnemyPose[] = ['idle', 'squash', 'attack'];

export const ENEMY_SPRITE: Record<EnemyKind, string> = {
  greenSlime: 'slime-green',
  blueSlime: 'slime-blue',
  redSlime: 'slime-red',
  goblinArcher: 'goblin-archer',
  goblinBomber: 'goblin-bomber',
  skeleton: 'skeleton',
  mushroom: 'mushroom',
  bat: 'bat',
  lavaGolem: 'lava-golem',
};

export function enemyFrame(kind: EnemyKind, view: EnemyView, pose: EnemyPose): string {
  return `${ENEMY_SPRITE[kind]}-${view}-${pose}`;
}

export const BAT_FRAMES = ['bat-wings-up', 'bat-wings-down'] as const;

export const SHADOW_WIDTHS = [5, 7, 9, 12, 15, 20, 28] as const;
export type ShadowWidth = (typeof SHADOW_WIDTHS)[number];

export function shadowFrame(width: ShadowWidth): string {
  return `shadow-${width}`;
}

export function petFrame(view: EnemyView): string {
  return `pet-dog-${view}`;
}

export const GROUND_VARIANT_COUNT = 4;

export function groundFrame(kind: GroundKind, variant: number): string {
  return `ground-${kind}-${variant}`;
}

export const TEXTURE = {
  tree: 'decor-tree',
  pine: 'decor-pine',
  rock: 'decor-rock',
  cactus: 'decor-cactus',
  deadTree: 'decor-dead-tree',
  willow: 'decor-willow',
  mossyLog: 'decor-mossy-log',
  lilyPads: 'decor-lily-pads',
  desertSkull: 'decor-desert-skull',
  houseWeapons: 'house-weapons',
  housePotions: 'house-potions',
  housePet: 'house-pet',
  houseThatch: 'house-thatch',
  houseStone: 'house-stone',
  houseCabin: 'house-cabin',
  houseAdobe: 'house-adobe',
  houseStilt: 'house-stilt',
  houseForge: 'house-forge',
  fountain: 'prop-fountain',
  well: 'prop-well',
  streetLamp: 'prop-street-lamp',
  bench: 'prop-bench',
  marketStall: 'prop-market-stall',
  flowerBed: 'prop-flower-bed',
  barrels: 'prop-barrels',
  fence: 'prop-fence',
  villagerElder: 'villager-elder',
  villagerFarmer: 'villager-farmer',
  villagerSmith: 'villager-smith',
  villagerBoy: 'villager-boy',
  villagerWizard: 'villager-wizard',
  villagerHunter: 'villager-hunter',
  bubbleQuest: 'bubble-quest',
  bubbleDone: 'bubble-done',
  bush: 'breakable-bush',
  snowBush: 'breakable-snow-bush',
  clayPot: 'breakable-clay-pot',
  lavaCrystal: 'breakable-lava-crystal',
  barrelCactus: 'breakable-barrel-cactus',
  reeds: 'breakable-reeds',
  crate: 'breakable-crate',
  tallGrass: 'breakable-tall-grass',
  leafBits: 'bits-leaf',
  snowBits: 'bits-snow',
  clayBits: 'bits-clay',
  crystalBits: 'bits-crystal',
  woodBits: 'bits-wood',
  boneBits: 'bits-bone',
  purpleGoo: 'goo-purple',
  lavaGoo: 'goo-lava',
  bone: 'bone',
  spore: 'spore',
  lavaBall: 'lava-ball',
  coin: 'coin',
  coinStack: 'coin-stack',
  villageArrow: 'village-arrow',
  goblinBits: 'goblin-bits',
  arrow: 'arrow',
  bomb: 'bomb',
  bombTarget: 'bomb-target',
  explosion: 'explosion',
  powerStar: 'power-star',
  shieldBubble: 'shield-bubble',
  megaLaser: 'mega-laser',
  pellet: 'pellet',
  laserBolt: 'laser-bolt',
  rocket: 'rocket',
  kingSlime: 'king-slime',
  kingSlimeAngry: 'king-slime-angry',
  bullet: 'bullet',
  weaponPistol: 'weapon-pistol',
  weaponShotgun: 'weapon-shotgun',
  weaponLaserGun: 'weapon-laser-gun',
  weaponRocketLauncher: 'weapon-rocket-launcher',
  muzzleFlash: 'muzzle-flash',
  slimeBall: 'slime-ball',
  redBall: 'red-ball',
  greenGoo: 'goo-green',
  blueGoo: 'goo-blue',
  redGoo: 'goo-red',
  spark: 'spark',
  shadowSmall: 'shadow-small',
  shadowLarge: 'shadow-large',
  heart: 'heart',
  heartEmpty: 'heart-empty',
  heartPickup: 'heart-pickup',
  forestSky: 'forest-sky',
  forestFar: 'forest-far',
  forestMid: 'forest-mid',
  forestFloorBack: 'forest-floor-back',
  forestNear: 'forest-near',
  forestFloor: 'forest-floor',
  forestForeground: 'forest-foreground',
  forestFrontLeaves: 'forest-front-leaves',
} as const;

export const ANIMATIONS: AnimationDef[] = ART_DIRECTIONS.map((direction) => ({
  key: playerWalkAnimation(direction),
  atlas: SPRITE_ATLAS,
  frames: WALK_STEPS.map((step) => playerFrame(direction, step)),
  frameRate: 10,
  repeat: -1,
}));
