import Phaser from 'phaser';
import { UI_SCALE, PaletteKey } from '../elements';
import { bakePixelText } from '../utils/pixelArt';

let pixelTextCounter = 0;

export interface PixelTextStyle {
  color: PaletteKey;
  outline: PaletteKey;
  scale?: number;
}

export class PixelText extends Phaser.GameObjects.Image {
  private readonly baseKey: string;
  private currentText: string = '';
  private revision: number = 0;
  private readonly style: PixelTextStyle;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, style: PixelTextStyle) {
    pixelTextCounter += 1;
    const baseKey = `pixel-text-${pixelTextCounter}`;
    bakePixelText(scene, `${baseKey}-0`, text, style.color, style.outline);
    super(scene, x, y, `${baseKey}-0`);
    this.baseKey = baseKey;
    this.style = style;
    this.currentText = text;
    this.setScale(style.scale ?? UI_SCALE);
    scene.add.existing(this);
  }

  setText(text: string): this {
    if (text === this.currentText) {
      return this;
    }
    const previousKey = `${this.baseKey}-${this.revision}`;
    this.revision += 1;
    const nextKey = `${this.baseKey}-${this.revision}`;
    bakePixelText(this.scene, nextKey, text, this.style.color, this.style.outline);
    this.setTexture(nextKey);
    this.scene.textures.remove(previousKey);
    this.currentText = text;
    return this;
  }

  destroy(fromScene?: boolean) {
    const key = `${this.baseKey}-${this.revision}`;
    const textures = this.scene?.textures;
    super.destroy(fromScene);
    textures?.remove(key);
  }
}
