import Phaser from 'phaser';
import {
  DIRECTION_ART,
  Direction8,
  LAYOUT_UNIT,
  PIXEL_SCALE,
  PLAYER_INVULNERABLE_MS,
  PLAYER_MAX_HEALTH,
  PLAYER_MUZZLE_DISTANCE,
  SPRITE_ATLAS,
  TEXTURE,
  directionFromVector,
  playerFrame,
  playerWalkAnimation,
  shadowFrame,
} from '../elements';
import { GameState } from './staticClasses/GameState';

const BODY_CENTER_HEIGHT = 11 * LAYOUT_UNIT;
const HAND_HEIGHT = 7 * LAYOUT_UNIT;
const WEAPON_HOLD_DISTANCE = 3 * LAYOUT_UNIT;
const WEAPON_GRIP_ORIGIN = { x: 0.2, y: 0.7 };

export class Player {
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly muzzleFlash: Phaser.GameObjects.Image;
  private readonly weapon: Phaser.GameObjects.Image;
  private readonly shieldBubble: Phaser.GameObjects.Image;
  private readonly scene: Phaser.Scene;
  health: number = PLAYER_MAX_HEALTH;
  maxHealth: number = PLAYER_MAX_HEALTH;
  facing: Direction8 = 'east';
  aimAngle: number = 0;
  isDown: boolean = false;
  private moving: boolean = false;
  private invulnerableUntil: number = 0;
  private muzzleFlashUntil: number = 0;
  private shieldUntil: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.shadow = scene.add.image(x, y, SPRITE_ATLAS, shadowFrame(15)).setScale(PIXEL_SCALE).setAlpha(0.3);
    this.shieldBubble = scene.add
      .image(x, y, SPRITE_ATLAS, TEXTURE.shieldBubble)
      .setScale(PIXEL_SCALE)
      .setVisible(false);
    this.sprite = scene.add
      .sprite(x, y, SPRITE_ATLAS, playerFrame(DIRECTION_ART[this.facing].art, 'a'))
      .setOrigin(0.5, 1)
      .setScale(PIXEL_SCALE);
    this.weapon = scene.add
      .image(x, y, SPRITE_ATLAS, TEXTURE.weaponPistol)
      .setOrigin(WEAPON_GRIP_ORIGIN.x, WEAPON_GRIP_ORIGIN.y)
      .setScale(PIXEL_SCALE);
    this.muzzleFlash = scene.add
      .image(x, y, SPRITE_ATLAS, TEXTURE.muzzleFlash)
      .setOrigin(0, 0.5)
      .setScale(PIXEL_SCALE)
      .setVisible(false);
    this.applyPose();
    this.syncAttachments();
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  get hitCenter(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y - BODY_CENTER_HEIGHT };
  }

  get muzzlePoint(): { x: number; y: number } {
    const center = this.hitCenter;
    return {
      x: center.x + Math.cos(this.aimAngle) * PLAYER_MUZZLE_DISTANCE,
      y: center.y + Math.sin(this.aimAngle) * PLAYER_MUZZLE_DISTANCE,
    };
  }

  reset(x: number, y: number, health: number, maxHealth: number) {
    this.maxHealth = maxHealth;
    this.health = Phaser.Math.Clamp(health, 1, maxHealth);
    this.invulnerableUntil = 0;
    this.muzzleFlashUntil = 0;
    this.shieldUntil = 0;
    this.shieldBubble.setVisible(false);
    this.isDown = false;
    this.moving = false;
    this.facing = 'south';
    this.aimAngle = Math.PI / 2;
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.setAngle(0).setAlpha(1).setVisible(true).clearTint();
    this.weapon.setVisible(true).setAlpha(1);
    this.applyPose();
    this.moveTo(x, y);
  }

  moveTo(x: number, y: number) {
    this.sprite.setPosition(x, y);
    this.syncAttachments();
  }

  setMotion(moving: boolean, lookX: number, lookY: number) {
    const facing = lookX === 0 && lookY === 0 ? this.facing : directionFromVector(lookX, lookY);
    if (lookX !== 0 || lookY !== 0) {
      this.aimAngle = Math.atan2(lookY, lookX);
    }
    if (facing === this.facing && moving === this.moving) {
      return;
    }
    this.facing = facing;
    this.moving = moving;
    this.applyPose();
  }

  private applyPose() {
    const pose = DIRECTION_ART[this.facing];
    this.sprite.setFlipX(pose.flipX);
    if (this.moving) {
      this.sprite.play(playerWalkAnimation(pose.art), true);
    } else {
      this.sprite.stop();
      this.sprite.setTexture(SPRITE_ATLAS, playerFrame(pose.art, 'a'));
    }
  }

  flashMuzzle(timeMs: number) {
    this.muzzleFlashUntil = timeMs + 50;
  }

  activateShield(timeMs: number, durationMs: number) {
    this.shieldUntil = Math.max(this.shieldUntil, timeMs) + durationMs;
  }

  isShielded(timeMs: number): boolean {
    return !this.isDown && timeMs < this.shieldUntil;
  }

  isInvulnerable(timeMs: number): boolean {
    return this.isDown || timeMs < this.invulnerableUntil || this.isShielded(timeMs);
  }

  takeHit(timeMs: number): boolean {
    if (this.isInvulnerable(timeMs)) {
      return false;
    }
    this.health = Math.max(0, this.health - 1);
    this.invulnerableUntil = timeMs + PLAYER_INVULNERABLE_MS;
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => this.sprite.clearTint());
    return true;
  }

  heal(amount: number = 1) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  healFull() {
    this.health = this.maxHealth;
  }

  setMaxHealth(maxHealth: number) {
    this.maxHealth = maxHealth;
    this.health = Math.min(this.health, maxHealth);
  }

  knockOut() {
    this.isDown = true;
    this.moving = false;
    this.sprite.stop();
    this.sprite.setTexture(SPRITE_ATLAS, playerFrame(DIRECTION_ART[this.facing].art, 'b'));
    this.muzzleFlash.setVisible(false);
    this.weapon.setVisible(false);
    this.shieldBubble.setVisible(false);
    this.scene.tweens.add({
      targets: this.sprite,
      angle: -90,
      duration: 400,
      ease: 'Bounce.easeOut',
    });
  }

  update(timeMs: number) {
    if (this.isDown) {
      this.sprite.setAlpha(1);
      return;
    }
    const blinking = timeMs < this.invulnerableUntil && Math.floor(timeMs / 80) % 2 === 0;
    this.sprite.setAlpha(blinking ? 0.35 : 1);
    this.weapon.setAlpha(this.sprite.alpha);
    this.muzzleFlash.setVisible(timeMs < this.muzzleFlashUntil);
    this.updateShieldBubble(timeMs);
    this.syncAttachments();
  }

  private updateShieldBubble(timeMs: number) {
    const shielded = this.isShielded(timeMs);
    const remainingMs = this.shieldUntil - timeMs;
    const endingBlink = remainingMs < 1000 && Math.floor(timeMs / 100) % 2 === 0;
    this.shieldBubble.setVisible(shielded && !endingBlink);
    if (!shielded) {
      return;
    }
    const pulse = 1 + Math.sin(timeMs / 120) * 0.04;
    this.shieldBubble.setScale(PIXEL_SCALE * pulse).setAlpha(0.85);
  }

  private syncAttachments() {
    this.shadow.setPosition(this.sprite.x, this.sprite.y);
    this.shadow.setDepth(this.sprite.y - 1);
    this.sprite.setDepth(this.sprite.y);
    const muzzle = this.muzzlePoint;
    this.muzzleFlash
      .setPosition(muzzle.x, muzzle.y)
      .setRotation(this.aimAngle)
      .setDepth(this.sprite.y + 1);
    const center = this.hitCenter;
    this.shieldBubble.setPosition(center.x, center.y).setDepth(this.sprite.y + 2);
    this.syncWeapon();
  }

  private syncWeapon() {
    const aimsLeft = Math.cos(this.aimAngle) < 0;
    const aimsUp = Math.sin(this.aimAngle) < -0.3;
    this.weapon
      .setFrame(GameState.weaponDef.heldTexture)
      .setOrigin(WEAPON_GRIP_ORIGIN.x, aimsLeft ? 1 - WEAPON_GRIP_ORIGIN.y : WEAPON_GRIP_ORIGIN.y)
      .setPosition(
        this.sprite.x + Math.cos(this.aimAngle) * WEAPON_HOLD_DISTANCE,
        this.sprite.y - HAND_HEIGHT + Math.sin(this.aimAngle) * WEAPON_HOLD_DISTANCE,
      )
      .setRotation(this.aimAngle)
      .setFlipY(aimsLeft)
      .setDepth(this.sprite.y + (aimsUp ? -0.5 : 0.5));
  }
}
