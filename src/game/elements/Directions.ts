import type { Direction8, DirectionArt, EnemyLook } from './types';

export const DIRECTIONS: Direction8[] = [
  'east',
  'southEast',
  'south',
  'southWest',
  'west',
  'northWest',
  'north',
  'northEast',
];

export const DIRECTION_ART: Record<Direction8, DirectionArt> = {
  east: { art: 'east', flipX: false },
  southEast: { art: 'south-east', flipX: false },
  south: { art: 'south', flipX: false },
  southWest: { art: 'south-east', flipX: true },
  west: { art: 'east', flipX: true },
  northWest: { art: 'north-east', flipX: true },
  north: { art: 'north', flipX: false },
  northEast: { art: 'north-east', flipX: false },
};

const SIDE_VIEW_BIAS = 1.2;

export function enemyLookFromVector(x: number, y: number): EnemyLook {
  if (Math.abs(x) * SIDE_VIEW_BIAS >= Math.abs(y)) {
    return { view: 'side', flipX: x < 0 };
  }
  return { view: y > 0 ? 'front' : 'back', flipX: false };
}

export function directionFromVector(x: number, y: number): Direction8 {
  const step = Math.round(Math.atan2(y, x) / (Math.PI / 4));
  return DIRECTIONS[((step % DIRECTIONS.length) + DIRECTIONS.length) % DIRECTIONS.length];
}
