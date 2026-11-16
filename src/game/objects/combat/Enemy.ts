import type { CombatContext, EnemyDef } from '../../elements';

export interface Enemy {
  readonly def: EnemyDef;
  x: number;
  groundY: number;
  dead: boolean;
  readonly bodyCenter: { x: number; y: number };
  update(deltaMs: number, context: CombatContext): void;
  hit(damage: number): boolean;
  destroy(): void;
}

export interface Heading {
  x: number;
  y: number;
  distance: number;
}

export function headingTo(fromX: number, fromY: number, toX: number, toY: number): Heading {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.001) {
    return { x: 0, y: 0, distance: 0 };
  }
  return { x: dx / distance, y: dy / distance, distance };
}
