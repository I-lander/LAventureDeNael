import type { PixelGrid, PixelLegend } from '../../game/elements';

export const ARROW: PixelGrid = [
  'pp........o.',
  'ppffffffffoo',
  'pp........o.',
];

export const ARROW_LEGEND: PixelLegend = { p: 'redLight', f: 'barkLight', o: 'whiteShade' };

export const BOMB: PixelGrid = [
  '.....y....',
  '....yfy...',
  '.....f....',
  '....oo....',
  '..oBBBBo..',
  '.oBWWBBBo.',
  'oBWBBBBBBo',
  'oBBBBBBBBo',
  'oBBBBBBBBo',
  '.oBBBBBBo.',
  '..oBBBBo..',
  '...oooo...',
];

export const BOMB_LEGEND: PixelLegend = {
  o: 'ink',
  B: 'night',
  W: 'whiteShade',
  f: 'barkLight',
  y: 'goldLight',
};

export const BOMB_TARGET: PixelGrid = [
  '......rrrrrrrrrrrr......',
  '...rrr............rrr...',
  '.rr..................rr.',
  'r..........rr..........r',
  'r..........rr..........r',
  '.rr..................rr.',
  '...rrr............rrr...',
  '......rrrrrrrrrrrr......',
];

export const BOMB_TARGET_LEGEND: PixelLegend = { r: 'redLight' };

export const EXPLOSION: PixelGrid = [
  '.........RR...RR........',
  '....RR..RRRR.RRRR..RR...',
  '...RRRRRRyyRRRyyRRRRRR..',
  '..RRRyyyyyyyyyyyyyyRRR..',
  '.RRRyyyyYYYYYYYyyyyyRRR.',
  '.RRyyyYYYYYYYYYYYYyyyRR.',
  'RRyyyYYYYwwwwwwYYYYyyyRR',
  'RRyyYYYwwwwwwwwwwYYYyyRR',
  'RyyyYYYwwwwwwwwwwYYYyyyR',
  'RyyYYYwwwwwwwwwwwwYYYyyR',
  'RyyYYYwwwwwwwwwwwwYYYyyR',
  'RyyYYYwwwwwwwwwwwwYYYyyR',
  'RyyYYYwwwwwwwwwwwwYYYyyR',
  'RyyyYYYwwwwwwwwwwYYYyyyR',
  'RRyyYYYwwwwwwwwwwYYYyyRR',
  'RRyyyYYYYwwwwwwYYYYyyyRR',
  '.RRyyyYYYYYYYYYYYYyyyRR.',
  '.RRRyyyyYYYYYYYyyyyyRRR.',
  '..RRRyyyyyyyyyyyyyyRRR..',
  '...RRRRRRyyRRRyyRRRRRR..',
  '....RR..RRRR.RRRR..RR...',
  '.........RR...RR........',
];

export const EXPLOSION_LEGEND: PixelLegend = {
  R: 'redLight',
  y: 'gold',
  Y: 'goldLight',
  w: 'white',
};

export const POWER_STAR: PixelGrid = [
  '.......oo.......',
  '......oYYo......',
  '......oYyo......',
  '.....oYYyyo.....',
  'ooooooYYyyyooooo',
  'oYYYYYYYyyyyyyyo',
  '.oYYYwYYywyyyyo.',
  '..oYYwYYywyyyo..',
  '...oYYYYyyyyo...',
  '...oYYYYyyyyo...',
  '..oYYYYoyyyyyo..',
  '..oYYYo..oyyyo..',
  '.oYYo......oyyo.',
  '.ooo........ooo.',
];

export const POWER_STAR_LEGEND: PixelLegend = {
  o: 'ink',
  Y: 'goldLight',
  y: 'gold',
  w: 'ink',
};

export const MEGA_LASER: PixelGrid = [
  'bb',
  'cc',
  'cc',
  'ww',
  'ww',
  'ww',
  'ww',
  'ww',
  'ww',
  'ww',
  'ww',
  'ww',
  'ww',
  'ww',
  'ww',
  'cc',
  'cc',
  'bb',
];

export const MEGA_LASER_LEGEND: PixelLegend = { b: 'blueLight', c: 'cyan', w: 'white' };

export const PELLET: PixelGrid = [
  '..yy..',
  '.yYYy.',
  'yYwwYy',
  'yYwwYy',
  '.yYYy.',
  '..yy..',
];

export const PELLET_LEGEND: PixelLegend = { y: 'gold', Y: 'goldLight', w: 'white' };

export const LASER_BOLT: PixelGrid = [
  '....pppppppppppp....',
  'ppplllwwwwwwwwlllppp',
  'ppplllwwwwwwwwlllppp',
  '....pppppppppppp....',
];

export const LASER_BOLT_LEGEND: PixelLegend = { p: 'purple', l: 'lilac', w: 'white' };

export const ROCKET: PixelGrid = [
  '...oo...........',
  '...oRoooooooo...',
  'yy.oRwwwwwwwwRo.',
  'YYYoRWWWWWWWWRRo',
  'yy.oRssssssssRo.',
  '...oRoooooooo...',
  '...oo...........',
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

export function buildShieldBubble(diameter: number): PixelGrid {
  const radius = diameter / 2;
  return Array.from({ length: diameter }, (_unusedRow, rowIndex) => {
    let row = '';
    for (let column = 0; column < diameter; column++) {
      const dx = column + 0.5 - radius;
      const dy = rowIndex + 0.5 - radius;
      const distance = Math.hypot(dx, dy);
      const upperLeft = dx < 0 && dy < 0;
      if (distance > radius) {
        row += '.';
      } else if (distance > radius - 1.5) {
        row += upperLeft ? 'w' : 'c';
      } else if (distance > radius - 3) {
        row += 'b';
      } else if (upperLeft && distance > radius * 0.6 && distance < radius * 0.72 && Math.abs(dx + dy) < radius * 0.6) {
        row += 'w';
      } else {
        row += '.';
      }
    }
    return row;
  });
}

export const SHIELD_BUBBLE_LEGEND: PixelLegend = { c: 'cyan', b: 'blueLight', w: 'white' };
