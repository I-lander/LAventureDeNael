import type { PixelGrid, PixelLegend } from '../../game/elements';

export const BULLET: PixelGrid = [
  '......llll..',
  '..bbpplwwwwl',
  'bbppplwwwwwl',
  'bbppplwwwwwl',
  '..bbpplwwwwl',
  '......llll..',
];

export const BULLET_LEGEND: PixelLegend = {
  b: 'blue',
  p: 'blueLight',
  l: 'cyan',
  w: 'white',
};

export const MUZZLE_FLASH: PixelGrid = [
  '..l.......',
  '.lll..l...',
  'llwwl.ll..',
  'lwwwwllll.',
  'lwwwwwwwll',
  'lwwwwwwwll',
  'lwwwwllll.',
  'llwwl.ll..',
  '.lll..l...',
  '..l.......',
];

export const MUZZLE_FLASH_LEGEND: PixelLegend = {
  l: 'cyan',
  w: 'white',
};

export const SLIME_BALL: PixelGrid = [
  '...oooo...',
  '.oolmmmoo.',
  '.ollmmmdo.',
  'olllmmmmdo',
  'ollmmmmmdo',
  'ommmmmmddo',
  'ommmmmdddo',
  '.ommmdddo.',
  '.ooddddoo.',
  '...oooo...',
];

export const SLIME_BALL_LEGEND: PixelLegend = {
  o: 'greenDeep',
  l: 'greenPale',
  m: 'greenLight',
  d: 'green',
};

export const RED_BALL_LEGEND: PixelLegend = {
  o: 'redDeep',
  l: 'white',
  m: 'pink',
  d: 'redLight',
};

export const GOO_DROP: PixelGrid = ['.lm.', 'lmmd', 'mmdd', '.dd.'];

export const GREEN_GOO_LEGEND: PixelLegend = { l: 'greenLight', m: 'green', d: 'greenDark' };
export const BLUE_GOO_LEGEND: PixelLegend = { l: 'blueLight', m: 'blue', d: 'blueDark' };
export const RED_GOO_LEGEND: PixelLegend = { l: 'pink', m: 'redLight', d: 'red' };
export const SPARK_LEGEND: PixelLegend = { l: 'white', m: 'cyan', d: 'blueLight' };

export const SHADOW_SMALL: PixelGrid = [
  '....oooooooooooooooo....',
  '.oooooooooooooooooooooo.',
  'oooooooooooooooooooooooo',
  'oooooooooooooooooooooooo',
  '.oooooooooooooooooooooo.',
  '....oooooooooooooooo....',
];

export const SHADOW_LARGE: PixelGrid = [
  '..........oooooooooooooooooooooooooooooooooooooooooooooooo..........',
  '.....oooooooooooooooooooooooooooooooooooooooooooooooooooooooooo.....',
  '..oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo..',
  'oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo',
  'oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo',
  'oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo',
  'oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo',
  '..oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo..',
  '.....oooooooooooooooooooooooooooooooooooooooooooooooooooooooooo.....',
  '..........oooooooooooooooooooooooooooooooooooooooooooooooo..........',
];

export const SHADOW_LEGEND: PixelLegend = { o: 'ink' };

export const HEART: PixelGrid = [
  '.oooo....oooo.',
  'opprro..orrrdo',
  'opprrroorrrrdo',
  'oprrrrrrrrrrdo',
  'orrrrrrrrrrddo',
  '.orrrrrrrrddo.',
  '..orrrrrrddo..',
  '...orrrrddo...',
  '....orrddo....',
  '.....oddo.....',
  '......oo......',
];

export const HEART_LEGEND: PixelLegend = {
  o: 'ink',
  p: 'pink',
  r: 'redLight',
  d: 'red',
};

export const HEART_EMPTY_LEGEND: PixelLegend = {
  o: 'ink',
  p: 'barkLight',
  r: 'barkDark',
  d: 'barkDeep',
};

export const HEART_PICKUP_LEGEND: PixelLegend = {
  o: 'white',
  p: 'white',
  r: 'redLight',
  d: 'red',
};
