import Phaser from 'phaser';
import {
  CombatContext,
  ENEMY_BALL_SPEED,
  EnemyDef,
  EnemyLook,
  EnemyPose,
  LAYOUT_UNIT,
  SPRITE_ATLAS,
  PIXEL_SCALE,
  TEXTURE,
  enemyFrame,
  enemyLookFromVector,
  shadowFrame,
} from '../../elements';
import { Enemy, Heading, headingTo } from './Enemy';

type TurretState = 'approach' | 'shooting' | 'strafing';

const HOP_HEIGHT = 7 * LAYOUT_UNIT;
const BODY_CENTER_HEIGHT = 9 * LAYOUT_UNIT;
const PLAYER_AIM_HEIGHT = 11 * LAYOUT_UNIT;
const MOUTH_OFFSET = { x: 8 * LAYOUT_UNIT, y: -7 * LAYOUT_UNIT };
const MUSHROOM_CENTER_HEIGHT = 12 * LAYOUT_UNIT;
const SPORE_COUNT = 6;
const SPORE_SPEED = ENEMY_BALL_SPEED * 0.85;
const SPORE_VOLLEYS = 2;
const WINDUP_MS = 350;
const WINDUP_TINT = 0xffe08a;
const WAVE_SWAY = 0.9;
const WAVE_PERIOD_MS = 380;
const TURRET_RANGE = 85 * LAYOUT_UNIT;
const TURRET_SHOTS = 3;
const TURRET_SHOT_INTERVAL_MS = 1500;
const TURRET_STRAFE_MS = 1800;

export class Slime implements Enemy {
  readonly def: EnemyDef;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly scene: Phaser.Scene;
  x: number;
  groundY: number;
  private hopHeight: number = 0;
  private hopPhase: number;
  private ageMs: number = 0;
  health: number;
  dead: boolean = false;
  private look: EnemyLook = { view: 'front', flipX: false };
  private windingUp: boolean = false;
  private tinted: boolean = false;
  private turretState: TurretState = 'approach';
  private shotsFired: number = 0;
  private nextShotAt: number = 0;
  private strafeUntil: number = 0;
  private strafeSide: number = 1;

  constructor(scene: Phaser.Scene, def: EnemyDef, x: number, groundY: number) {
    this.scene = scene;
    this.def = def;
    this.x = x;
    this.groundY = groundY;
    this.health = def.hitPoints;
    this.hopPhase = Phaser.Math.FloatBetween(0, Math.PI);
    this.shadow = scene.add.image(x, groundY, SPRITE_ATLAS, shadowFrame(20)).setScale(PIXEL_SCALE).setAlpha(0.3);
    this.sprite = scene.add
      .image(x, groundY, SPRITE_ATLAS, enemyFrame(def.kind, 'front', 'idle'))
      .setOrigin(0.5, 1)
      .setScale(PIXEL_SCALE);
    this.syncSprites();
  }

  get bodyCenter(): { x: number; y: number } {
    const height = this.isSpore ? MUSHROOM_CENTER_HEIGHT : BODY_CENTER_HEIGHT;
    return { x: this.x, y: this.groundY - height - this.hopHeight };
  }

  private get isSpore(): boolean {
    return this.def.movement === 'spore';
  }

  update(deltaMs: number, context: CombatContext) {
    const seconds = deltaMs / 1000;
    this.ageMs += deltaMs;
    const heading = headingTo(this.x, this.groundY, context.playerX, context.playerY);
    this.look = enemyLookFromVector(heading.x, heading.y);
    this.windingUp = false;

    if (this.def.movement === 'hop') {
      this.hopPhase += seconds * 5.5;
      const airborne = Math.sin(this.hopPhase) > 0;
      this.hopHeight = airborne ? Math.sin(this.hopPhase) * HOP_HEIGHT : 0;
      this.advance(heading, (airborne ? this.def.speed * 1.5 : this.def.speed * 0.15) * seconds);
    } else if (this.def.movement === 'wave') {
      this.hopPhase += seconds * 11;
      this.hopHeight = Math.abs(Math.sin(this.hopPhase)) * 3 * LAYOUT_UNIT;
      const sway = Math.cos(this.ageMs / WAVE_PERIOD_MS) * WAVE_SWAY;
      const step = this.def.speed * seconds;
      this.x += (heading.x - heading.y * sway) * step;
      this.groundY += (heading.y + heading.x * sway) * step;
    } else {
      this.updateTurret(seconds, heading, context);
    }

    this.syncSprites();
  }

