import type { QuestGoal } from './types';

export const MAX_ACTIVE_QUESTS = 3;
export const QUEST_XP_FACTOR = 2;
export const QUEST_BASE_XP = 15;
export const BREAKABLE_QUEST_XP = 3;

export interface QuestGoalDef {
  goal: QuestGoal;
  minCount: number;
  maxCount: number;
  coinsPerTarget: number;
  where: string;
}

export const QUEST_GOALS: QuestGoalDef[] = [
  { goal: 'greenSlime', minCount: 8, maxCount: 12, coinsPerTarget: 1, where: 'DANS LA FORET' },
  { goal: 'blueSlime', minCount: 8, maxCount: 12, coinsPerTarget: 1, where: 'DANS LA NEIGE' },
  { goal: 'redSlime', minCount: 5, maxCount: 8, coinsPerTarget: 2, where: 'DANS LE VOLCAN' },
  { goal: 'goblinArcher', minCount: 5, maxCount: 8, coinsPerTarget: 2, where: 'DANS LA FORET' },
  { goal: 'goblinBomber', minCount: 5, maxCount: 8, coinsPerTarget: 2, where: 'DANS LE VOLCAN' },
  { goal: 'skeleton', minCount: 6, maxCount: 9, coinsPerTarget: 2, where: 'DANS LE DESERT' },
  { goal: 'mushroom', minCount: 6, maxCount: 9, coinsPerTarget: 2, where: 'DANS LA FORET ET LE MARAIS' },
  { goal: 'bat', minCount: 8, maxCount: 12, coinsPerTarget: 1, where: 'DANS LA NEIGE ET LE MARAIS' },
  { goal: 'lavaGolem', minCount: 3, maxCount: 4, coinsPerTarget: 6, where: 'DANS LE VOLCAN' },
  { goal: 'breakables', minCount: 10, maxCount: 15, coinsPerTarget: 1, where: 'PARTOUT DANS LA NATURE' },
];

export function getQuestGoalDef(goal: QuestGoal): QuestGoalDef {
  const goalDef = QUEST_GOALS.find((entry) => entry.goal === goal);
  if (!goalDef) {
    throw new Error(`Unknown quest goal ${goal}`);
  }
  return goalDef;
}

export const QUEST_COMPLAINTS = [
  'ILS FONT PEUR A TOUT LE MONDE !',
  'ILS ONT MANGE MES GATEAUX !',
  'ILS M\'EMPECHENT DE DORMIR !',
  'ILS ONT CASSE MA BARRIERE !',
  'ILS ONT VOLE MON CHAPEAU !',
];

export const QUEST_THANKS = ['MERCI MON HEROS !', 'TU ES TROP FORT !', 'BRAVO NAEL !', 'GENIAL ! MERCI !'];

export const QUEST_WAITING = ['TU N\'AS PAS ENCORE FINI.', 'COURAGE ! TU Y ES PRESQUE.', 'REVIENS QUAND C\'EST FAIT !'];

export const QUEST_BUSY = ['TU AS DEJA TROP DE QUETES !', 'FINIS D\'ABORD LES AUTRES.'];
