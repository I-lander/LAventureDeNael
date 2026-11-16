import type { CompositeArtDef, PixelGrid, PixelLegend, PixelStamp } from '../../game/elements';

function trunkColumn(
  middleRows: PixelGrid,
  rootRows: PixelGrid,
  totalRows: number,
): PixelGrid {
  const rows: PixelGrid = [];
  const middleCount = totalRows - rootRows.length;
  for (let i = 0; i < middleCount; i++) {
    rows.push(middleRows[i % middleRows.length]);
  }
  return [...rows, ...rootRows];
}

const DISTANT_TRUNK: PixelGrid = [
  'mmd',
];

const FAR_TRUNK_MIDDLE: PixelGrid = [
  '.olmmmmmddo.',
  '.olmmmmmddo.',
  '.olmmmmmddo.',
  '.olmmmmmddo.',
  '.olmmdmmddo.',
  '.olmmdmmddo.',
  '.olmmdmmddo.',
  '.olmmmmmddo.',
  '.olmmmmmddo.',
  '.olmmmmdddo.',
  '.olmmmmdddo.',
  '.olmmmmdddo.',
];

const FAR_TRUNK_ROOTS: PixelGrid = [
  '.olmmmmmddo.',
  '.olmmmmmddo.',
  '.olmmmmmdddo',
  'ollmmmmmmddo',
  'ollmmmmmmddd',
];

const MID_TRUNK_MIDDLE: PixelGrid = [
  '...ollbbbbbbbbbbddddo...',
  '...ollbbbdbbbbbbddddo...',
  '...ollbbbdbbbbbbddddo...',
  '...ollbbbdbbbbbbddddo...',
  '...ollbbbbbbbbbbddddo...',
  '...ollbbbbbbbbbbddddo...',
  '...ollbbbbbbbdbbddddo...',
  '...ollbbbbbbbdbbddddo...',
  '...ollbbbbbbbdbbddddo...',
  '...ollbbbbbbbdbbddddo...',
  '...ollbbbbbbbbbbddddo...',
  '...ollbbbbbbbbbbddddo...',
  '...ollbbbdbbbbbbddddo...',
  '...ollbbbdbbbbbbddddo...',
  '...ollbbbbbbbbbbddddo...',
  '...ollbbbbbbbbbbddddo...',
];

const MID_TRUNK_ROOTS: PixelGrid = [
  '...ollbbbbbbbbbbddddo...',
  '..olllbbbbbbbbbbdddddo..',
  '..olllbbbbbbbbbbbdddddo.',
  '.olllbbbbbbbbbbbbddddddo',
  '.ollbbbbbbbbbbbbbddddddo',
  'olllbbbbbbbbbbbbbddddddo',
  'olllbbbbbbbbbbbbbddddddo',
];

const NEAR_TRUNK_MIDDLE: PixelGrid = [
  '........oHHHHbbbbbbbbbbbbbbbbbbbbddddddddddo........',
  '........oHHHHbbbbbbdHbbbbbbbbbbbbddddddddddo........',
  '........oHHHHbbbbbbdHbbbbbbbbbbbbddddddddddo........',
  '........oHHHHbbbbbbdHbbbbbbbbbbbbddddddddddo........',
  '........oHHHHbbbbbbdHbbbbbbbbbbbbddddddddddo........',
  '........oHHHHbbbbbbbbbbbbbbbbbbbbddddddddddo........',
  '........oHHHHbbbbbbbbbbbbbbbbbbbbddddddddddo........',
  '........oHHHHbbbbbbbbbbbbbbbbbbbbddddodddddo........',
  '........oHHHHbbbbbbbbbbbbbbbbbbbbddddodddddo........',
  '........oHHHHbbbbbbbbbbbbbbbbbbbbddddodddddo........',
  '........oHHHHbbbbbbbbbbbbbbbbbbbbddddddddddo........',
  '........oHHHHbbbbbbbbbbbbbdHbbbbbddddddddddo........',
  '........oHHHHbbbbbbbbbbbbbdHbbbbbddddddddddo........',
  '........oHHHHbbbbbbbbbbbbbdHbbbbbddddddddddo........',
  '........oHHHHbbbbbbbbbbbbbdHbbbbbddddddddddo........',
  '........oHHHHbbbbbbbbbbbbbdHbbbbbddddddddddo........',
  '........oHHHHbbbbbbbbbbbbbbbbbbbbddddddddddo........',
  '........oHHHHbbbbbbbbdddbbbbbbbbbddddddddddo........',
  '........oHHHHbbbbbbbdHddbbbbbbbbbddddddddddo........',
  '........oHHHHbbbbbbbbdddbbbbbbbbbddddddddddo........',
  '........oHHHHbbbbbbbbbbbbbbbbbbbbddddddddddo........',
  '........oHHHbbbbbbbbbbdbbbbbbbbbbddddddddddo........',
  '........oMMmmbbbbbbbbbbbbbbbbbbbbddddddddddo........',
  '........oHHHHbbbbbbbbbbbbbbbbbbbbddddddddddo........',
];

