import Phaser from 'phaser';
import { ANIMATIONS, ATLAS_DIRECTORY, ATLAS_KEYS } from '../elements';
import { registerAnimations } from '../utils/pixelArt';

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' });
  }

  preload() {
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.error(`Missing sprite atlas file ${file.src}: run npm run bake:sprites`);
    });
    ATLAS_KEYS.forEach((atlasKey) => {
      this.load.atlas(atlasKey, `${ATLAS_DIRECTORY}/${atlasKey}.png`, `${ATLAS_DIRECTORY}/${atlasKey}.json`);
    });
  }

  create() {
    registerAnimations(this, ANIMATIONS);

    this.scene.start('MainScene');
    this.scene.launch('UIScene');
    this.scene.bringToTop('UIScene');
  }
}
