import type { UpgradeDef, UpgradeKind } from './types';

export const UPGRADES: UpgradeDef[] = [
  {
    kind: 'potion',
    shop: 'potions',
    name: 'POTION',
    description: ['SOIGNE TOUS', 'LES COEURS'],
    basePrice: 8,
    priceGrowth: 1,
    maxLevel: null,
    icon: {
      key: 'shop-icon-potion',
      rows: [
        '................',
        '.....oooooo.....',
        '.....okkkko.....',
        '.....oooooo.....',
        '......osso......',
        '......osso......',
        '.....osssso.....',
        '....oswssssso...',
        '...owlrrrrrrro..',
        '..orwlrrrrrrrDo.',
        '..orlrrrrrrrrDo.',
        '..orrrrrrrrrDDo.',
        '...oDrrrrrrDDo..',
        '....oooooooooo..',
        '................',
        '................',
      ],
      legend: { o: 'ink', k: 'barkLight', s: 'cyan', w: 'white', l: 'redLight', r: 'red', D: 'redDeep' },
    },
  },
  {
    kind: 'pet',
    shop: 'pet',
    name: 'CHIEN',
    description: ['IL TE SUIT ET', 'MORD LES MONSTRES'],
    basePrice: 25,
    priceGrowth: 1.8,
    maxLevel: 3,
    icon: {
      key: 'shop-icon-pet',
      rows: [
        '................',
        '....oo....oo....',
        '...obbo..obbo...',
        '...obbo..obbo...',
        '.oo.oo....oo.oo.',
        'obbo........obbo',
        'obbo..oooo..obbo',
        '.oo..obbbbo..oo.',
        '....obbbbbbo....',
        '...obbbbbbbbo...',
        '...obbbbbbbbo...',
        '...obbBBBBbbo...',
        '....oBBooBBo....',
        '.....oo..oo.....',
        '................',
        '................',
      ],
      legend: { o: 'ink', b: 'gold', B: 'goldDark' },
    },
  },
];

export function getUpgradeDef(kind: UpgradeKind): UpgradeDef {
  const upgradeDef = UPGRADES.find((entry) => entry.kind === kind);
  if (!upgradeDef) {
    throw new Error(`Unknown upgrade kind ${kind}`);
  }
  return upgradeDef;
}

export function createEmptyUpgradeLevels(): Record<UpgradeKind, number> {
  return { potion: 0, pet: 0 };
}
