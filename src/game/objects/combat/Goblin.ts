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

type GoblinState = 'approach' | 'attacking' | 'retreating';

const WALK_FRAME_MS = 140;
const BODY_CENTER_HEIGHT = 12 * LAYOUT_UNIT;
const PLAYER_AIM_HEIGHT = 11 * LAYOUT_UNIT;
const WINDUP_MS = 380;
const FIRST_ATTACK_DELAY_MS = 500;
const ARCHER_RANGE = 95 * LAYOUT_UNIT;
const ARCHER_SHOTS = 3;
const ARCHER_SHOT_INTERVAL_MS = 1300;
const ARROW_SPEED = ENEMY_BALL_SPEED * 1.7;
const BOMBER_RANGE = 75 * LAYOUT_UNIT;
const BOMBER_THROWS = 2;
const BOMBER_THROW_INTERVAL_MS = 1800;
const THROWER_RANGE = 90 * LAYOUT_UNIT;
const THROWER_SHOTS = 2;
const THROWER_SHOT_INTERVAL_MS = 1100;
const BONE_SPEED = ENEMY_BALL_SPEED * 1.3;
const RETREAT_MS = 1600;
const RETREAT_SPEED_FACTOR = 1.3;
const ARROW_OFFSET = { x: 9 * LAYOUT_UNIT, y: -10 * LAYOUT_UNIT };
const BOMB_HAND_OFFSET = { x: -9 * LAYOUT_UNIT, y: -24 * LAYOUT_UNIT };
const WINDUP_TINT = 0xff9a9a;

export class Goblin implements Enemy {
  readonly def: EnemyDef;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly scene: Phaser.Scene;
  x: number;
  groundY: number;
  health: number;
  dead: boolean = false;
  private state: GoblinState = 'approach';
  private attacksDone: number = 0;
  private nextAttackAt: number = 0;
  private retreatUntil: number = 0;
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
    this.shadow = scene.add.image(x, groundY, SPRITE_ATLAS, shadowFrame(15)).setScale(PIXEL_SCALE).setAlpha(0.3);
    this.sprite = scene.add
      .image(x, groundY, SPRITE_ATLAS, enemyFrame(def.kind, 'front', 'idle'))
      .setOrigin(0.5, 1)
      .setScale(PIXEL_SCALE);
    this.syncSprites();
  }

  get bodyCenter(): { x: number; y: number } {
    return { x: this.x, y: this.groundY - BODY_CENTER_HEIGHT };
  }

  private get isArcher(): boolean {
    return this.def.movement === 'archer';
  }

  private get isThrower(): boolean {
    return this.def.movement === 'thrower';
  }

  private get attackRange(): number {
    if (this.isThrower) {
      return THROWER_RANGE;
    }
    return this.isArcher ? ARCHER_RANGE : BOMBER_RANGE;
  }

  private get attackCount(): number {
    if (this.isThrower) {
      return THROWER_SHOTS;
    }
    return this.isArcher ? ARCHER_SHOTS : BOMBER_THROWS;
  }

  private get attackIntervalMs(): number {
    if (this.isThrower) {
      return THROWER_SHOT_INTERVAL_MS;
    }
    return this.isArcher ? ARCHER_SHOT_INTERVAL_MS : BOMBER_THROW_INTERVAL_MS;
  }

  update(deltaMs: number, context: CombatContext) {
    const heading = headingTo(this.x, this.groundY, context.playerX, context.playerY);
    this.look = enemyLookFromVector(heading.x, heading.y);
    if (this.state === 'approach') {
      this.walk(deltaMs, heading.x, heading.y, this.def.speed);
      if (heading.distance <= this.attackRange) {
        this.state = 'attacking';
        this.attacksDone = 0;
        this.nextAttackAt = context.timeMs + FIRST_ATTACK_DELAY_MS;
      }
    } else if (this.state === 'attacking') {
      this.updateAttacking(context);
    } else {
      this.walk(deltaMs, -heading.x, -heading.y, this.def.speed * RETREAT_SPEED_FACTOR);
      if (context.timeMs >= this.retreatUntil) {
        this.state = 'approach';
      }
    }
    this.syncSprites();
  }

  private walk(deltaMs: number, directionX: number, directionY: number, speed: number) {
    this.walkMs += deltaMs;
    const step = (speed * deltaMs) / 1000;
    this.x += directionX * step;
    this.groundY += directionY * step;
    const stepIndex = Math.floor(this.walkMs / WALK_FRAME_MS) % 2;
    this.pose = stepIndex === 0 ? 'idle' : 'squash';
  }

  private updateAttacking(context: CombatContext) {
    const untilAttack = this.nextAttackAt - context.timeMs;
    this.pose = untilAttack < WINDUP_MS ? 'attack' : 'idle';
    if (untilAttack > 0) {
      return;
    }
    if (this.isArcher) {
      this.shootArrow(context, TEXTURE.arrow, ARROW_SPEED);
    } else if (this.isThrower) {
      this.shootArrow(context, TEXTURE.bone, BONE_SPEED);
    } else {
      this.throwBomb(context);
    }
    this.attacksDone += 1;
    this.nextAttackAt = context.timeMs + this.attackIntervalMs;
    if (this.attacksDone >= this.attackCount) {
      this.state = 'retreating';
      this.retreatUntil = context.timeMs + RETREAT_MS;
    }
  }

  private shootArrow(context: CombatContext, texture: string, speed: number) {
    const sideShift = this.look.view === 'side' ? ARROW_OFFSET.x : 0;
    const arrowX = this.x + (this.look.flipX ? -sideShift : sideShift);
    const arrowY = this.groundY + ARROW_OFFSET.y;
    const angle = Math.atan2(context.playerY - PLAYER_AIM_HEIGHT - arrowY, context.playerX - arrowX);
    context.fireEnemyBall(arrowX, arrowY, angle, speed, texture);
  }

  private throwBomb(context: CombatContext) {
    context.throwBomb(
      this.x + BOMB_HAND_OFFSET.x,
      this.groundY + BOMB_HAND_OFFSET.y,
      context.playerX,
      context.playerY,
    );
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

  private syncSprites() {
    const windingUp = this.state === 'attacking' && this.pose === 'attack';
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
      .setFlipX(this.def.movement !== 'bomber' && this.look.flipX)
      .setPosition(this.x, this.groundY)
      .setDepth(this.groundY);
    this.shadow.setPosition(this.x, this.groundY).setDepth(this.groundY - 1);
  }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
