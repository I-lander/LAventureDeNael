import type { PixelGrid, PixelLegend } from '../../game/elements';

export const GRASS_A: PixelGrid = [
  'gggggggggggggggg',
  'ggggggggggdggggg',
  'gggLggggggddgggg',
  'ggLLgggggggggggg',
  'gggggggggggggggg',
  'ggggggggggggLggg',
  'gggggdgggggLLggg',
  'ggggddgggggggggg',
  'gggggggggggggggg',
  'gLgggggggggggggg',
  'gLLggggggdgggggg',
  'gggggggggddggggg',
  'gggggggggggggggg',
  'ggggggLggggggggg',
  'gggggLLggggggdgg',
  'gggggggggggggggg',
];

export const GRASS_B: PixelGrid = [
  'gggggggggggggggg',
  'gggggggggggggggg',
  'ggggggggggggdggg',
  'gggggggggggddggg',
  'gggLgggggggggggg',
  'ggLLgggggggggggg',
  'gggggggggggggggg',
  'gggggggggggggggg',
  'ggggggggLggggggg',
  'gggggggLLggggggg',
  'gggggggggggggggg',
  'ggdggggggggggggg',
  'gddggggggggggLgg',
  'ggggggggggggLLgg',
  'gggggggggggggggg',
  'gggggggggggggggg',
];

export const GRASS_LEGEND: PixelLegend = { g: 'meadow', d: 'meadowDark', L: 'meadowLight' };

export const SNOW_A: PixelGrid = [
  'ssssssssssssssss',
  'ssssssssssssssss',
  'sssssSSSssssssss',
  'ssssSSssssssssss',
  'ssssssssssssssss',
  'sssssssssssssSSs',
  'ssssssssssssSSss',
  'ssssssssssssssss',
  'ssssssssssssssss',
  'sSSSssssssssssss',
  'SSssssssssssssss',
  'ssssssssSSSsssss',
  'sssssssSSsssssss',
  'ssssssssssssssss',
  'ssssssssssssssss',
  'ssssssssssssssss',
];

export const SNOW_B: PixelGrid = [
  'ssssssssssssssss',
  'ssssssssssssssss',
  'ssssssssssssssss',
  'sssssssssssSSSss',
  'ssssssssssSSssss',
  'ssssssssssssssss',
  'sssSSsssssssssss',
  'ssSSssssssssssss',
  'ssssssssssssssss',
  'ssssssssssssssss',
  'ssssssssssssssss',
  'ssssssSSSsssssss',
  'sssssSSsssssssss',
  'ssssssssssssssss',
  'ssssssssssssssss',
  'ssssssssssssssss',
];

export const SNOW_LEGEND: PixelLegend = { s: 'snow', S: 'snowShade' };

export const ASH_A: PixelGrid = [
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaAAaaaaaaaaaaa',
  'aaaaAAaaaaaaaaaa',
  'aaaaaAaaaaallaaa',
  'aaaaaaaaaaaalaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aallaaaaaaaaaaaa',
  'aaalaaaaaAAaaaaa',
  'aaaaaaaaAAaaaaaa',
  'aaaaaaaaAaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaAAa',
  'aaaaaaaaaaaaAAaa',
  'aaaaaaaaaaaaaaaa',
];

export const ASH_B: PixelGrid = [
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaallaaa',
  'aaaaaaaaaaaalaaa',
  'aaaaaaaaaaaaaaaa',
  'aaAAaaaaaaaaaaaa',
  'aaaAAaaaaaaaaaaa',
  'aaaaAaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaallaaaaaaa',
  'aaaaaaaalaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaAAaa',
  'aaaaaaaaaaaAAaaa',
  'aaaaaaaaaaaaaaaa',
];

export const ASH_LEGEND: PixelLegend = { a: 'ash', A: 'ashDark', l: 'ashLight' };

export const PATH_A: PixelGrid = [
  'pppppppppppppppp',
  'pppppppppppppppp',
  'pppDDppppppppppp',
  'ppppDppppppLLppp',
  'ppppppppppppLppp',
  'pppppppppppppppp',
  'pppppppppppppppp',
  'ppppppLLpppppppp',
  'pppppppLpppppppp',
  'pppppppppppppppp',
  'pppppppppppDDppp',
  'pDDpppppppppDppp',
  'ppDppppppppppppp',
  'pppppppppppppppp',
  'pppppppppppppppp',
  'pppppppppppppppp',
];

export const PATH_B: PixelGrid = [
  'pppppppppppppppp',
  'pppppppppppppppp',
  'pppppppppppppppp',
  'pppppppppDDppppp',
  'ppppppppppDppppp',
  'ppLLpppppppppppp',
  'pppLpppppppppppp',
  'pppppppppppppppp',
  'pppppppppppppppp',
  'pppppppppppppLLp',
  'ppppppppppppppLp',
  'pppppDDppppppppp',
  'ppppppDppppppppp',
  'pppppppppppppppp',
  'pppppppppppppppp',
  'pppppppppppppppp',
];

