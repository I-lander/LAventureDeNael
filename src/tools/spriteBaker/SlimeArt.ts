import type { PixelGrid, PixelLegend } from '../../game/elements';

export const SLIME_IDLE: PixelGrid = [
  '...........oooooooooo...........',
  '........ooolllllmmmmmooo........',
  '......oolllpppllmmmmmmmmoo......',
  '....oolllppppllmmmmmmmmmmmoo....',
  '...olllpppppllmmmmmmmmmmmmmmo...',
  '..olllppppplllmmmmmmmmmmmmmmmo..',
  '..ollllpppllllmmmmmmmmmmmmmmdo..',
  '.olllllllllllmmmmmmmmmmmmmmmddo.',
  '.ollllllllmmmmmmmmmmmmmmmmmmddo.',
  'ollllllmmmmmmmmmmmmmmmmmmmmmdddo',
  'ollllmmmmmmmmmmmmmmmmmmmmmmmdddo',
  'olmmmeemmmmmmeemmmmmmmmmmmmmdddo',
  'olmmeewwmmmmeewwmmmmmmmmmmmmdddo',
  'olmmeewwmmmmeewwmmmmmmmmmmmmdddo',
  'ommmeeeemmmmeeeemmmmmmmmmmmmdddo',
  'ommmmeemmmmmmeemmmmmmmmmmmmmdddo',
  'ommmmmmmmmmmmmmmmmmmmmmmmmmddddo',
  'ommmmmmmeeeeeemmmmmmmmmmmmmddddo',
  'odmmmmmmmmeeeemmmmmmmmmmmmmddddo',
  'odmmmmmmmmmmmmmmmmmmmmmmmmmddddo',
  'oddmmmmmmmmmmmmmmmmmmmmmmddddddo',
  'odddmmmmmmmmmmmmmmmmmmdddddddddo',
  '.oddddmmmmmmmmmmmmddddddddddddo.',
  '.oddddddddddddddddddddddddddddo.',
  '..ooddddddddddddddddddddddddoo..',
  '....oooooooooooooooooooooooo....',
];

export const SLIME_SQUASH: PixelGrid = [
  '............oooooooooooo............',
  '.......ooooollllllmmmmmmmmooo.......',
  '....ooolllpppplllmmmmmmmmmmmmooo....',
  '..oolllppppplllmmmmmmmmmmmmmmmmmoo..',
  '.ollllppplllllmmmmmmmmmmmmmmmmmmddo.',
  'ollllllllllmmmmmmmmmmmmmmmmmmmmddddo',
  'olmmmeemmmmmmeemmmmmmmmmmmmmmmmddddo',
  'ommmeewwmmmmeewwmmmmmmmmmmmmmmmddddo',
  'ommmeeeemmmmeeeemmmmmmmmmmmmmmmddddo',
  'ommmmeemmmmmmeemmmmmmmmmmmmmmmmddddo',
  'ommmmmmmeeeeeemmmmmmmmmmmmmmmmmddddo',
  'odmmmmmmmmeeeemmmmmmmmmmmmmmmmdddddo',
  'oddmmmmmmmmmmmmmmmmmmmmmmmmmmmdddddo',
  'odddmmmmmmmmmmmmmmmmmmmmmmdddddddddo',
  'odddddmmmmmmmmmmmmmmmmdddddddddddddo',
  'oddddddddddddddddddddddddddddddddddo',
  'oddddddddddddddddddddddddddddddddddo',
  '.oddddddddddddddddddddddddddddddddo.',
  '..ooddddddddddddddddddddddddddddoo..',
  '....oooooooooooooooooooooooooooo....',
];

export const GREEN_SLIME_LEGEND: PixelLegend = {
  o: 'greenDeep',
  d: 'greenDark',
  m: 'green',
  l: 'greenLight',
  p: 'greenPale',
  e: 'ink',
  w: 'white',
};

export const BLUE_SLIME_LEGEND: PixelLegend = {
  o: 'blueDeep',
  d: 'blueDark',
  m: 'blue',
  l: 'blueLight',
  p: 'cyan',
  e: 'ink',
  w: 'white',
};

export const RED_SLIME_LEGEND: PixelLegend = {
  o: 'redDeep',
  d: 'red',
  m: 'redLight',
  l: 'pink',
  p: 'white',
  e: 'ink',
  w: 'white',
};
