import Phaser from 'phaser';
import {
  LAYOUT_UNIT,
  PET_FOLLOW_DISTANCE,
  PET_SPEED,
  PIXEL_SCALE,
  SPRITE_ATLAS,
  enemyLookFromVector,
  petFrame,
  shadowFrame,
} from '../elements';

const BODY_CENTER_HEIGHT = 7 * LAYOUT_UNIT;
const HOP_HEIGHT = 2 * LAYOUT_UNIT;
const HOP_PERIOD_MS = 90;
const TELEPORT_DISTANCE = 200 * LAYOUT_UNIT;

export class Pet {
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Image;
  x: number;
  y: number;
  private ageMs: number = 0;
  private moving: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x = x;
    this.y = y;
    this.shadow = scene.add
      .image(x, y, SPRITE_ATLAS, shadowFrame(9))
      .setScale(PIXEL_SCALE)
      .setAlpha(0.3);
    this.sprite = scene.add.image(x, y, SPRITE_ATLAS, petFrame('front')).setOrigin(0.5, 1).setScale(PIXEL_SCALE);
    this.sync();
  }

  get center(): { x: number; y: number } {
    return { x: this.x, y: this.y - BODY_CENTER_HEIGHT };
  }

  setVisible(visible: boolean) {
    this.sprite.setVisible(visible);
    this.shadow.setVisible(visible);
  }

  placeAt(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.sync();
  }

  lookAt(targetX: number, targetY: number) {
    this.face(targetX - this.x, targetY - this.y);
  }

  private face(dx: number, dy: number) {
    const look = enemyLookFromVector(dx, dy);
    this.sprite.setTexture(SPRITE_ATLAS, petFrame(look.view)).setFlipX(look.flipX);
  }

  update(deltaMs: number, ownerX: number, ownerY: number) {
    this.ageMs += deltaMs;
    const dx = ownerX - this.x;
    const dy = ownerY - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance > TELEPORT_DISTANCE) {
      this.placeAt(ownerX, ownerY);
      return;
    }
    this.moving = distance > PET_FOLLOW_DISTANCE;
    if (this.moving) {
      const step = Math.min(distance - PET_FOLLOW_DISTANCE, (PET_SPEED * deltaMs) / 1000);
      this.x += (dx / distance) * step;
      this.y += (dy / distance) * step;
      this.face(dx, dy);
    }
    this.sync();
  }

  private sync() {
    const hop = this.moving ? Math.abs(Math.sin(this.ageMs / HOP_PERIOD_MS)) * HOP_HEIGHT : 0;
    this.sprite.setPosition(this.x, this.y - hop).setDepth(this.y);
    this.shadow.setPosition(this.x, this.y).setDepth(this.y - 1);
  }
}
