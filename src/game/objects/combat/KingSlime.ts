import Phaser from 'phaser';
import {
  BOSS_ENRAGE_RATIO,
  CombatContext,
  ENEMY_BALL_SPEED,
  EnemyKind,
  LAYOUT_UNIT,
  SPRITE_ATLAS,
  PIXEL_SCALE,
  TEXTURE,
} from '../../elements';
import { headingTo } from './Enemy';

type BossAction = 'entering' | 'resting' | 'spread' | 'leapRise' | 'leapFall' | 'returning' | 'summon' | 'dying';

const ACTION_CYCLE: BossAction[] = ['spread', 'leapRise', 'summon', 'spread', 'leapRise', 'spread'];
const LEAP_PEAK = 150 * LAYOUT_UNIT;
const BODY_CENTER_HEIGHT = 14 * LAYOUT_UNIT;
const BOSS_SCALE = PIXEL_SCALE;
const MOUTH_OFFSET_Y = -11 * LAYOUT_UNIT;
const ENTER_SPEED = 45 * LAYOUT_UNIT;
const LEAP_LANDING_GAP = 30 * LAYOUT_UNIT;
const SUMMON_DISTANCE = 22 * LAYOUT_UNIT;

export class KingSlime {
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly onDefeated: () => void;
  x: number;
  groundY: number;
  private height: number = 0;
  private readonly maxHealth: number;
  health: number;
  enraged: boolean = false;
  private action: BossAction = 'entering';
  private actionElapsedMs: number = 0;
  private cycleIndex: number = 0;
  private volleysLeft: number = 0;
  private nextVolleyAt: number = 0;
  private leapStart = new Phaser.Math.Vector2();
  private leapTarget = new Phaser.Math.Vector2();
  private wobbleMs: number = 0;
  private nextDeathBurstMs: number = 0;
  private readonly home: Phaser.Math.Vector2;
  private facingRight: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    groundY: number,
    homeX: number,
    homeY: number,
    maxHealth: number,
    onDefeated: () => void,
  ) {
    this.scene = scene;
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.onDefeated = onDefeated;
    this.home = new Phaser.Math.Vector2(homeX, homeY);
    this.x = x;
    this.groundY = groundY;
    this.shadow = scene.add.image(this.x, groundY, SPRITE_ATLAS, TEXTURE.shadowLarge).setScale(BOSS_SCALE).setAlpha(0.3);
    this.sprite = scene.add
      .image(this.x, groundY, SPRITE_ATLAS, TEXTURE.kingSlime)
      .setOrigin(0.5, 1)
      .setScale(BOSS_SCALE);
    this.sync();
  }

  get healthRatio(): number {
    return Math.max(0, this.health / this.maxHealth);
  }

  get bodyCenter(): { x: number; y: number } {
    return { x: this.x, y: this.groundY - BODY_CENTER_HEIGHT - this.height };
  }

  get isVulnerable(): boolean {
    return this.action !== 'dying' && this.action !== 'entering' && this.height < 40 * LAYOUT_UNIT;
  }

  get isDying(): boolean {
    return this.action === 'dying';
  }

  get isDangerous(): boolean {
    return this.action !== 'dying' && this.height < 12 * LAYOUT_UNIT;
  }

  hit(damage: number, context: CombatContext) {
    if (!this.isVulnerable) {
      return;
    }
    this.health -= damage;
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.action !== 'dying' && this.sprite.active) {
        this.sprite.clearTint();
      }
    });
    if (!this.enraged && this.healthRatio <= BOSS_ENRAGE_RATIO) {
      this.enraged = true;
      this.sprite.setTexture(SPRITE_ATLAS, TEXTURE.kingSlimeAngry);
      context.shake(2);
    }
    if (this.health <= 0) {
      this.startDying(context);
    }
  }

  get isDestroyed(): boolean {
    return !this.sprite.active;
  }

  update(deltaMs: number, context: CombatContext) {
    if (!this.sprite.active) {
      return;
    }
    this.actionElapsedMs += deltaMs;
    this.wobbleMs += deltaMs;
    const seconds = deltaMs / 1000;
    if (this.action !== 'dying' && this.height === 0) {
      this.facingRight = context.playerX > this.x;
    }

    switch (this.action) {
      case 'entering': {
        const heading = headingTo(this.x, this.groundY, this.home.x, this.home.y);
        const step = ENTER_SPEED * seconds;
        this.height = Math.abs(Math.sin(this.wobbleMs / 260)) * 10 * LAYOUT_UNIT;
        if (heading.distance <= step) {
          this.x = this.home.x;
          this.groundY = this.home.y;
          this.height = 0;
          context.shake(2);
          this.setAction('resting');
        } else {
          this.x += heading.x * step;
          this.groundY += heading.y * step;
        }
        break;
      }
      case 'resting':
        if (this.actionElapsedMs >= (this.enraged ? 550 : 1000)) {
          this.setAction(ACTION_CYCLE[this.cycleIndex % ACTION_CYCLE.length]);
          this.cycleIndex += 1;
          this.prepareAction(context);
        }
        break;
      case 'spread':
        this.updateSpread(context);
        break;
      case 'leapRise':
        this.updateLeapRise(context);
        break;
      case 'leapFall':
        this.updateLeapFall(context);
        break;
      case 'returning':
        this.updateReturning();
        break;
      case 'summon':
        this.updateSummon(context);
        break;
      case 'dying':
        this.updateDying(context);
        break;
    }
    if (this.sprite.active) {
      this.sync();
    }
  }

  private setAction(action: BossAction) {
    this.action = action;
    this.actionElapsedMs = 0;
  }

  private prepareAction(context: CombatContext) {
    if (this.action === 'spread') {
      this.volleysLeft = this.enraged ? 3 : 2;
      this.nextVolleyAt = context.timeMs + 550;
    }
    if (this.action === 'leapRise') {
      this.leapStart.set(this.x, this.groundY);
      this.aimLeap(context);
    }
  }

  private aimLeap(context: CombatContext) {
    const heading = headingTo(context.playerX, context.playerY, this.x, this.groundY);
    this.leapTarget.set(
      context.playerX + heading.x * LEAP_LANDING_GAP,
      context.playerY + heading.y * LEAP_LANDING_GAP,
    );
  }

  private get mouth(): { x: number; y: number } {
    return {
      x: this.x,
      y: this.groundY + MOUTH_OFFSET_Y,
    };
  }

  private updateSpread(context: CombatContext) {
    const untilVolley = this.nextVolleyAt - context.timeMs;
    this.squash(untilVolley < 300 ? 0.82 : 1);
    if (untilVolley > 0) {
      return;
    }
    const mouthX = this.mouth.x;
    const mouthY = this.mouth.y;
    const aim = Math.atan2(context.playerY - 11 * LAYOUT_UNIT - mouthY, context.playerX - mouthX);
    const ballCount = this.enraged ? 9 : 7;
    const fan = this.enraged ? 1.4 : 1.1;
    for (let i = 0; i < ballCount; i++) {
      const offset = (i / (ballCount - 1) - 0.5) * fan;
      context.fireEnemyBall(mouthX, mouthY, aim + offset, ENEMY_BALL_SPEED * 0.9, TEXTURE.slimeBall);
    }
    this.volleysLeft -= 1;
    this.nextVolleyAt = context.timeMs + (this.enraged ? 550 : 750);
    if (this.volleysLeft <= 0) {
      this.squash(1);
      this.setAction('resting');
    }
  }

  private updateLeapRise(context: CombatContext) {
    const crouchMs = 350;
    const riseMs = 650;
    if (this.actionElapsedMs < crouchMs) {
      this.squash(0.75);
      return;
    }
    this.squash(1.15);
    const progress = Math.min(1, (this.actionElapsedMs - crouchMs) / riseMs);
    const eased = Phaser.Math.Easing.Quadratic.Out(progress);
    this.height = eased * LEAP_PEAK;
    this.x = Phaser.Math.Linear(this.leapStart.x, this.leapTarget.x, progress * 0.5);
    this.groundY = Phaser.Math.Linear(this.leapStart.y, this.leapTarget.y, progress * 0.5);
    if (progress >= 1) {
      this.leapStart.set(this.x, this.groundY);
      this.setAction('leapFall');
      if (this.enraged) {
        this.aimLeap(context);
      }
    }
  }

  private updateLeapFall(context: CombatContext) {
    const hangMs = 250;
    const fallMs = 320;
    if (this.actionElapsedMs < hangMs) {
      const hangProgress = this.actionElapsedMs / hangMs;
      this.x = Phaser.Math.Linear(this.leapStart.x, this.leapTarget.x, hangProgress);
      this.groundY = Phaser.Math.Linear(this.leapStart.y, this.leapTarget.y, hangProgress);
      return;
    }
    const progress = Math.min(1, (this.actionElapsedMs - hangMs) / fallMs);
    this.x = this.leapTarget.x;
    this.groundY = this.leapTarget.y;
    this.height = (1 - Phaser.Math.Easing.Quadratic.In(progress)) * LEAP_PEAK;
    if (progress >= 1) {
      this.height = 0;
      this.squash(0.7);
      context.shake(4);
      context.burstGoo(this.x, this.groundY - 4 * LAYOUT_UNIT, this.groundY, TEXTURE.greenGoo, 14);
      const ringCount = this.enraged ? 14 : 10;
      for (let i = 0; i < ringCount; i++) {
        const angle = (i / ringCount) * Math.PI * 2;
        context.fireEnemyBall(
          this.x,
          this.groundY - 8 * LAYOUT_UNIT,
          angle,
          ENEMY_BALL_SPEED * 0.7,
          TEXTURE.slimeBall,
        );
      }
      this.leapStart.set(this.x, this.groundY);
      this.setAction('returning');
    }
  }

  private updateReturning() {
    const pauseMs = 450;
    if (this.actionElapsedMs < pauseMs) {
      this.squash(Phaser.Math.Linear(0.7, 1, this.actionElapsedMs / pauseMs));
      return;
    }
    this.squash(1);
    this.setAction('resting');
  }

  private updateSummon(context: CombatContext) {
    if (this.actionElapsedMs < 500) {
      this.squash(1 + Math.sin(this.actionElapsedMs / 40) * 0.08);
      return;
    }
    this.squash(1);
    const kinds: EnemyKind[] = this.enraged
      ? ['greenSlime', 'blueSlime', 'greenSlime', 'blueSlime']
      : ['greenSlime', 'greenSlime', 'greenSlime'];
    const side = this.facingRight ? 1 : -1;
    kinds.forEach((kind, index) => {
      const spread = (index / (kinds.length - 1) - 0.5) * 60 * LAYOUT_UNIT;
      context.spawnEnemy(kind, this.x + side * SUMMON_DISTANCE, this.groundY + spread);
    });
    context.burstGoo(
      this.x + side * 14 * LAYOUT_UNIT,
      this.groundY - 10 * LAYOUT_UNIT,
      this.groundY,
      TEXTURE.greenGoo,
      8,
    );
    this.setAction('resting');
  }

  private startDying(context: CombatContext) {
    this.health = 0;
    this.height = 0;
    this.setAction('dying');
    this.nextDeathBurstMs = 0;
    this.sprite.setTintFill(0xffffff);
    context.shake(5);
  }

  private updateDying(context: CombatContext) {
    const duration = 1800;
    const progress = Math.min(1, this.actionElapsedMs / duration);
    if (this.actionElapsedMs >= this.nextDeathBurstMs) {
      this.nextDeathBurstMs += 120;
      context.burstGoo(
        this.x + Phaser.Math.Between(-16, 16) * LAYOUT_UNIT,
        this.groundY - Phaser.Math.Between(4, 26) * LAYOUT_UNIT,
        this.groundY,
        TEXTURE.greenGoo,
        5,
      );
      context.shake(1);
    }
    if (Math.floor(this.actionElapsedMs / 90) % 2 === 0) {
      this.sprite.setTintFill(0xffffff);
    } else {
      this.sprite.clearTint();
    }
    this.sprite.setScale(BOSS_SCALE * (1 + progress * 0.3), BOSS_SCALE * (1 - progress * 0.9));
    this.sprite.setAlpha(1 - progress * 0.6);
    if (progress >= 1) {
      context.burstGoo(this.x, this.groundY - 10 * LAYOUT_UNIT, this.groundY, TEXTURE.greenGoo, 40);
      this.destroy();
      this.onDefeated();
    }
  }

  private squash(amount: number) {
    if (this.action === 'dying') {
      return;
    }
    this.sprite.setScale(BOSS_SCALE * (2 - amount) ** 0.5, BOSS_SCALE * amount);
  }

  private sync() {
    if (this.action === 'resting' || this.action === 'entering') {
      const breath = 1 + Math.sin(this.wobbleMs / 220) * 0.04;
      this.squash(breath);
    }
    this.sprite
      .setPosition(this.x, this.groundY - this.height)
      .setDepth(this.groundY);
    const lift = Math.min(1, this.height / LEAP_PEAK);
    this.shadow
      .setPosition(this.x, this.groundY)
      .setScale(BOSS_SCALE * (1 - lift * 0.5), BOSS_SCALE * (1 - lift * 0.5))
      .setAlpha(0.3 - lift * 0.1)
      .setDepth(this.groundY - 1);
  }

  destroy() {
    if (this.sprite.active) {
      this.sprite.destroy();
      this.shadow.destroy();
    }
  }
}
