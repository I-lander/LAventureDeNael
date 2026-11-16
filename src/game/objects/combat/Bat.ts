import Phaser from 'phaser';
import { BAT_FRAMES, CombatContext, EnemyDef, LAYOUT_UNIT, PIXEL_SCALE, SPRITE_ATLAS, shadowFrame } from '../../elements';
import { Enemy, headingTo } from './Enemy';

const FLIGHT_HEIGHT = 16 * LAYOUT_UNIT;
const BOB_HEIGHT = 3 * LAYOUT_UNIT;
const FLAP_MS = 120;
const SWAY = 1.1;
const SWAY_PERIOD_MS = 420;
const DASH_EVERY_MS = 2600;
const DASH_MS = 450;
const DASH_FACTOR = 2.2;

export class Bat implements Enemy {
  readonly def: EnemyDef;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly scene: Phaser.Scene;
  x: number;
  groundY: number;
  health: number;
  dead: boolean = false;
  private ageMs: number;
  private height: number = FLIGHT_HEIGHT;

  constructor(scene: Phaser.Scene, def: EnemyDef, x: number, groundY: number) {
    this.scene = scene;
    this.def = def;
    this.x = x;
    this.groundY = groundY;
    this.health = def.hitPoints;
    this.ageMs = Phaser.Math.Between(0, DASH_EVERY_MS);
    this.shadow = scene.add.image(x, groundY, SPRITE_ATLAS, shadowFrame(9)).setScale(PIXEL_SCALE).setAlpha(0.25);
    this.sprite = scene.add.image(x, groundY, SPRITE_ATLAS, BAT_FRAMES[0]).setScale(PIXEL_SCALE);
    this.sync();
  }

  get bodyCenter(): { x: number; y: number } {
    return { x: this.x, y: this.groundY - this.height };
  }

  update(deltaMs: number, context: CombatContext) {
    this.ageMs += deltaMs;
    const heading = headingTo(this.x, this.groundY, context.playerX, context.playerY);
    const dashing = this.ageMs % DASH_EVERY_MS < DASH_MS;
    const sway = dashing ? 0 : Math.sin(this.ageMs / SWAY_PERIOD_MS) * SWAY;
    const step = (this.def.speed * (dashing ? DASH_FACTOR : 1) * deltaMs) / 1000;
    this.x += (heading.x - heading.y * sway) * step;
    this.groundY += (heading.y + heading.x * sway) * step;
    this.height = FLIGHT_HEIGHT + Math.round(Math.sin(this.ageMs / 180) * (BOB_HEIGHT / PIXEL_SCALE)) * PIXEL_SCALE;
    this.sprite.setFlipX(heading.x < 0);
    this.sync();
  }

  hit(damage: number): boolean {
    this.health -= damage;
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (!this.dead && this.sprite.active) {
        this.sprite.clearTint();
      }
    });
    if (this.health <= 0) {
      this.dead = true;
    }
    return this.dead;
  }

  private sync() {
    const frame = BAT_FRAMES[Math.floor(this.ageMs / FLAP_MS) % BAT_FRAMES.length];
    this.sprite
      .setTexture(SPRITE_ATLAS, frame)
      .setPosition(this.x, this.groundY - this.height)
      .setDepth(this.groundY);
    this.shadow.setPosition(this.x, this.groundY).setDepth(this.groundY - 1);
  }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
