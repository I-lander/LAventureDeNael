import type { WaveEntry } from './types';

export const LEVEL_ONE_WAVES: WaveEntry[] = [
  { atSecond: 1.5, kind: 'greenSlime', count: 3, intervalSeconds: 1.2, lane: 'middle' },
  { atSecond: 6, kind: 'greenSlime', count: 4, intervalSeconds: 0.9, lane: 'random' },
  { atSecond: 11, kind: 'blueSlime', count: 3, intervalSeconds: 0.7, lane: 'top' },
  { atSecond: 14, kind: 'blueSlime', count: 3, intervalSeconds: 0.7, lane: 'bottom' },
  { atSecond: 16, kind: 'goblinArcher', count: 1, intervalSeconds: 0, lane: 'top' },
  { atSecond: 18, kind: 'greenSlime', count: 6, intervalSeconds: 0.6, lane: 'player' },
  { atSecond: 23, kind: 'redSlime', count: 1, intervalSeconds: 0, lane: 'middle' },
  { atSecond: 25, kind: 'greenSlime', count: 5, intervalSeconds: 0.8, lane: 'random' },
  { atSecond: 28, kind: 'goblinBomber', count: 1, intervalSeconds: 0, lane: 'middle' },
  { atSecond: 30, kind: 'blueSlime', count: 6, intervalSeconds: 0.45, lane: 'random' },
  { atSecond: 35, kind: 'redSlime', count: 2, intervalSeconds: 1.5, lane: 'random' },
  { atSecond: 37, kind: 'greenSlime', count: 6, intervalSeconds: 0.5, lane: 'player' },
  { atSecond: 40, kind: 'goblinArcher', count: 2, intervalSeconds: 1, lane: 'random' },
  { atSecond: 43, kind: 'blueSlime', count: 4, intervalSeconds: 0.4, lane: 'top' },
  { atSecond: 44, kind: 'blueSlime', count: 4, intervalSeconds: 0.4, lane: 'bottom' },
  { atSecond: 47, kind: 'goblinBomber', count: 2, intervalSeconds: 1.5, lane: 'random' },
  { atSecond: 49, kind: 'redSlime', count: 3, intervalSeconds: 1.2, lane: 'random' },
  { atSecond: 51, kind: 'greenSlime', count: 8, intervalSeconds: 0.45, lane: 'random' },
  { atSecond: 55, kind: 'goblinArcher', count: 2, intervalSeconds: 0.8, lane: 'bottom' },
  { atSecond: 57, kind: 'blueSlime', count: 8, intervalSeconds: 0.35, lane: 'player' },
  { atSecond: 61, kind: 'redSlime', count: 2, intervalSeconds: 0.8, lane: 'random' },
  { atSecond: 62, kind: 'greenSlime', count: 6, intervalSeconds: 0.5, lane: 'random' },
  { atSecond: 64, kind: 'goblinBomber', count: 2, intervalSeconds: 1, lane: 'random' },
];

export const BOSS_ARRIVAL_SECOND = 72;
