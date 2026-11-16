import { PixelArtDef, ShopKind, getUpgradeDef, getWeaponDef } from '../../game/elements';

export const SIGN_ICONS: Record<ShopKind, PixelArtDef> = {
  weapons: getWeaponDef('pistol').icon,
  potions: getUpgradeDef('potion').icon,
  pet: getUpgradeDef('pet').icon,
};
