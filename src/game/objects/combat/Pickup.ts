import Phaser from 'phaser';
import { LAYOUT_UNIT, PickupKind, SPRITE_ATLAS, PIXEL_SCALE, TEXTURE, shadowFrame } from '../../elements';

const TEXTURE_BY_KIND: Record<PickupKind, string> = {
  heart: TEXTURE.heartPickup,
  star: TEXTURE.powerStar,
  coin: TEXTURE.coin,
  coinStack: TEXTURE.coinStack,
};

const LIFETIME_MS = 25000;
const FADING_MS = 3000;
const POP_MS = 320;
const POP_HEIGHT = 10 * LAYOUT_UNIT;

export class Pickup {
  readonly kind: PickupKind;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Image;
  x: number;
  readonly groundY: number;
  private ageMs: number = 0;
  collected: boolean = false;

  constructor(scene: Phaser.Scene, kind: PickupKind, x: number, groundY: number) {
    this.kind = kind;
    this.x = x;
    this.groundY = groundY;
    this.shadow = scene.add
      .image(x, groundY, SPRITE_ATLAS, shadowFrame(5))
      .setScale(PIXEL_SCALE)
      .setAlpha(0.25)
      .setDepth(groundY - 1);
    this.sprite = scene.add
      .image(x, groundY, SPRITE_ATLAS, TEXTURE_BY_KIND[kind])
      .setOrigin(0.5, 1)
      .setScale(PIXEL_SCALE)
      .setDepth(groundY);
  }

  get center(): { x: number; y: number } {
    return { x: this.x, y: this.groundY - 6 * LAYOUT_UNIT };
  }

  get isGone(): boolean {
    return this.collected || this.ageMs >= LIFETIME_MS;
  }

  get canBeCollected(): boolean {
    return this.ageMs >= POP_MS;
  }

  update(deltaMs: number) {
    this.ageMs += deltaMs;
    const fading = this.ageMs > LIFETIME_MS - FADING_MS;
    this.sprite.setVisible(!fading || Math.floor(this.ageMs / 120) % 2 === 0);
    const pop = this.ageMs < POP_MS ? Math.sin((this.ageMs / POP_MS) * Math.PI) * POP_HEIGHT : 0;
    const bob = Math.round(Math.abs(Math.sin(this.ageMs / 200)) * 3) * LAYOUT_UNIT;
    const lift = Math.round((pop + bob) / PIXEL_SCALE) * PIXEL_SCALE;
    this.sprite.setPosition(this.x, this.groundY - 2 * LAYOUT_UNIT - lift);
    if (this.kind === 'star') {
      this.sprite.setAlpha(Math.floor(this.ageMs / 150) % 4 === 0 ? 0.6 : 1);
    }
    this.shadow.setPosition(this.x, this.groundY);
  }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