export const PATH_LEGEND: PixelLegend = { p: 'dirt', D: 'dirtDark', L: 'dirtLight' };

export const TREE: PixelGrid = [
  '........oooooooo........',
  '.....oooLLLLLLggooo.....',
  '....oLLLLLLLggggggdo....',
  '...oLLLLLLggggggggddo...',
  '..oLLLLLggggggggggdddo..',
  '.oLLLLgggggggggggggdddo.',
  '.oLLLggggggggggggggdddo.',
  'oLLLgggggggggggggggddddo',
  'oLLggggggggggggggggddddo',
  'oLgggggggggggggggggddddo',
  'oLggggggggggggggggdddddo',
  'oggggggggggggggggddddddo',
  'ogggggggggggggggdddddDDo',
  'oggggggggggggdddddddDDDo',
  '.oggggggggdddddddddDDDo.',
  '.odddgggddddddddddDDDDo.',
  '..odddddddddddddDDDDDo..',
  '...ooddddddddDDDDDDoo...',
  '.....oooDDDDDDDDooo.....',
  '........oobtTToo........',
  '.........obtTTo.........',
  '.........obtTTo.........',
  '.........obtTTo.........',
  '........obbtTTTo........',
  '.......obbttTTTTo.......',
  '.......oooooooooo.......',
];

export const TREE_LEGEND: PixelLegend = {
  o: 'ink',
  L: 'greenLight',
  g: 'green',
  d: 'greenDark',
  D: 'greenDeep',
  b: 'barkLight',
  t: 'bark',
  T: 'barkDark',
};

export const PINE: PixelGrid = [
  '.........oo.........',
  '........owwo........',
  '........owwo........',
  '.......owwwso.......',
  '.......owwppo.......',
  '......owwpppPo......',
  '.....owwpppppPo.....',
  '....oooppppppPoo....',
  '......owwwsppo......',
  '.....owwwsppppo.....',
  '....owwwppppppPo....',
  '...owwpppppppppPo...',
  '..owwppppppppppPPo..',
  '..ooopppppppppPPoo..',
  '.....owwwwsppPo.....',
  '....owwwwsppppPo....',
  '...owwwwpppppppPo...',
  '..owwwpppppppppPPo..',
  '.owwwpppppppppppPPo.',
  'owwpppppppppppppPPPo',
  'oppppppppppppppPPPPo',
  '.ooooooPPPPPPoooooo.',
  '........ottTo.......',
  '........ottTo.......',
  '.......oottTTo......',
  '.......ooooooo......',
];

export const PINE_LEGEND: PixelLegend = {
  o: 'ink',
  w: 'snow',
  s: 'snowShade',
  p: 'mist',
  P: 'mistDark',
  t: 'bark',
  T: 'barkDark',
};

export const ROCK: PixelGrid = [
  '......oooooo........',
  '....ooaaaarroo......',
  '...oaaaaarrrrRo.....',
  '..oaaaarrrrrrRRo....',
  '.oaaarrrrrrrrRRRo...',
  '.oaarrrrrrrrrRRRRo..',
  'oaarrrrerrrrrRRRRRo.',
  'oarrrreyerrrrRRRRRo.',
  'oarrrrrerrrrRRRRRRo.',
  'orrrrrrrrrrRRRRRRRo.',
  'orrrrrrrrRRRRRRRRRo.',
  '.oRRRRRRRRRRRRRRRo..',
  '..ooooooooooooooo...',
];

export const ROCK_LEGEND: PixelLegend = {
  o: 'ink',
  a: 'whiteShade',
  r: 'ashLight',
  R: 'ashDark',
  e: 'redLight',
  y: 'goldLight',
};

export const FLOWERS: PixelGrid = [
  '.pp.......',
  'pyp...ww..',
  '.pp..wyw..',
  '.d....ww..',
  '.d.....d..',
  'dd.....dd.',
];

export const FLOWERS_LEGEND: PixelLegend = { p: 'pink', y: 'goldLight', w: 'white', d: 'greenDark' };

export const LAVA_CRACK: PixelGrid = [
  '..RR........',
  '.ReeR...RR..',
  'ReyyeRRReeR.',
  '.ReeeeeeyeR.',
  '..RRReeeeR..',
  '.....RRRR...',
];

export const LAVA_CRACK_LEGEND: PixelLegend = { R: 'ashDark', e: 'redLight', y: 'goldLight' };

export const PET_DOG: PixelGrid = [
  '.........oo..oo.',
  '.........obooboo',
  'oo.......obbbbbo',
  'obo......obobbwo',
  '.obooooooobbbwoo',
  '..obbbbbbbbbbooo',
  '..obbbbbbbbbBo..',
  '..obBBBBBBBBBo..',
  '..obo....obo....',
  '..ooo....ooo....',
];