const NEAR_TRUNK_ROOTS: PixelGrid = [
  '........oHHHHbbbbbbbbbbbbbbbbbbbbddddddddddo........',
  '........oMHHHbbbbbbbbbbbbbbbbbbbbddddddddddo........',
  '........oMMHHbbbbbbbbbbbbbbbbbbbbddddddddddo........',
  '.......oMMMHHbbbbbbbbbbbbbbbbbbbbdddddddddddo.......',
  '.......oMMHHHbbbbbbbbbbbbbbbbbbbbbddddddddddo.......',
  '......oMMHHHHbbbbbbbbbbbbbbbbbbbbbddddddddddddo.....',
  '.....oMMHHHHHbbbbbbbbbbbbbbbbbbbbbbdddddddddddddo...',
  '....oMMMHHHHHbbbbbbbbbbbbbbbbbbbbbbbddddddddddddddo.',
  '...oMMHHHHHHbbbbbbbbbbbbbbbbbbbbbbbbbddddddddddddddo',
  '..oMMHHHHHHbbbbbbbdbbbbbbbbbbbbbbbbbdddddddddddddddo',
  '.oMMHHHHHHbbbbbbbdbbbbbbbbbdbbbbbbbbdddddddddddddddo',
  '.oHHHHHHbbobbbbbbdbbbbbbbbbdbbbbbboddddddddddddddo..',
  'oHHHHHHHbbobbbbbdbbbbbbbbbbdbbbbbodddddddddddddddddo',
  'oHHHHHHbbbobbbbdbbbbbbbbbbbdbbbboddddddddddddddddddo',
  'oooooooooooooooooooooooooooooooooooooooooooooooooooo',
];

const NEAR_LEAVES: PixelGrid = [
  'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
  'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
  'dddmmmmmmmmddddddddddmmmmmmmmmmmmddddddddmmmmmmmmmmddddddddddddd',
  'ddmmmmllllllddddddddmmmmmmllllllmmmmddddddmmmmlllllddddddddddddd',
  'dmmmmlllllllmmddddddmmmmlllllllmmmdddddmmmlllllllmmddddddddddddd',
  'dmmmllllllmmmmdddddmmmllllllmmmmmddddmmmllllllmmmmdddddddddddddd',
  'dmmmmmmllmmmmmmdddmmmmmmllmmmmmmmdddmmmmmmllmmmmmmdddddddddddddd',
  'ddmmmmmmmmmmmmmdddmmmmmmmmmmmmmmmdddmmmmmmmmmmmmmddddddddddddddd',
  'oddmmmmmmmmmmmddddmmmmmmmmmmmmmddddmmmmmmmmmmmdddoooooooooooooo.',
  '.oddmmmmmmmmmddoddmmmmmmmmmmmddodmmmmmmmmmddoddoooooooooo.......',
  '..oddmmmmmmmddo.oddmmmmmmmmmddo.oddmmmmmmmdo.oo......oooo.......',
  '...oddmmmmmdo...oddmmmmmmmddo...odmmmmmddo......................',
  '....oddmmmdo.....oddmmmmmdo.....oddmmmdo........................',
  '.....odddo.......oddmmmdo.......odddo...........................',
  '......ooo.........oddddo.........ooo............................',
  '.....................oooo.......................................',
];

