import type { PixelGrid, PixelLegend } from '../../game/elements';

export const GOBLIN_FRAME_SIZE = { width: 26, height: 27 };
export const GOBLIN_HEAD_OFFSET = { x: 4, y: 1 };
export const GOBLIN_BODY_OFFSET = { x: 0, y: 12 };
export const GOBLIN_LEGS_OFFSET = { x: 8, y: 20 };
export const GOBLIN_HELD_BOMB_OFFSET = { x: 0, y: 5 };

export const GOBLIN_HEAD: PixelGrid = [
  '..........oooooo......',
  '........oohhhhhhoo....',
  '.......ohHHhhhhhhho...',
  '......ohHhhhhhhhhhho..',
  '.....ohhsssssssshhhooo',
  '....ohsllssssssshhddlo',
  '....osyossyosssshhddo.',
  '...osssssssssssshhoo..',
  '..oddsssssssssssho....',
  '...oossowwosssssssho..',
  '.....ossssssssssoo....',
  '.......ooddddddoo.....',
];

export const GOBLIN_LEGS_A: PixelGrid = [
  '..okkkokkko.',
  '..okko.okko.',
  '.okko...okko',
  '.osso...osso',
  '.osso...osso',
  'ossso..ossso',
  'ooooo..ooooo',
];

export const GOBLIN_LEGS_B: PixelGrid = [
  '..okkkokkko.',
  '...okkkkko..',
  '...okkkkko..',
  '...ossssso..',
  '...ossssso..',
  '..ossssssso.',
  '..ooooooooo.',
];

export const ARCHER_BODY_IDLE: PixelGrid = [
  '.....ob.okkkkkkkkkkko.....',
  '....obw.okHkkkkkkkkko.....',
  '...obw..okHkkkkkkkkko.....',
  '...obwosskkkkkkkkkkko.....',
  '...obwosskkkkkkkkkkko.....',
  '...obw..oyyyyyyyyyyyo.....',
  '....obw.okkkkkkkkkkko.....',
  '.....ob.okkkkkkkkkkko.....',
  '........ooooooooooooo.....',
];

export const ARCHER_BODY_AIM: PixelGrid = [
  '.....ob.okkkkkkkkkkko.....',
  '....ob.wokHkkkkkkkkko.....',
  '...ob..wokHkkkkkkkkko.....',
  'aaffbfffsskkkkkkkkkko.....',
  '...ob..wokkkkkkkkkkko.....',
  '...ob..woyyyyyyyyyyyo.....',
  '....ob.wokkkkkkkkkkko.....',
  '.....ob.okkkkkkkkkkko.....',
  '........ooooooooooooo.....',
];

export const BOMBER_BODY_IDLE: PixelGrid = [
  '..y.....okkkkkkkkkkko.....',
  '..of....okHkkkkkkkkko.....',
  '.oBBBo..okHkkkkkkkkko.....',
  'oBWBBBosskkkkkkkkkkko.....',
  'oBBBBBosskkkkkkkkkkko.....',
  '.oBBBo..oyyyyyyyyyyyo.....',
  '..ooo...okkkkkkkkkkko.....',
  '........okkkkkkkkkkko.....',
  '........ooooooooooooo.....',
];

export const BOMBER_BODY_THROW: PixelGrid = [
  '....oss.okkkkkkkkkkko.....',
  '.....ossokHkkkkkkkkko.....',
  '........okHkkkkkkkkko.....',
  '........okkkkkkkkkkko.....',
  '........okkkkkkkkkkko.....',
  '........oyyyyyyyyyyyo.....',
  '........okkkkkkkkkkko.....',
  '........okkkkkkkkkkko.....',
  '........ooooooooooooo.....',
];

export const BOMBER_HELD_BOMB: PixelGrid = [
  '..yy...',
  '..of...',
  '.oBBBo.',
  'oBWBBBo',
  'oBBBBBo',
  '.oBBBo.',
  '..ooo..',
];

export const ARCHER_HEAD_LEGEND: PixelLegend = {
  o: 'ink',
  h: 'bark',
  H: 'barkLight',
  s: 'green',
  l: 'greenLight',
  d: 'greenDark',
  y: 'goldLight',
  w: 'white',
};

export const BOMBER_HEAD_LEGEND: PixelLegend = {
  ...ARCHER_HEAD_LEGEND,
  h: 'red',
  H: 'redLight',
};

export const GOBLIN_LEGS_LEGEND: PixelLegend = {
  o: 'ink',
  k: 'barkDark',
  s: 'greenDark',
};

export const ARCHER_BODY_LEGEND: PixelLegend = {
  o: 'ink',
  k: 'mist',
  H: 'mistLight',
  y: 'gold',
  s: 'green',
  b: 'goldDark',
  w: 'white',
  f: 'barkLight',
  a: 'whiteShade',
};

export const BOMBER_BODY_LEGEND: PixelLegend = {
  o: 'ink',
  k: 'purple',
  H: 'lilac',
  y: 'gold',
  s: 'green',
  B: 'night',
  W: 'whiteShade',
  f: 'barkLight',
};

export const HELD_BOMB_LEGEND: PixelLegend = {
  o: 'ink',
  y: 'goldLight',
  f: 'barkLight',
  B: 'night',
  W: 'whiteShade',
};

export const GOBLIN_BITS_LEGEND: PixelLegend = { l: 'greenLight', m: 'green', d: 'bark' };
