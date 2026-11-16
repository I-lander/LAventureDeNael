import Phaser from 'phaser';
import { LAYOUT_UNIT, SPRITE_ATLAS, PIXEL_SCALE, TEXTURE } from '../elements';

const HEART_SPACING = 11 * LAYOUT_UNIT;

export class HeartsBar extends Phaser.GameObjects.Container {
  private readonly hearts: Phaser.GameObjects.Image[] = [];
  private displayedHealth: number = -1;
  private displayedMaxHealth: number = -1;
  private readonly baseX: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.baseX = x;
    scene.add.existing(this);
  }

  setHealth(health: number, maxHealth: number) {
    if (health === this.displayedHealth && maxHealth === this.displayedMaxHealth) {
      return;
    }
    const lostHeart = health < this.displayedHealth && maxHealth === this.displayedMaxHealth;
    this.displayedHealth = health;
    this.displayedMaxHealth = maxHealth;
    while (this.hearts.length < maxHealth) {
      const heart = this.scene.add
        .image(this.hearts.length * HEART_SPACING, 0, SPRITE_ATLAS, TEXTURE.heart)
        .setOrigin(0, 0)
        .setScale(PIXEL_SCALE);
      this.hearts.push(heart);
      this.add(heart);
    }
    this.hearts.forEach((heart, index) => {
      heart.setVisible(index < maxHealth);
      heart.setTexture(SPRITE_ATLAS, index < health ? TEXTURE.heart : TEXTURE.heartEmpty);
    });
    if (lostHeart) {
      this.scene.tweens.add({
        targets: this,
        x: { from: this.baseX + 2 * LAYOUT_UNIT, to: this.baseX },
        duration: 180,
        ease: 'Bounce.easeOut',
      });
    }
  }
}