const VINE: PixelGrid = [
  'o',
  'd',
  'd',
  'o',
  'd',
  'd',
  'd',
  'o',
  'd',
  'd',
  'o',
  'd',
  'o',
  'd',
  'd',
  'o',
  'd',
  'o',
];

const GROUND_SHADOW: PixelGrid = [
  '........oooooooooooooooooooooooooooooooooooooooooooooooo........',
  '...oooooooooooooooooooooooooooooooooooooooooooooooooooooooooo...',
  'oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo',
  '...oooooooooooooooooooooooooooooooooooooooooooooooooooooooooo...',
  '........oooooooooooooooooooooooooooooooooooooooooooooooo........',
];

const DISTANT_TRUNK_LEGEND: PixelLegend = { m: 'mistDark', d: 'mistDeep' };

const FAR_TRUNK_LEGEND: PixelLegend = {
  o: 'mistDeep',
  l: 'mistLight',
  m: 'mist',
  d: 'mistDark',
};

const FAR_LEAF_LEGEND: PixelLegend = {
  o: 'mistDeep',
  d: 'mistDeep',
  m: 'mistDark',
  l: 'mist',
};

const MID_TRUNK_LEGEND: PixelLegend = {
  o: 'mossDeep',
  l: 'midBarkLight',
  b: 'midBark',
  d: 'midBarkDark',
};

const MID_LEAF_LEGEND: PixelLegend = {
  o: 'mossDeep',
  d: 'mossDeep',
  m: 'mossDark',
  l: 'moss',
};

const NEAR_TRUNK_LEGEND: PixelLegend = {
  o: 'barkDeep',
  H: 'barkLight',
  b: 'bark',
  d: 'barkDark',
  M: 'green',
  m: 'greenDark',
};

const NEAR_LEAF_LEGEND: PixelLegend = {
  o: 'greenDeep',
  d: 'greenDeep',
  m: 'greenDark',
  l: 'green',
};

const FRONT_LEAF_LEGEND: PixelLegend = {
  o: 'ink',
  d: 'ink',
  m: 'mossDeep',
  l: 'mossDark',
};

const VINE_LEGEND: PixelLegend = { o: 'ink', d: 'mossDeep' };

const GROUND_SHADOW_LEGEND: PixelLegend = { o: 'greenDeep' };

export const LEAF_CLUSTER: PixelGrid = [
  'dmmmmmllllllllmmmmmmmmmmmmmmmmdd',
  'dmmmmllllllllmmmmmmmmmmmmmmmmddd',
  'ddmmmmllllllmmmmmmmmmmmmmmmmdddd',
  'ddmmmmmlllmmmmmmmmmmmmmmmmmddddd',
  'dddmmmmlmmmmmmmmmmmmmmmmmmdddddd',
  'dddmmmmmmmmmmmmmmmmmmmmmdddddddd',
  'odddmmmmmmmmmmmmmmmmmmdddddddddo',
  'oddddmmmmmmmmmmmmmmmmddddddddo..',
  '.oddddmmmmmmmmmmmmdddddddo......',
  '..oddddmmmmmmmmmmddddddo........',
  '...oodddoddmmmmmmddddo..........',
  '....oo..oddmmmmdddo.............',
  '........oddmmdddo...............',
  '........oddddddo................',
  '.........ooddoo.................',
  '...........oo...................',
];

export const LEAF_LEGEND: PixelLegend = {
  o: 'mossDeep',
  d: 'mossDark',
  m: 'moss',
  l: 'greenDark',
};

export const GRASS_TUFT_A: PixelGrid = [
  '....l.....',
  '...lm...l.',
  '.l.lm..lm.',
  '.lmmm.lmm.',
  'lmmmmlmmml',
  'mmmmmmmmmm',
];
export const GRASS_TUFT_B: PixelGrid = [
  'l.......',
  'lm....l.',
  'mm.l.lm.',
  'mmlm.mm.',
  'mmmmlmml',
  'mmmmmmmm',
];

