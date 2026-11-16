import { PixelGrid, PixelLegend, TEXTURE } from '../../game/elements';

export const VILLAGE_ARROW: PixelGrid = [
  'oooo...........',
  'oyyoo..........',
  'oYyyyoo........',
  '.oYyyyyoo......',
  '..oYyyyyyoo....',
  '...oYyyyyyyoo..',
  '....oYyyyyyyyo.',
  '....oYYYyyyyyyo',
  '....oYyyyyyyyo.',
  '...oYyyyyyyoo..',
  '..oYyyyyyoo....',
  '.oYyyyyoo......',
  'oYyyyoo........',
  'oyyoo..........',
  'oooo...........',
];

export const VILLAGE_ARROW_LEGEND: PixelLegend = { o: 'ink', y: 'goldLight', Y: 'gold' };

export const BITS_LEGENDS: { texture: string; legend: PixelLegend }[] = [
  { texture: TEXTURE.leafBits, legend: { l: 'greenPale', m: 'greenLight', d: 'green' } },
  { texture: TEXTURE.snowBits, legend: { l: 'white', m: 'snow', d: 'snowShade' } },
  { texture: TEXTURE.clayBits, legend: { l: 'dirtLight', m: 'dirt', d: 'dirtDark' } },
  { texture: TEXTURE.crystalBits, legend: { l: 'goldLight', m: 'lilac', d: 'purple' } },
  { texture: TEXTURE.woodBits, legend: { l: 'dirtLight', m: 'barkLight', d: 'bark' } },
  { texture: TEXTURE.boneBits, legend: { l: 'white', m: 'whiteShade', d: 'midBarkLight' } },
  { texture: TEXTURE.purpleGoo, legend: { l: 'lilac', m: 'purple', d: 'redDeep' } },
  { texture: TEXTURE.lavaGoo, legend: { l: 'goldLight', m: 'gold', d: 'redLight' } },
];

export function buildShadow(width: number): PixelGrid {
  const height = Math.max(3, Math.round(width * 0.36));
  const radiusX = width / 2;
  const radiusY = height / 2;
  const rows: string[] = [];
  for (let row = 0; row < height; row++) {
    const offsetY = (row + 0.5 - radiusY) / radiusY;
    let line = '';
    for (let column = 0; column < width; column++) {
      const offsetX = (column + 0.5 - radiusX) / radiusX;
      line += offsetX * offsetX + offsetY * offsetY <= 1 ? 'o' : '.';
    }
    rows.push(line);
  }
  return rows;
}
