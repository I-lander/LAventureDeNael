import Phaser from 'phaser';
import { LAYOUT_UNIT, SPRITE_ATLAS, PIXEL_SCALE } from '../../elements';

export interface Projectile {
  image: Phaser.GameObjects.Image;
  velocityX: number;
  velocityY: number;
  active: boolean;
  damage: number;
  piercing: boolean;
  explosionRadius: number;
  remainingMs: number | null;
  hitTargets: Set<object>;
}

export interface ProjectileOptions {
  texture?: string;
  damage?: number;
  piercing?: boolean;
  explosionRadius?: number;
  lifetimeMs?: number | null;
}

const OFFSCREEN_MARGIN = 16 * LAYOUT_UNIT;
const DEPTH_LIFT = 12 * LAYOUT_UNIT;

export class ProjectilePool {
  private readonly scene: Phaser.Scene;
  private readonly defaultTexture: string;
  private readonly projectiles: Projectile[] = [];

  constructor(scene: Phaser.Scene, defaultTexture: string) {
    this.scene = scene;
    this.defaultTexture = defaultTexture;
  }

  spawn(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    depth: number,
    options: ProjectileOptions = {},
  ): Projectile {
    const texture = options.texture ?? this.defaultTexture;
    let projectile = this.projectiles.find((candidate) => !candidate.active);
    if (!projectile) {
      projectile = {
        image: this.scene.add.image(x, y, SPRITE_ATLAS, texture).setScale(PIXEL_SCALE),
        velocityX,
        velocityY,
        active: true,
        damage: 1,
        piercing: false,
        explosionRadius: 0,
        remainingMs: null,
        hitTargets: new Set<object>(),
      };
      this.projectiles.push(projectile);
    }
    projectile.image
      .setTexture(SPRITE_ATLAS, texture)
      .setPosition(x, y)
      .setDepth(depth)
      .setRotation(Math.atan2(velocityY, velocityX))
      .setVisible(true);
    projectile.velocityX = velocityX;
    projectile.velocityY = velocityY;
    projectile.active = true;
    projectile.damage = options.damage ?? 1;
    projectile.piercing = options.piercing ?? false;
    projectile.explosionRadius = options.explosionRadius ?? 0;
    projectile.remainingMs = options.lifetimeMs ?? null;
    projectile.hitTargets.clear();
    return projectile;
  }

  update(deltaMs: number, view: Phaser.Geom.Rectangle) {
    const seconds = deltaMs / 1000;
    this.projectiles.forEach((projectile) => {
      if (!projectile.active) {
        return;
      }
      projectile.image.x += projectile.velocityX * seconds;
      projectile.image.y += projectile.velocityY * seconds;
      projectile.image.setDepth(projectile.image.y + DEPTH_LIFT);
      if (projectile.remainingMs !== null) {
        projectile.remainingMs -= deltaMs;
        if (projectile.remainingMs <= 0) {
          this.release(projectile);
          return;
        }
      }
      const { x, y } = projectile.image;
      if (
        x < view.x - OFFSCREEN_MARGIN ||
        x > view.right + OFFSCREEN_MARGIN ||
        y < view.y - OFFSCREEN_MARGIN ||
        y > view.bottom + OFFSCREEN_MARGIN
      ) {
        this.release(projectile);
      }
    });
  }

  forEachActive(callback: (projectile: Projectile) => void) {
    this.projectiles.forEach((projectile) => {
      if (projectile.active) {
        callback(projectile);
      }
    });
  }

  release(projectile: Projectile) {
    projectile.active = false;
    projectile.image.setVisible(false);
  }

  clear() {
    this.projectiles.forEach((projectile) => this.release(projectile));
  }
}