export const GRASS_LEGEND: PixelLegend = {
  l: 'greenLight',
  m: 'green',
};

export const FLOWER: PixelGrid = [
  '..ww..',
  '.wwww.',
  'wwyyww',
  'wwyyww',
  '.wwww.',
  '..ww..',
];

export const WHITE_FLOWER_LEGEND: PixelLegend = { w: 'white', y: 'gold' };
export const PINK_FLOWER_LEGEND: PixelLegend = { w: 'pink', y: 'goldLight' };

export const DIRT_PATCH: PixelGrid = [
  '...bbbbbbb......',
  '.bbbbHHbbbbbbb..',
  'bbbHHbbbbbbHbbbb',
  'bbbbbbbbbHHbbbbb',
  '.bbbbbbbbbbbbbb.',
  '....bbbbbbbb....',
];

export const DIRT_LEGEND: PixelLegend = { b: 'barkDark', H: 'bark' };

export const PEBBLE: PixelGrid = ['..llll..', '.llllll.', 'lllldddd', '.dddddd.'];

export const PEBBLE_LEGEND: PixelLegend = { l: 'whiteShade', d: 'night' };

export const MUSHROOM: PixelGrid = [
  '...rrrr...',
  '.rrwwrrrr.',
  'rrrwwrrwrd',
  'rrrrrrrrdd',
  'rrrrrrdddd',
  '...sssS...',
  '...sssS...',
  '...sssS...',
  '..sssssS..',
  '..ssSSSS..',
];

export const MUSHROOM_LEGEND: PixelLegend = {
  r: 'redLight',
  w: 'white',
  d: 'red',
  s: 'white',
  S: 'whiteShade',
};

export const BUSH: PixelGrid = [
  '............oooooo..............................',
  '.........ooolllllmooo...........................',
  '.......oolllllllmmmmoo......oooooo..............',
  '......olllllllmmmmmmddo...oollllmmoo............',
  '.....ollllllmmmmmmmmdddo.ollllllmmmmoo..........',
  '....ollllllmmmmmmmmmmdddddlllllmmmmmmmddo.......',
  '...olllllmmmmmmmmmmmmmddddllllllmmmmmmmdddo.....',
  '...ollllmmmmmmmmmmmmmmmddddllllmmmmmmmmmdddo....',
  '..ollllmmmmmmmmmmmmmmmmddddlllmmmmmmmmmmmdddo...',
  '..olllmmmmmmmmmmmmmmmmmmddddllmmmmmmmmmmmmddddo.',
  '.olllmmmmmmmmmmmmmmmmmmmdddddlmmmmmmmmmmmmdddddo',
  '.ollmmmmmmmmmmmmmmmmmmmmdddddmmmmmmmmmmmmmdddddo',
  'ollmmmmmmmmmmmmmmmmmmmmmmdddddmmmmmmmmmmmmdddddo',
  'olmmmmmmmmmmmmmmmmmmmmmmmdddddmmmmmmmmmmmmdddddo',
  'odmmmmmmmmmmmmmmmmmmmmmmddddddmmmmmmmmmmmddddddo',
  'odmmmmmmmmmmmmmmmmmmmmmddddddmmmmmmmmmmmdddddddo',
  'oddmmmmmmmmmmmmmmmmmmddddddddmmmmmmmmmmddddddddo',
  'odddmmmmmmmmmmmmmmddddddddddddmmmmmmdddddddddddo',
  'oddddddddddddddddddddddddddddddddddddddddddddddo',
  'oddddddddddddddddddddddddddddddddddddddddddddddo',
];

export const BUSH_LEGEND: PixelLegend = {
  o: 'greenDeep',
  d: 'greenDark',
  m: 'green',
  l: 'greenLight',
};

function stamp(rows: PixelGrid, legend: PixelLegend, x: number, y: number): PixelStamp {
  return { rows, legend, x, y };
}

