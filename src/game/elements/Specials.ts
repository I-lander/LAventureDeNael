import type { SpecialKind } from './types';

export const SPECIAL_KINDS: SpecialKind[] = ['bombRain', 'shield', 'megaLaser'];

export const SPECIAL_NAMES: Record<SpecialKind, string> = {
  bombRain: 'PLUIE DE BOMBES !',
  shield: 'BOUCLIER !',
  megaLaser: 'MEGA LASER !',
};
