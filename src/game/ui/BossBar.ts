import Phaser from 'phaser';
import { PALETTE, UI_SCALE } from '../elements';
import { PixelText } from './PixelText';

const BAR_PIXEL_WIDTH = 240;
const BAR_PIXEL_HEIGHT = 10;

export class BossBar extends Phaser.GameObjects.Container {
  private readonly fill: Phaser.GameObjects.Graphics;
  private displayedRatio: number = -1;
  private enraged: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    const frame = scene.add.graphics();
    const width = BAR_PIXEL_WIDTH * UI_SCALE;
    const height = BAR_PIXEL_HEIGHT * UI_SCALE;
    frame.fillStyle(PALETTE.ink, 1);
    frame.fillRect(-width / 2 - UI_SCALE, -UI_SCALE, width + 2 * UI_SCALE, height + 2 * UI_SCALE);
    frame.fillStyle(PALETTE.redDeep, 1);
    frame.fillRect(-width / 2, 0, width, height);
    this.fill = scene.add.graphics();
    const label = new PixelText(scene, 0, -12 * UI_SCALE, 'ROI SLIME', {
      color: 'goldLight',
      outline: 'ink',
    });
    this.add([frame, this.fill, label]);
    scene.add.existing(this);
  }

  setRatio(ratio: number, enraged: boolean) {
    if (ratio === this.displayedRatio && enraged === this.enraged) {
      return;
    }
    this.displayedRatio = ratio;
    this.enraged = enraged;
    const width = BAR_PIXEL_WIDTH * UI_SCALE;
    const height = BAR_PIXEL_HEIGHT * UI_SCALE;
    const filledPixels = Math.ceil(BAR_PIXEL_WIDTH * ratio);
    this.fill.clear();
    this.fill.fillStyle(enraged ? PALETTE.redLight : PALETTE.greenLight, 1);
    this.fill.fillRect(-width / 2, 0, filledPixels * UI_SCALE, height);
    this.fill.fillStyle(enraged ? PALETTE.pink : PALETTE.greenPale, 1);
    this.fill.fillRect(-width / 2, 0, filledPixels * UI_SCALE, UI_SCALE);
    this.fill.fillStyle(enraged ? PALETTE.red : PALETTE.green, 1);
    this.fill.fillRect(-width / 2, height - UI_SCALE, filledPixels * UI_SCALE, UI_SCALE);
  }
}