export const FOREST_SKY: CompositeArtDef = {
  key: 'forest-sky',
  width: 256,
  height: 136,
  fill: 'mossDeep',
  bands: [{ y: 34, height: 18, color: 'mistDeep' }, { y: 52, height: 22, color: 'mistDark' }, { y: 74, height: 30, color: 'mist' }, { y: 104, height: 32, color: 'mistLight' }],
  stamps: [
    stamp(trunkColumn(DISTANT_TRUNK, DISTANT_TRUNK, 112), DISTANT_TRUNK_LEGEND, 14, 24),
    stamp(trunkColumn(DISTANT_TRUNK, DISTANT_TRUNK, 106), DISTANT_TRUNK_LEGEND, 46, 30),
    stamp(trunkColumn(DISTANT_TRUNK, DISTANT_TRUNK, 114), DISTANT_TRUNK_LEGEND, 88, 22),
    stamp(trunkColumn(DISTANT_TRUNK, DISTANT_TRUNK, 108), DISTANT_TRUNK_LEGEND, 131, 28),
    stamp(trunkColumn(DISTANT_TRUNK, DISTANT_TRUNK, 116), DISTANT_TRUNK_LEGEND, 170, 20),
    stamp(trunkColumn(DISTANT_TRUNK, DISTANT_TRUNK, 110), DISTANT_TRUNK_LEGEND, 214, 26),
    stamp(trunkColumn(DISTANT_TRUNK, DISTANT_TRUNK, 106), DISTANT_TRUNK_LEGEND, 240, 30),
  ],
};

export const FOREST_FAR: CompositeArtDef = {
  key: 'forest-far',
  width: 512,
  height: 136,
  fill: null,
  bands: [{ y: 0, height: 4, color: 'mistDeep' }],
  stamps: [
    stamp(trunkColumn(FAR_TRUNK_MIDDLE, FAR_TRUNK_ROOTS, 136), FAR_TRUNK_LEGEND, 20, 0),
    stamp(trunkColumn(FAR_TRUNK_MIDDLE, FAR_TRUNK_ROOTS, 136), FAR_TRUNK_LEGEND, 98, 0),
    stamp(trunkColumn(FAR_TRUNK_MIDDLE, FAR_TRUNK_ROOTS, 136), FAR_TRUNK_LEGEND, 180, 0),
    stamp(trunkColumn(FAR_TRUNK_MIDDLE, FAR_TRUNK_ROOTS, 136), FAR_TRUNK_LEGEND, 262, 0),
    stamp(trunkColumn(FAR_TRUNK_MIDDLE, FAR_TRUNK_ROOTS, 136), FAR_TRUNK_LEGEND, 340, 0),
    stamp(trunkColumn(FAR_TRUNK_MIDDLE, FAR_TRUNK_ROOTS, 136), FAR_TRUNK_LEGEND, 430, 0),
    stamp(LEAF_CLUSTER, FAR_LEAF_LEGEND, 0, 0),
    stamp(LEAF_CLUSTER, FAR_LEAF_LEGEND, 32, 2),
    stamp(LEAF_CLUSTER, FAR_LEAF_LEGEND, 64, 4),
    stamp(LEAF_CLUSTER, FAR_LEAF_LEGEND, 96, 0),
    stamp(LEAF_CLUSTER, FAR_LEAF_LEGEND, 128, 2),
    stamp(LEAF_CLUSTER, FAR_LEAF_LEGEND, 160, 4),
    stamp(LEAF_CLUSTER, FAR_LEAF_LEGEND, 192, 0),
    stamp(LEAF_CLUSTER, FAR_LEAF_LEGEND, 224, 2),
    stamp(LEAF_CLUSTER, FAR_LEAF_LEGEND, 256, 4),
    stamp(LEAF_CLUSTER, FAR_LEAF_LEGEND, 288, 0),
    stamp(LEAF_CLUSTER, FAR_LEAF_LEGEND, 320, 2),
    stamp(LEAF_CLUSTER, FAR_LEAF_LEGEND, 352, 4),
    stamp(LEAF_CLUSTER, FAR_LEAF_LEGEND, 384, 0),
    stamp(LEAF_CLUSTER, FAR_LEAF_LEGEND, 416, 2),
    stamp(LEAF_CLUSTER, FAR_LEAF_LEGEND, 448, 4),
    stamp(LEAF_CLUSTER, FAR_LEAF_LEGEND, 480, 0),
  ],
};

