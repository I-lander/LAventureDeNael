import Phaser from 'phaser';
import {
  CombatContext,
  ENEMY_BALL_SPEED,
  EnemyDef,
  EnemyLook,
  EnemyPose,
  LAYOUT_UNIT,
  PIXEL_SCALE,
  SPRITE_ATLAS,
  TEXTURE,
  enemyFrame,
  enemyLookFromVector,
  shadowFrame,
} from '../../elements';
import { Enemy, headingTo } from './Enemy';

type GolemState = 'approach' | 'casting' | 'resting';

const BODY_CENTER_HEIGHT = 14 * LAYOUT_UNIT;
const HAND_HEIGHT = 12 * LAYOUT_UNIT;
const PLAYER_AIM_HEIGHT = 11 * LAYOUT_UNIT;
const CAST_RANGE = 95 * LAYOUT_UNIT;
const WINDUP_MS = 650;
const VOLLEYS = 2;
const VOLLEY_INTERVAL_MS = 1300;
const BALLS_PER_VOLLEY = 3;
const SPREAD = 0.28;
const BALL_SPEED = ENEMY_BALL_SPEED * 0.9;
const REST_MS = 1500;
const STEP_FRAME_MS = 220;
const WINDUP_TINT = 0xffc070;

export class Golem implements Enemy {
  readonly def: EnemyDef;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly scene: Phaser.Scene;
  x: number;
  groundY: number;
  health: number;
  dead: boolean = false;
  private state: GolemState = 'approach';
  private volleysDone: number = 0;
  private nextVolleyAt: number = 0;
  private restUntil: number = 0;
  private walkMs: number = 0;
  private look: EnemyLook = { view: 'front', flipX: false };
  private pose: EnemyPose = 'idle';
  private tinted: boolean = false;

  constructor(scene: Phaser.Scene, def: EnemyDef, x: number, groundY: number) {
    this.scene = scene;
    this.def = def;
    this.x = x;
    this.groundY = groundY;
    this.health = def.hitPoints;
    this.shadow = scene.add.image(x, groundY, SPRITE_ATLAS, shadowFrame(28)).setScale(PIXEL_SCALE).setAlpha(0.3);
    this.sprite = scene.add
      .image(x, groundY, SPRITE_ATLAS, enemyFrame(def.kind, 'front', 'idle'))
      .setOrigin(0.5, 1)
      .setScale(PIXEL_SCALE);
    this.sync();
  }

  get bodyCenter(): { x: number; y: number } {
    return { x: this.x, y: this.groundY - BODY_CENTER_HEIGHT };
  }

  update(deltaMs: number, context: CombatContext) {
    const heading = headingTo(this.x, this.groundY, context.playerX, context.playerY);
    this.look = enemyLookFromVector(heading.x, heading.y);
    if (this.state === 'approach') {
      this.walkMs += deltaMs;
      const step = (this.def.speed * deltaMs) / 1000;
      this.x += heading.x * step;
      this.groundY += heading.y * step;
      this.pose = Math.floor(this.walkMs / STEP_FRAME_MS) % 2 === 0 ? 'idle' : 'squash';
      if (heading.distance <= CAST_RANGE) {
        this.state = 'casting';
        this.volleysDone = 0;
        this.nextVolleyAt = context.timeMs + WINDUP_MS;
      }
    } else if (this.state === 'casting') {
      const untilVolley = this.nextVolleyAt - context.timeMs;
      this.pose = untilVolley < WINDUP_MS ? 'attack' : 'idle';
      if (untilVolley <= 0) {
        this.castVolley(context);
        this.volleysDone += 1;
        this.nextVolleyAt = context.timeMs + VOLLEY_INTERVAL_MS;
        if (this.volleysDone >= VOLLEYS) {
          this.state = 'resting';
          this.restUntil = context.timeMs + REST_MS;
        }
      }
    } else {
      this.pose = 'idle';
      if (context.timeMs >= this.restUntil) {
        this.state = 'approach';
      }
    }
    this.sync();
  }

  private castVolley(context: CombatContext) {
    const handY = this.groundY - HAND_HEIGHT;
    const angle = Math.atan2(context.playerY - PLAYER_AIM_HEIGHT - handY, context.playerX - this.x);
    for (let i = 0; i < BALLS_PER_VOLLEY; i++) {
      const offset = (i - (BALLS_PER_VOLLEY - 1) / 2) * SPREAD;
      context.fireEnemyBall(this.x, handY, angle + offset, BALL_SPEED, TEXTURE.lavaBall);
    }
    context.shake(1);
  }

  hit(damage: number): boolean {
    this.health -= damage;
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (!this.dead && this.sprite.active) {
        this.tinted = false;
        this.sprite.clearTint();
      }
    });
    if (this.health <= 0) {
      this.dead = true;
    }
    return this.dead;
  }

  private sync() {
    const windingUp = this.state === 'casting' && this.pose === 'attack';
    if (windingUp !== this.tinted) {
      this.tinted = windingUp;
      if (windingUp) {
        this.sprite.setTint(WINDUP_TINT);
      } else {
        this.sprite.clearTint();
      }
    }
    this.sprite
      .setTexture(SPRITE_ATLAS, enemyFrame(this.def.kind, this.look.view, this.pose))
      .setFlipX(this.look.flipX)
      .setPosition(this.x, this.groundY)
      .setDepth(this.groundY);
    this.shadow.setPosition(this.x, this.groundY).setDepth(this.groundY - 1);
  }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
