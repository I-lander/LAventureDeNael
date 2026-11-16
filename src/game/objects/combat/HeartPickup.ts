import Phaser from 'phaser';
import { DESPAWN_LEFT, LAYOUT_UNIT, SPRITE_ATLAS, PIXEL_SCALE, TEXTURE } from '../../elements';

export class HeartPickup {
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Image;
  x: number;
  readonly groundY: number;
  private ageMs: number = 0;
  collected: boolean = false;

  constructor(scene: Phaser.Scene, x: number, groundY: number) {
    this.x = x;
    this.groundY = groundY;
    this.shadow = scene.add
      .image(x, groundY, SPRITE_ATLAS, TEXTURE.shadowSmall)
      .setScale(PIXEL_SCALE * 0.6, PIXEL_SCALE)
      .setAlpha(0.25)
      .setDepth(groundY - 1);
    this.sprite = scene.add
      .image(x, groundY, SPRITE_ATLAS, TEXTURE.heartPickup)
      .setOrigin(0.5, 1)
      .setScale(PIXEL_SCALE)
      .setDepth(groundY);
  }

  get center(): { x: number; y: number } {
    return { x: this.x, y: this.groundY - 6 * LAYOUT_UNIT };
  }

  get isGone(): boolean {
    return this.collected || this.x < DESPAWN_LEFT;
  }

  update(deltaMs: number, scrollSpeed: number) {
    this.ageMs += deltaMs;
    this.x -= (scrollSpeed * deltaMs) / 1000;
    const bob = Math.round(Math.abs(Math.sin(this.ageMs / 200)) * 3) * LAYOUT_UNIT;
    this.sprite.setPosition(this.x, this.groundY - 2 * LAYOUT_UNIT - bob);
    this.shadow.setPosition(this.x, this.groundY);
  }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