export const FOREST_MID: CompositeArtDef = {
  key: 'forest-mid',
  width: 512,
  height: 138,
  fill: null,
  bands: [{ y: 0, height: 8, color: 'mossDeep' }],
  stamps: [
    stamp(trunkColumn(MID_TRUNK_MIDDLE, MID_TRUNK_ROOTS, 138), MID_TRUNK_LEGEND, 30, 0),
    stamp(trunkColumn(MID_TRUNK_MIDDLE, MID_TRUNK_ROOTS, 138), MID_TRUNK_LEGEND, 150, 0),
    stamp(trunkColumn(MID_TRUNK_MIDDLE, MID_TRUNK_ROOTS, 138), MID_TRUNK_LEGEND, 290, 0),
    stamp(trunkColumn(MID_TRUNK_MIDDLE, MID_TRUNK_ROOTS, 138), MID_TRUNK_LEGEND, 400, 0),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 0, 4),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 26, 8),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 52, 12),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 78, 4),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 104, 8),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 130, 12),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 156, 4),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 182, 8),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 208, 12),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 234, 4),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 260, 8),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 286, 12),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 312, 4),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 338, 8),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 364, 12),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 390, 4),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 416, 8),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 442, 12),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 468, 4),
    stamp(LEAF_CLUSTER, MID_LEAF_LEGEND, 494, 8),
  ],
};

export const FOREST_FLOOR_BACK: CompositeArtDef = {
  key: 'forest-floor-back',
  width: 256,
  height: 32,
  fill: 'greenDark',
  bands: [{ y: 0, height: 2, color: 'mossDark' }, { y: 2, height: 4, color: 'greenDeep' }],
  stamps: [
    stamp(GRASS_TUFT_B, GRASS_LEGEND, 14, 14),
    stamp(PEBBLE, PEBBLE_LEGEND, 62, 22),
    stamp(GRASS_TUFT_A, GRASS_LEGEND, 108, 18),
    stamp(FLOWER, WHITE_FLOWER_LEGEND, 152, 22),
    stamp(GRASS_TUFT_B, GRASS_LEGEND, 176, 10),
    stamp(PEBBLE, PEBBLE_LEGEND, 224, 16),
  ],
};

export const FOREST_NEAR: CompositeArtDef = {
  key: 'forest-near',
  width: 1024,
  height: 160,
  fill: null,
  bands: [{ y: 0, height: 12, color: 'greenDeep' }],
  stamps: [
    stamp(GROUND_SHADOW, GROUND_SHADOW_LEGEND, 54, 152),
    stamp(trunkColumn(NEAR_TRUNK_MIDDLE, NEAR_TRUNK_ROOTS, 157), NEAR_TRUNK_LEGEND, 60, 0),
    stamp(GROUND_SHADOW, GROUND_SHADOW_LEGEND, 414, 152),
    stamp(trunkColumn(NEAR_TRUNK_MIDDLE, NEAR_TRUNK_ROOTS, 157), NEAR_TRUNK_LEGEND, 420, 0),
    stamp(GROUND_SHADOW, GROUND_SHADOW_LEGEND, 754, 152),
    stamp(trunkColumn(NEAR_TRUNK_MIDDLE, NEAR_TRUNK_ROOTS, 157), NEAR_TRUNK_LEGEND, 760, 0),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 0, 6),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 40, 12),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 80, 18),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 120, 6),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 160, 12),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 200, 18),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 240, 6),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 280, 12),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 320, 18),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 360, 6),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 400, 12),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 440, 18),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 480, 6),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 520, 12),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 560, 18),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 600, 6),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 640, 12),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 680, 18),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 720, 6),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 760, 12),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 800, 18),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 840, 6),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 880, 12),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 920, 18),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 960, 6),
    stamp(NEAR_LEAVES, NEAR_LEAF_LEGEND, 1000, 12),
    stamp(VINE, VINE_LEGEND, 96, 22),
    stamp(VINE, VINE_LEGEND, 456, 26),
    stamp(VINE, VINE_LEGEND, 796, 20),
  ],
};