  private advance(heading: Heading, step: number) {
    this.x += heading.x * step;
    this.groundY += heading.y * step;
  }

  private hop(seconds: number, heightFactor: number): boolean {
    this.hopPhase += seconds * 6;
    const airborne = Math.sin(this.hopPhase) > 0;
    this.hopHeight = airborne ? Math.sin(this.hopPhase) * HOP_HEIGHT * heightFactor : 0;
    return airborne;
  }

  private updateTurret(seconds: number, heading: Heading, context: CombatContext) {
    if (this.turretState === 'approach') {
      const airborne = this.hop(seconds, 0.7);
      this.advance(heading, this.def.speed * seconds * (airborne ? 1.4 : 0.2));
      if (heading.distance <= TURRET_RANGE) {
        this.turretState = 'shooting';
        this.shotsFired = 0;
        this.nextShotAt = context.timeMs + 600;
      }
      return;
    }
    if (this.turretState === 'shooting') {
      this.hopHeight = 0;
      const untilShot = this.nextShotAt - context.timeMs;
      this.windingUp = untilShot < WINDUP_MS;
      if (untilShot <= 0) {
        const sideShift = this.look.view === 'side' ? MOUTH_OFFSET.x : 0;
        const mouthX = this.x + (this.look.flipX ? -sideShift : sideShift);
        const mouthY = this.groundY + MOUTH_OFFSET.y;
        const angle = Math.atan2(context.playerY - PLAYER_AIM_HEIGHT - mouthY, context.playerX - mouthX);
        if (this.isSpore) {
          const capY = this.groundY - MUSHROOM_CENTER_HEIGHT;
          for (let i = 0; i < SPORE_COUNT; i++) {
            const sporeAngle = angle + (i * Math.PI * 2) / SPORE_COUNT + (this.shotsFired * Math.PI) / SPORE_COUNT;
            context.fireEnemyBall(this.x, capY, sporeAngle, SPORE_SPEED, TEXTURE.spore);
          }
        } else {
          context.fireEnemyBall(mouthX, mouthY, angle, ENEMY_BALL_SPEED, TEXTURE.redBall);
        }
        this.shotsFired += 1;
        this.nextShotAt = context.timeMs + TURRET_SHOT_INTERVAL_MS;
        if (this.shotsFired >= (this.isSpore ? SPORE_VOLLEYS : TURRET_SHOTS)) {
          this.turretState = 'strafing';
          this.strafeUntil = context.timeMs + TURRET_STRAFE_MS;
          this.strafeSide = Math.random() < 0.5 ? -1 : 1;
        }
      }
      return;
    }
    const airborne = this.hop(seconds, 1);
    const step = this.def.speed * seconds * (airborne ? 1.4 : 0.2);
    this.x += -heading.y * this.strafeSide * step;
    this.groundY += heading.x * this.strafeSide * step;
    if (context.timeMs >= this.strafeUntil) {
      this.turretState = 'approach';
    }
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

  private syncSprites() {
    if (this.windingUp !== this.tinted) {
      this.tinted = this.windingUp;
      if (this.tinted) {
        this.sprite.setTint(WINDUP_TINT);
      } else {
        this.sprite.clearTint();
      }
    }
    const shooting = (this.def.movement === 'turret' || this.isSpore) && this.turretState === 'shooting';
    const grounded = this.hopHeight < LAYOUT_UNIT * 0.6;
    const pose: EnemyPose = shooting ? (this.windingUp ? 'attack' : 'idle') : grounded ? 'squash' : 'idle';
    this.sprite
      .setTexture(SPRITE_ATLAS, enemyFrame(this.def.kind, this.look.view, pose))
      .setFlipX(this.look.flipX)
      .setPosition(this.x, this.groundY - this.hopHeight)
      .setDepth(this.groundY);
    this.shadow
      .setTexture(SPRITE_ATLAS, shadowFrame(this.hopHeight > HOP_HEIGHT * 0.5 ? 15 : 20))
      .setPosition(this.x, this.groundY)
      .setDepth(this.groundY - 1);
  }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
