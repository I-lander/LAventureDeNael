import type { PixelGrid, PixelLegend } from '../../../game/elements';

export const BULLET: PixelGrid = [
  '...ll.',
  'bpplwl',
  '...ll.',
];

export const BULLET_LEGEND: PixelLegend = { b: 'blue', p: 'blueLight', l: 'cyan', w: 'white' };

export const MUZZLE_FLASH: PixelGrid = [
  '.l...',
  'lwl..',
  'lwwll',
  'lwl..',
  '.l...',
];

export const MUZZLE_FLASH_LEGEND: PixelLegend = { l: 'cyan', w: 'white' };

export const BALL: PixelGrid = [
  '.oo.',
  'olmo',
  'omdo',
  '.oo.',
];

export const SLIME_BALL_LEGEND: PixelLegend = { o: 'greenDeep', l: 'greenPale', m: 'greenLight', d: 'green' };

export const RED_BALL_LEGEND: PixelLegend = { o: 'redDeep', l: 'white', m: 'pink', d: 'redLight' };

export const BOMB_TARGET: PixelGrid = [
  '...rrrrrr...',
  '.rr......rr.',
  'r....rr....r',
  '.rr......rr.',
  '...rrrrrr...',
];

export const BOMB_TARGET_LEGEND: PixelLegend = { r: 'redLight' };

export const MEGA_LASER: PixelGrid = ['b', 'c', 'w', 'w', 'w', 'w', 'w', 'w', 'c', 'b'];

export const MEGA_LASER_LEGEND: PixelLegend = { b: 'blueLight', c: 'cyan', w: 'white' };

export const PELLET: PixelGrid = [
  '.y.',
  'ywy',
  '.y.',
];

export const PELLET_LEGEND: PixelLegend = { y: 'gold', w: 'white' };

export const LASER_BOLT: PixelGrid = [
  '..pppppp..',
  'pplwwwwlpp',
  '..pppppp..',
];

export const LASER_BOLT_LEGEND: PixelLegend = { p: 'purple', l: 'lilac', w: 'white' };

export const ROCKET: PixelGrid = [
  '.oooooo.',
  'yoRwwwRo',
  'YoRWWWRR',
  'yoRsssRo',
  '.oooooo.',
];

export const ROCKET_LEGEND: PixelLegend = {
  o: 'ink',
  R: 'red',
  w: 'white',
  W: 'whiteShade',
  s: 'mistLight',
  y: 'gold',
  Y: 'goldLight',
};

export const VILLAGE_ARROW: PixelGrid = [
  'oo......',
  'oyoo....',
  '.oyyoo..',
  '.oYyyyo.',
  '.oYyyyo.',
  '.oyyoo..',
  'oyoo....',
  'oo......',
];

export const VILLAGE_ARROW_LEGEND: PixelLegend = { o: 'ink', y: 'goldLight', Y: 'gold' };