export const PET_DOG_LEGEND: PixelLegend = { o: 'ink', b: 'gold', B: 'goldDark', w: 'white' };

export const HOUSE_SIZE = { width: 48, height: 41 };
export const HOUSE_BODY_OFFSET = { x: 0, y: 6 };
export const HOUSE_SIGN_OFFSET = { x: 14, y: 0 };
export const HOUSE_ICON_OFFSET = { x: 16, y: 2 };

export const HOUSE_SIGN: PixelGrid = [
  'oooooooooooooooooooo',
  'okkkkkkkkkkkkkkkkkko',
  'okkkkkkkkkkkkkkkkkko',
  'okkkkkkkkkkkkkkkkkko',
  'okkkkkkkkkkkkkkkkkko',
  'okkkkkkkkkkkkkkkkkko',
  'okkkkkkkkkkkkkkkkkko',
  'okkkkkkkkkkkkkkkkkko',
  'okkkkkkkkkkkkkkkkkko',
  'okkkkkkkkkkkkkkkkkko',
  'okkkkkkkkkkkkkkkkkko',
  'okkkkkkkkkkkkkkkkkko',
  'okkkkkkkkkkkkkkkkkko',
  'okkkkkkkkkkkkkkkkkko',
  'okkkkkkkkkkkkkkkkkko',
  'okkkkkkkkkkkkkkkkkko',
  'okkkkkkkkkkkkkkkkkko',
  'okkkkkkkkkkkkkkkkkko',
  'oKKKKKKKKKKKKKKKKKKo',
  'oooooooooooooooooooo',
];

export const HOUSE_BODY: PixelGrid = [
  '......oooooooooooooooooooooooooooooooooooo......',
  '.....ollllllllllllllllllllllllllllllllllllo.....',
  '....orrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrro....',
  '...orrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrro...',
  '..orrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrro..',
  '.orrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrro.',
  '.orrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrro.',
  '.orrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrro.',
  '.oRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRo.',
  '.orrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrro.',
  '.orrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrro.',
  '.orrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrro.',
  '.oRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRo.',
  '.orrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrro.',
  '.orrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrro.',
  '.orrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrro.',
  '.oRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRo.',
  'oRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRo',
  'oooooooooooooooooooooooooooooooooooooooooooooooo',
  '..oWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWo..',
  '..owwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwo..',
  '..owwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwo..',
  '..owwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwo..',
  '..owwwwoooooooowwwwwwwwwwwwwwwwwwoooooooowwwwo..',
  '..owwwwoccccccowwwwoooooooooowwwwoccccccowwwwo..',
  '..owwwwoccccccowwwwoddddddddowwwwoccccccowwwwo..',
  '..owwwwogggggGowwwwoddddddddowwwwogggggGowwwwo..',
  '..owwwwogggggGowwwwoddddddddowwwwogggggGowwwwo..',
  '..owwwwogggggGowwwwoddddddddowwwwogggggGowwwwo..',
  '..owwwwoooooooowwwwoddddddydowwwwoooooooowwwwo..',
  '..owwwwwwwwwwwwwwwwoddddddddowwwwwwwwwwwwwwwwo..',
  '..owwwwwwwwwwwwwwwwoddddddddowwwwwwwwwwwwwwwwo..',
  '..owwwwwwwwwwwwwwwwoDDDDDDDDowwwwwwwwwwwwwwwwo..',
  '..oWWWWWWWWWWWWWWWWoDDDDDDDDoWWWWWWWWWWWWWWWWo..',
  '..oooooooooooooooooooooooooooooooooooooooooooo..',
];

const HOUSE_BASE_LEGEND: PixelLegend = {
  o: 'ink',
  w: 'white',
  W: 'whiteShade',
  c: 'cyan',
  g: 'blueLight',
  G: 'blueDark',
  d: 'barkLight',
  D: 'bark',
  y: 'goldLight',
  k: 'dirtLight',
  K: 'dirtDark',
};

export const HOUSE_WEAPONS_LEGEND: PixelLegend = { ...HOUSE_BASE_LEGEND, l: 'redLight', r: 'red', R: 'redDeep' };
export const HOUSE_POTIONS_LEGEND: PixelLegend = { ...HOUSE_BASE_LEGEND, l: 'lilac', r: 'purple', R: 'redDeep' };
export const HOUSE_POWERS_LEGEND: PixelLegend = { ...HOUSE_BASE_LEGEND, l: 'blueLight', r: 'blue', R: 'blueDark' };
export const HOUSE_PET_LEGEND: PixelLegend = { ...HOUSE_BASE_LEGEND, l: 'goldLight', r: 'gold', R: 'goldDark' };
