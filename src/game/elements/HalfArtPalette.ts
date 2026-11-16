import { HERO_PALETTE } from './halfPalette/HeroPalette';
import { MONSTER_PALETTE } from './halfPalette/MonsterPalette';
import { SKELETON_PALETTE } from './halfPalette/SkeletonPalette';
import { GOLEM_PALETTE } from './halfPalette/GolemPalette';
import { VILLAGER_PALETTE } from './halfPalette/VillagerPalette';
import { NATURE_PALETTE } from './halfPalette/NaturePalette';
import { DECOR_PALETTE } from './halfPalette/DecorPalette';
import { BREAKABLE_PALETTE } from './halfPalette/BreakablePalette';
import { ITEM_PALETTE } from './halfPalette/ItemPalette';
import { HOUSE_PALETTE } from './halfPalette/HousePalette';

export const HALF_ART_PALETTE = {
  ...HERO_PALETTE,
  ...MONSTER_PALETTE,
  ...SKELETON_PALETTE,
  ...GOLEM_PALETTE,
  ...VILLAGER_PALETTE,
  ...NATURE_PALETTE,
  ...DECOR_PALETTE,
  ...BREAKABLE_PALETTE,
  ...ITEM_PALETTE,
  ...HOUSE_PALETTE,
} as const;
