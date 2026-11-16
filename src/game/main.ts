import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import { UIScene } from './scenes/UIScene';
import { LoadingScene } from './scenes/LoadingScene';
import { ShopScene } from './scenes/ShopScene';
import { SkillTreeScene } from './scenes/SkillTreeScene';
import { DialogScene } from './scenes/DialogScene';

export function initPhaserGame() {
  window.splashStartTime = Date.now();

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.WEBGL,
    width: 2560,
    height: 1440,
    backgroundColor: '#16241c',
    antialias: false,
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      zoom: 1,
    },
    disableContextMenu: true,
    parent: 'game-container',
    scene: [LoadingScene, MainScene, UIScene, ShopScene, SkillTreeScene, DialogScene],
    powerPreference: 'high-performance',
    autoMobilePipeline: true,
    fps: {
      target: 60,
      forceSetTimeOut: false,
    },
  };

  const game = new Phaser.Game(config);
  if (import.meta.env.DEV) {
    window.phaserGame = game;
  }
}
