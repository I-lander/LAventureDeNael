import Phaser from 'phaser';
import { AnimationDef, GLYPH_HEIGHT, GLYPH_WIDTH, PALETTE, PaletteKey, PixelArtDef, getGlyph } from '../elements';

const NEIGHBOUR_OFFSETS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
];

export function paletteCss(key: PaletteKey): string {
  return `#${PALETTE[key].toString(16).padStart(6, '0')}`;
}

function createCanvas(scene: Phaser.Scene, key: string, width: number, height: number) {
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }
  const canvasTexture = scene.textures.createCanvas(key, width, height);
  if (!canvasTexture) {
    throw new Error(`Cannot create canvas texture ${key}`);
  }
  canvasTexture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return canvasTexture;
}

export function registerAnimations(scene: Phaser.Scene, animations: AnimationDef[]) {
  animations.forEach((animation) => {
    if (scene.anims.exists(animation.key)) {
      return;
    }
    scene.anims.create({
      key: animation.key,
      frames: animation.frames.map((frameName) => ({ key: animation.atlas, frame: frameName })),
      frameRate: animation.frameRate,
      repeat: animation.repeat,
    });
  });
}

export function bakePixelArt(scene: Phaser.Scene, art: PixelArtDef) {
  if (scene.textures.exists(art.key)) {
    return;
  }
  const width = Math.max(...art.rows.map((row) => row.length));
  const canvasTexture = createCanvas(scene, art.key, width, art.rows.length);
  const context = canvasTexture.getContext();
  art.rows.forEach((row, y) => {
    [...row].forEach((symbol, x) => {
      const paletteKey = art.legend[symbol];
      if (!paletteKey) {
        return;
      }
      context.fillStyle = paletteCss(paletteKey);
      context.fillRect(x, y, 1, 1);
    });
  });
  canvasTexture.refresh();
}

export function measurePixelText(text: string): { width: number; height: number } {
  const glyphCount = Math.max([...text].length, 1);
  return {
    width: glyphCount * (GLYPH_WIDTH + 1) + 1,
    height: GLYPH_HEIGHT + 2,
  };
}

export function bakePixelText(
  scene: Phaser.Scene,
  key: string,
  text: string,
  color: PaletteKey,
  outline: PaletteKey,
) {
  const size = measurePixelText(text);
  const canvasTexture = createCanvas(scene, key, size.width, size.height);
  const context = canvasTexture.getContext();
  const glyphMask: boolean[][] = Array.from({ length: size.height }, () =>
    new Array<boolean>(size.width).fill(false),
  );

  [...text].forEach((character, index) => {
    const glyph = getGlyph(character);
    const glyphX = 1 + index * (GLYPH_WIDTH + 1);
    glyph.forEach((row, rowIndex) => {
      for (let column = 0; column < row.length; column++) {
        if (row[column] === '#') {
          glyphMask[1 + rowIndex][glyphX + column] = true;
        }
      }
    });
  });

  context.fillStyle = paletteCss(outline);
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      if (glyphMask[y][x]) {
        continue;
      }
      const touchesGlyph = NEIGHBOUR_OFFSETS.some(([dx, dy]) => glyphMask[y + dy]?.[x + dx] === true);
      if (touchesGlyph) {
        context.fillRect(x, y, 1, 1);
      }
    }
  }

  context.fillStyle = paletteCss(color);
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      if (glyphMask[y][x]) {
        context.fillRect(x, y, 1, 1);
      }
    }
  }
  canvasTexture.refresh();
}