export const FOREST_FLOOR: CompositeArtDef = {
  key: 'forest-floor',
  width: 256,
  height: 196,
  fill: 'greenDark',
  bands: [],
  stamps: [
    stamp(GRASS_TUFT_A, GRASS_LEGEND, 20, 6),
    stamp(PEBBLE, PEBBLE_LEGEND, 70, 20),
    stamp(DIRT_PATCH, DIRT_LEGEND, 116, 12),
    stamp(FLOWER, WHITE_FLOWER_LEGEND, 158, 0),
    stamp(GRASS_TUFT_A, GRASS_LEGEND, 170, 38),
    stamp(PEBBLE, PEBBLE_LEGEND, 40, 36),
    stamp(GRASS_TUFT_B, GRASS_LEGEND, 94, 56),
    stamp(MUSHROOM, MUSHROOM_LEGEND, 24, 78),
    stamp(FLOWER, PINK_FLOWER_LEGEND, 132, 84),
    stamp(GRASS_TUFT_A, GRASS_LEGEND, 60, 108),
    stamp(DIRT_PATCH, DIRT_LEGEND, 8, 136),
    stamp(GRASS_TUFT_B, GRASS_LEGEND, 144, 128),
    stamp(PEBBLE, PEBBLE_LEGEND, 176, 152),
    stamp(FLOWER, WHITE_FLOWER_LEGEND, 80, 160),
    stamp(GRASS_TUFT_A, GRASS_LEGEND, 116, 176),
    stamp(GRASS_TUFT_B, GRASS_LEGEND, 32, 180),
    stamp(GRASS_TUFT_B, GRASS_LEGEND, 214, 20),
    stamp(FLOWER, PINK_FLOWER_LEGEND, 236, 64),
    stamp(PEBBLE, PEBBLE_LEGEND, 208, 104),
    stamp(GRASS_TUFT_A, GRASS_LEGEND, 226, 150),
  ],
};

export const FOREST_FOREGROUND: CompositeArtDef = {
  key: 'forest-foreground',
  width: 256,
  height: 28,
  fill: null,
  bands: [{ y: 24, height: 4, color: 'greenDeep' }],
  stamps: [
    stamp(BUSH, BUSH_LEGEND, 0, 8),
    stamp(BUSH, BUSH_LEGEND, 68, 10),
    stamp(BUSH, BUSH_LEGEND, 122, 6),
    stamp(BUSH, BUSH_LEGEND, 192, 8),
  ],
};

export const FOREST_FRONT_LEAVES: CompositeArtDef = {
  key: 'forest-front-leaves',
  width: 512,
  height: 40,
  fill: null,
  bands: [],
  stamps: [
    stamp(NEAR_LEAVES, FRONT_LEAF_LEGEND, 0, 0),
    stamp(NEAR_LEAVES, FRONT_LEAF_LEGEND, 30, 8),
    stamp(NEAR_LEAVES, FRONT_LEAF_LEGEND, 300, 0),
    stamp(NEAR_LEAVES, FRONT_LEAF_LEGEND, 340, 6),
    stamp(VINE, VINE_LEGEND, 40, 22),
    stamp(VINE, VINE_LEGEND, 52, 18),
    stamp(VINE, VINE_LEGEND, 356, 20),
  ],
};

export const FOREST_LAYERS: CompositeArtDef[] = [
  FOREST_SKY,
  FOREST_FAR,
  FOREST_MID,
  FOREST_FLOOR_BACK,
  FOREST_NEAR,
  FOREST_FLOOR,
  FOREST_FOREGROUND,
  FOREST_FRONT_LEAVES,
];
