import type { PixelGrid, PixelLegend } from '../../../game/elements';

export const WEAPON_PISTOL: PixelGrid = [
  '.kkkkkk',
  'kiiiiik',
  'kaaaank',
  'kankkkk',
  '.kk....',
];

export const WEAPON_SHOTGUN: PixelGrid = [
  '....kkkkkkkk',
  'kkkkyyyyyyyk',
  'khhrsssssssk',
  'krrkkhhhkkk.',
  '.kk..kkk....',
];

export const WEAPON_LASER_GUN: PixelGrid = [
  '.kkkkkkkk.',
  'kvvvvvvvwk',
  'kppppppvwk',
  'kppkkkkkk.',
  '.kk.......',
];

export const WEAPON_ROCKET_LAUNCHER: PixelGrid = [
  'kkkkkkkkkkk..',
  'kllllllllkxk.',
  'kggggggggkxxk',
  'kddddddddkxk.',
  'kkkkkkkkkkk..',
];

export const WEAPON_LEGEND: PixelLegend = {
  'k': 'heroInk',
  'a': 'heroPistol',
  'i': 'heroPistolLight',
  'n': 'heroBlueDark',
  'y': 'heroGrey',
  's': 'heroGunSteel',
  'h': 'heroSkinShade',
  'r': 'heroBrown',
  'v': 'heroGunLilac',
  'p': 'heroGunPurple',
  'w': 'heroWhite',
  'l': 'heroGreenLight',
  'g': 'heroGreen',
  'd': 'heroGreenDark',
  'x': 'heroGunRed',
};
