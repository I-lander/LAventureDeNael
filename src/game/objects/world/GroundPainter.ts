import Phaser from 'phaser';
import {
  BIOME_BLEND_JITTER,
  CHUNK_TILES,
  GROUND_VARIANT_COUNT,
  GroundKind,
  PIXEL_SCALE,
  TILE_ART_SIZE,
  TILE_SIZE,
  WORLD_ATLAS,
  groundFrame,
} from '../../elements';
import { blendJitter, classifyClimate, climateAt, groundVariant } from './WorldGenerator';
import { VillagePlan, distanceToSegment } from './VillagePlanner';

const GROUND_KINDS: GroundKind[] = ['forest', 'snow', 'volcano', 'desert', 'swamp', 'path'];
const CHUNK_ART_SIZE = CHUNK_TILES * TILE_ART_SIZE;
const PATH_EDGE_WOBBLE = 0.45 * TILE_SIZE;
const HEAT_SALT = 801;
const WETNESS_SALT = 851;

export class GroundPainter {
  private readonly tiles = new Map<GroundKind, Uint32Array[]>();
  private readonly imageData: ImageData;
  private readonly pixels: Uint32Array;
  private readonly heatCorners = new Float32Array((CHUNK_TILES + 1) * (CHUNK_TILES + 1));
  private readonly wetCorners = new Float32Array((CHUNK_TILES + 1) * (CHUNK_TILES + 1));

  constructor(scene: Phaser.Scene) {
    const texture = scene.textures.get(WORLD_ATLAS);
    const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      throw new Error('Cannot read the world atlas');
    }
    context.drawImage(source, 0, 0);
    GROUND_KINDS.forEach((kind) => {
      const variants: Uint32Array[] = [];
      for (let variant = 0; variant < GROUND_VARIANT_COUNT; variant++) {
        const frame = texture.get(groundFrame(kind, variant));
        const data = context.getImageData(frame.cutX, frame.cutY, TILE_ART_SIZE, TILE_ART_SIZE).data;
        variants.push(new Uint32Array(data.buffer.slice(0)));
      }
      this.tiles.set(kind, variants);
    });
    this.imageData = new ImageData(CHUNK_ART_SIZE, CHUNK_ART_SIZE);
    this.pixels = new Uint32Array(this.imageData.data.buffer);
  }

  paint(chunkX: number, chunkY: number, villages: VillagePlan[], target: CanvasRenderingContext2D) {
    const firstTileX = chunkX * CHUNK_TILES;
    const firstTileY = chunkY * CHUNK_TILES;
    const side = CHUNK_TILES + 1;
    for (let cornerY = 0; cornerY <= CHUNK_TILES; cornerY++) {
      for (let cornerX = 0; cornerX <= CHUNK_TILES; cornerX++) {
        const climate = climateAt(firstTileX + cornerX, firstTileY + cornerY);
        this.heatCorners[cornerY * side + cornerX] = climate.heat;
        this.wetCorners[cornerY * side + cornerX] = climate.wetness;
      }
    }
    const chunkLeft = chunkX * CHUNK_TILES * TILE_SIZE;
    const chunkTop = chunkY * CHUNK_TILES * TILE_SIZE;
    const chunkWorldSize = CHUNK_TILES * TILE_SIZE;
    const reachOf = (village: VillagePlan) => village.radius + 2 * TILE_SIZE;
    const nearbyVillages = villages.filter(
      (village) =>
        village.centerX + reachOf(village) > chunkLeft &&
        village.centerX - reachOf(village) < chunkLeft + chunkWorldSize &&
        village.centerY + reachOf(village) > chunkTop &&
        village.centerY - reachOf(village) < chunkTop + chunkWorldSize,
    );
    const firstPixelX = chunkX * CHUNK_ART_SIZE;
    const firstPixelY = chunkY * CHUNK_ART_SIZE;

    for (let pixelY = 0; pixelY < CHUNK_ART_SIZE; pixelY++) {
      for (let pixelX = 0; pixelX < CHUNK_ART_SIZE; pixelX++) {
        const worldPixelX = firstPixelX + pixelX;
        const worldPixelY = firstPixelY + pixelY;
        const heatJitter = blendJitter(worldPixelX, worldPixelY, HEAT_SALT);
        const wetJitter = blendJitter(worldPixelX, worldPixelY, WETNESS_SALT);
        let kind: GroundKind;
        if (nearbyVillages.length > 0 && this.isPath(worldPixelX, worldPixelY, heatJitter, nearbyVillages)) {
          kind = 'path';
        } else {
          const tileX = pixelX / TILE_ART_SIZE;
          const tileY = pixelY / TILE_ART_SIZE;
          const heat = this.sampleCorners(this.heatCorners, tileX, tileY);
          const wetness = this.sampleCorners(this.wetCorners, tileX, tileY);
          kind = classifyClimate(heat + heatJitter, wetness + wetJitter);
        }
        const variants = this.tiles.get(kind);
        if (!variants) {
          continue;
        }
        const tilePixels =
          variants[groundVariant(firstTileX + Math.floor(pixelX / TILE_ART_SIZE), firstTileY + Math.floor(pixelY / TILE_ART_SIZE))];
        this.pixels[pixelY * CHUNK_ART_SIZE + pixelX] =
          tilePixels[(pixelY % TILE_ART_SIZE) * TILE_ART_SIZE + (pixelX % TILE_ART_SIZE)];
      }
    }
    target.putImageData(this.imageData, 0, 0);
  }

  private sampleCorners(corners: Float32Array, tileX: number, tileY: number): number {
    const side = CHUNK_TILES + 1;
    const column = Math.min(CHUNK_TILES - 1, Math.floor(tileX));
    const row = Math.min(CHUNK_TILES - 1, Math.floor(tileY));
    const blendX = tileX - column;
    const blendY = tileY - row;
    const topLeft = corners[row * side + column];
    const topRight = corners[row * side + column + 1];
    const bottomLeft = corners[(row + 1) * side + column];
    const bottomRight = corners[(row + 1) * side + column + 1];
    const top = topLeft + (topRight - topLeft) * blendX;
    const bottom = bottomLeft + (bottomRight - bottomLeft) * blendX;
    return top + (bottom - top) * blendY;
  }

  private isPath(worldPixelX: number, worldPixelY: number, jitter: number, villages: VillagePlan[]): boolean {
    const x = (worldPixelX + 0.5) * PIXEL_SCALE;
    const y = (worldPixelY + 0.5) * PIXEL_SCALE;
    const wobble = (jitter / BIOME_BLEND_JITTER) * PATH_EDGE_WOBBLE;
    for (const village of villages) {
      const centerDistance = Math.hypot(x - village.centerX, y - village.centerY);
      if (centerDistance > village.radius + 2 * TILE_SIZE) {
        continue;
      }
      if (centerDistance < village.plazaRadius + wobble) {
        return true;
      }
      for (const segment of village.paths) {
        if (distanceToSegment(x, y, segment) < segment.halfWidth + wobble) {
          return true;
        }
      }
    }
    return false;
  }
}
