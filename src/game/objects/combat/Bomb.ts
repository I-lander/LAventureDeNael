import Phaser from 'phaser';
import { PIXEL_SCALE, SPRITE_ATLAS, TEXTURE } from '../../elements';

export type BombOwner = 'enemy' | 'player';

export interface BombLaunch {
  owner: BombOwner;
  startX: number;
  startY: number;
  targetX: number;
  targetGroundY: number;
  durationMs: number;
  arcHeight: number;
}

const SPIN_DEGREES_PER_SECOND = 360;
const MARKER_BLINK_MS = 120;

export class Bomb {
  readonly owner: BombOwner;
  readonly targetX: number;
  readonly targetGroundY: number;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly marker: Phaser.GameObjects.Image | null;
  private readonly launch: BombLaunch;
  private elapsedMs: number = 0;
  landed: boolean = false;

  constructor(scene: Phaser.Scene, launch: BombLaunch) {
    this.launch = launch;
    this.owner = launch.owner;
    this.targetX = launch.targetX;
    this.targetGroundY = launch.targetGroundY;
    this.sprite = scene.add
      .image(launch.startX, launch.startY, SPRITE_ATLAS, TEXTURE.bomb)
      .setScale(PIXEL_SCALE)
      .setDepth(launch.targetGroundY + 1);
    this.marker =
      launch.owner === 'enemy'
        ? scene.add
            .image(launch.targetX, launch.targetGroundY, SPRITE_ATLAS, TEXTURE.bombTarget)
            .setScale(PIXEL_SCALE)
            .setDepth(launch.targetGroundY - 2)
        : null;
  }

  update(deltaMs: number) {
    if (this.landed) {
      return;
    }
    this.elapsedMs += deltaMs;
    const progress = Math.min(1, this.elapsedMs / this.launch.durationMs);
    const x = Phaser.Math.Linear(this.launch.startX, this.launch.targetX, progress);
    const baseY = Phaser.Math.Linear(this.launch.startY, this.launch.targetGroundY, progress);
    const lift = this.launch.arcHeight * 4 * progress * (1 - progress);
    this.sprite.setPosition(x, baseY - lift);
    this.sprite.angle += (SPIN_DEGREES_PER_SECOND * deltaMs) / 1000;
    this.marker?.setAlpha(Math.floor(this.elapsedMs / MARKER_BLINK_MS) % 2 === 0 ? 1 : 0.35);
    if (progress >= 1) {
      this.landed = true;
    }
  }

  destroy() {
    this.sprite.destroy();
    this.marker?.destroy();
  }
}
