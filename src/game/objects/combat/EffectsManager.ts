import Phaser from 'phaser';
import { LAYOUT_UNIT, SPRITE_ATLAS, PIXEL_SCALE, TEXTURE } from '../../elements';

interface Particle {
  image: Phaser.GameObjects.Image;
  velocityX: number;
  velocityY: number;
  groundY: number;
  landed: boolean;
  lifeMs: number;
}

const GRAVITY = 420 * LAYOUT_UNIT;
const LANDED_LIFE_MS = 900;
const FADE_MS = 300;

export class EffectsManager {
  private readonly scene: Phaser.Scene;
  private particles: Particle[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  burst(x: number, y: number, groundY: number, texture: string, count: number, power: number = 1) {
    for (let i = 0; i < count; i++) {
      const angle = Phaser.Math.FloatBetween(-Math.PI * 0.95, -Math.PI * 0.05);
      const speed = Phaser.Math.FloatBetween(40, 110) * LAYOUT_UNIT * power;
      this.particles.push({
        image: this.scene.add
          .image(x, y, SPRITE_ATLAS, texture)
          .setScale(PIXEL_SCALE)
          .setDepth(groundY + 2),
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        groundY: groundY + Phaser.Math.FloatBetween(-6, 6) * LAYOUT_UNIT,
        landed: false,
        lifeMs: LANDED_LIFE_MS,
      });
    }
  }

  spark(x: number, y: number, depth: number, texture: string) {
    const image = this.scene.add.image(x, y, SPRITE_ATLAS, texture).setScale(PIXEL_SCALE).setDepth(depth);
    this.scene.tweens.add({
      targets: image,
      scale: PIXEL_SCALE * 1.8,
      alpha: 0,
      duration: 120,
      onComplete: () => image.destroy(),
    });
  }

  explosion(x: number, y: number, depth: number, radius: number) {
    const frame = this.scene.textures.getFrame(SPRITE_ATLAS, TEXTURE.explosion);
    const fullScale = (radius * 2) / frame.width;
    const image = this.scene.add
      .image(x, y, SPRITE_ATLAS, TEXTURE.explosion)
      .setScale(fullScale * 0.4)
      .setDepth(depth);
    this.scene.tweens.add({
      targets: image,
      scale: fullScale * 1.1,
      alpha: 0,
      duration: 340,
      ease: 'Quad.easeOut',
      onComplete: () => image.destroy(),
    });
  }

  update(deltaMs: number) {
    const seconds = deltaMs / 1000;
    this.particles = this.particles.filter((particle) => {
      if (particle.landed) {
        particle.lifeMs -= deltaMs;
        particle.image.setAlpha(Math.min(1, particle.lifeMs / FADE_MS));
        if (particle.lifeMs <= 0) {
          particle.image.destroy();
          return false;
        }
        return true;
      }
      particle.velocityY += GRAVITY * seconds;
      particle.image.x += particle.velocityX * seconds;
      particle.image.y += particle.velocityY * seconds;
      if (particle.velocityY > 0 && particle.image.y >= particle.groundY) {
        particle.image.y = particle.groundY;
        particle.landed = true;
        particle.image.setDepth(particle.groundY - 2 * LAYOUT_UNIT);
      }
      return true;
    });
  }

  clear() {
    this.particles.forEach((particle) => particle.image.destroy());
    this.particles = [];
  }
}
