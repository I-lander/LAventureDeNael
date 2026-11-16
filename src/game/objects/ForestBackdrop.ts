import Phaser from 'phaser';
import { FOREST_ATLAS, LAYOUT_UNIT, PIXEL_SCALE, TEXTURE, VIEW_WIDTH } from '../elements';
import { FRONT_DEPTH } from '../utils/utils';

interface ParallaxLayer {
  sprite: Phaser.GameObjects.TileSprite;
  factor: number;
}

interface LayerSpec {
  frame: string;
  layoutY: number;
  layoutHeight: number;
  factor: number;
  depth: number;
}

const BACKGROUND_DEPTH = -3200;

const LAYERS: LayerSpec[] = [
  { frame: TEXTURE.forestSky, layoutY: 0, layoutHeight: 68, factor: 0.06, depth: BACKGROUND_DEPTH },
  { frame: TEXTURE.forestFar, layoutY: 0, layoutHeight: 68, factor: 0.2, depth: BACKGROUND_DEPTH + 100 },
  { frame: TEXTURE.forestMid, layoutY: 0, layoutHeight: 69, factor: 0.42, depth: BACKGROUND_DEPTH + 200 },
  { frame: TEXTURE.forestFloor, layoutY: 82, layoutHeight: 98, factor: 1, depth: BACKGROUND_DEPTH + 250 },
  { frame: TEXTURE.forestFloorBack, layoutY: 66, layoutHeight: 16, factor: 0.8, depth: BACKGROUND_DEPTH + 300 },
  { frame: TEXTURE.forestNear, layoutY: 0, layoutHeight: 80, factor: 0.8, depth: BACKGROUND_DEPTH + 400 },
  { frame: TEXTURE.forestForeground, layoutY: 166, layoutHeight: 14, factor: 1.4, depth: FRONT_DEPTH },
  { frame: TEXTURE.forestFrontLeaves, layoutY: 0, layoutHeight: 20, factor: 1.7, depth: FRONT_DEPTH },
];

export class ForestBackdrop {
  private layers: ParallaxLayer[] = [];

  constructor(scene: Phaser.Scene) {
    LAYERS.forEach((spec) => this.addLayer(scene, spec));
  }

  private addLayer(scene: Phaser.Scene, spec: LayerSpec) {
    const textureHeight = (spec.layoutHeight * LAYOUT_UNIT) / PIXEL_SCALE;
    const sprite = scene.add
      .tileSprite(0, spec.layoutY * LAYOUT_UNIT, VIEW_WIDTH / PIXEL_SCALE, textureHeight, FOREST_ATLAS, spec.frame)
      .setOrigin(0, 0)
      .setScale(PIXEL_SCALE)
      .setDepth(spec.depth);
    this.layers.push({ sprite, factor: spec.factor });
  }

  update(deltaMs: number, scrollSpeed: number) {
    const travelled = (scrollSpeed * deltaMs) / 1000 / PIXEL_SCALE;
    this.layers.forEach((layer) => {
      layer.sprite.tilePositionX += travelled * layer.factor;
    });
  }
}
