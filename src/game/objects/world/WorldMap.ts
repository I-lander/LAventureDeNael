import Phaser from 'phaser';
import {
  BreakableDef,
  CHUNK_SIZE,
  CHUNK_TILES,
  LAYOUT_UNIT,
  PIXEL_SCALE,
  ShopKind,
  TEXTURE,
  TILE_ART_SIZE,
  WORLD_ATLAS,
  getBreakableDef,
  getDecorDef,
} from '../../elements';
import { GameState } from '../staticClasses/GameState';
import { GroundPainter } from './GroundPainter';
import { PlacedVillager, VillagePlan, VillagePlanner } from './VillagePlanner';
import { biomeAtTile, breakableAtTile, decorAtTile, objectOffset, tileCenter } from './WorldGenerator';

export interface ShopSite {
  kind: ShopKind;
  doorX: number;
  doorY: number;
  entrance: Phaser.Geom.Rectangle;
}

export interface VillagerSite {
  villager: PlacedVillager;
  village: VillagePlan;
}

export interface BrokenBreakable {
  def: BreakableDef;
  x: number;
  y: number;
}

interface BlockCircle {
  x: number;
  y: number;
  radius: number;
}

interface LiveBreakable {
  key: string;
  def: BreakableDef;
  x: number;
  y: number;
  centerY: number;
  image: Phaser.GameObjects.Image;
  circle: BlockCircle | null;
}

interface LiveVillager {
  site: VillagerSite;
  image: Phaser.GameObjects.Image;
  bubble: Phaser.GameObjects.Image;
  topY: number;
}

interface LoadedChunk {
  chunkX: number;
  chunkY: number;
  textureKey: string;
  ground: Phaser.GameObjects.Image;
  objects: Phaser.GameObjects.Image[];
  circles: BlockCircle[];
  rectangles: Phaser.Geom.Rectangle[];
  shops: ShopSite[];
  breakables: LiveBreakable[];
  villagers: LiveVillager[];
}

const GROUND_DEPTH = -10000000;
const FLAT_DECOR_DEPTH = GROUND_DEPTH + 1;
const LOAD_MARGIN_TOP = 2 * CHUNK_SIZE / CHUNK_TILES;
const LOAD_MARGIN_SIDE = 6 * CHUNK_SIZE / CHUNK_TILES;
const LOAD_MARGIN_BOTTOM = 12 * CHUNK_SIZE / CHUNK_TILES;
const UNLOAD_EXTRA_CHUNKS = 1;
const PUSH_OUT_PASSES = 2;
const MARGIN_LOADS_PER_FRAME = 1;
const VILLAGER_BLOCK_RADIUS = 4 * LAYOUT_UNIT;
const BUBBLE_GAP = 2 * LAYOUT_UNIT;
const FLAT_DECOR_KINDS = new Set<string>([TEXTURE.lilyPads, TEXTURE.desertSkull]);
const VILLAGE_CLEARANCE = 2 * CHUNK_SIZE / CHUNK_TILES;

export class WorldMap {
  private readonly scene: Phaser.Scene;
  private readonly chunks = new Map<string, LoadedChunk>();
  readonly planner: VillagePlanner;
  private readonly painter: GroundPainter;
  private textureCounter: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.planner = new VillagePlanner((texture) => {
      const frame = scene.textures.getFrame(WORLD_ATLAS, texture);
      return { width: frame.width, height: frame.height };
    });
    this.painter = new GroundPainter(scene);
  }

  update(view: Phaser.Geom.Rectangle) {
    const firstX = Math.floor((view.x - LOAD_MARGIN_SIDE) / CHUNK_SIZE);
    const lastX = Math.floor((view.right + LOAD_MARGIN_SIDE) / CHUNK_SIZE);
    const firstY = Math.floor((view.y - LOAD_MARGIN_TOP) / CHUNK_SIZE);
    const lastY = Math.floor((view.bottom + LOAD_MARGIN_BOTTOM) / CHUNK_SIZE);
    let marginLoads = 0;
    for (let chunkY = firstY; chunkY <= lastY; chunkY++) {
      for (let chunkX = firstX; chunkX <= lastX; chunkX++) {
        const key = `${chunkX},${chunkY}`;
        if (this.chunks.has(key)) {
          continue;
        }
        const visible =
          (chunkX + 1) * CHUNK_SIZE > view.x &&
          chunkX * CHUNK_SIZE < view.right &&
          (chunkY + 1) * CHUNK_SIZE > view.y &&
          chunkY * CHUNK_SIZE < view.bottom;
        if (!visible && marginLoads >= MARGIN_LOADS_PER_FRAME) {
          continue;
        }
        if (!visible) {
          marginLoads += 1;
        }
        this.chunks.set(key, this.loadChunk(chunkX, chunkY));
      }
    }
    this.chunks.forEach((chunk, key) => {
      const outside =
        chunk.chunkX < firstX - UNLOAD_EXTRA_CHUNKS ||
        chunk.chunkX > lastX + UNLOAD_EXTRA_CHUNKS ||
        chunk.chunkY < firstY - UNLOAD_EXTRA_CHUNKS ||
        chunk.chunkY > lastY + UNLOAD_EXTRA_CHUNKS;
      if (outside) {
        this.unloadChunk(chunk);
        this.chunks.delete(key);
      }
    });
  }

  updateVillagers(timeMs: number) {
    this.chunks.forEach((chunk) =>
      chunk.villagers.forEach((live) => {
        const quest = GameState.questOf(live.site.villager.id);
        let bubbleTexture: string | null = null;
        if (quest?.state === 'complete') {
          bubbleTexture = TEXTURE.bubbleDone;
        } else if (!quest || quest.state === 'offered') {
          bubbleTexture = TEXTURE.bubbleQuest;
        }
        live.bubble.setVisible(bubbleTexture !== null);
        if (bubbleTexture) {
          const bob = Math.round(Math.sin(timeMs / 260 + live.site.villager.x) * 1.5) * PIXEL_SCALE;
          live.bubble.setTexture(WORLD_ATLAS, bubbleTexture).setY(live.topY - BUBBLE_GAP + bob);
        }
      }),
    );
  }

  pushOut(x: number, y: number, radius: number): { x: number; y: number } {
    const position = { x, y };
    for (let pass = 0; pass < PUSH_OUT_PASSES; pass++) {
      for (const chunk of this.chunks.values()) {
        for (const circle of chunk.circles) {
          this.pushAway(position, circle.x, circle.y, circle.radius + radius);
        }
        for (const rectangle of chunk.rectangles) {
          if (rectangle.contains(position.x, position.y)) {
            this.pushOutOfRectangle(position, rectangle, radius);
            continue;
          }
          const nearestX = Phaser.Math.Clamp(position.x, rectangle.x, rectangle.right);
          const nearestY = Phaser.Math.Clamp(position.y, rectangle.y, rectangle.bottom);
          this.pushAway(position, nearestX, nearestY, radius);
        }
      }
    }
    return position;
  }

  private pushOutOfRectangle(position: { x: number; y: number }, rectangle: Phaser.Geom.Rectangle, radius: number) {
    const toLeft = position.x - rectangle.x;
    const toRight = rectangle.right - position.x;
    const toTop = position.y - rectangle.y;
    const toBottom = rectangle.bottom - position.y;
    const smallest = Math.min(toLeft, toRight, toTop, toBottom);
    if (smallest === toLeft) {
      position.x = rectangle.x - radius;
    } else if (smallest === toRight) {
      position.x = rectangle.right + radius;
    } else if (smallest === toTop) {
      position.y = rectangle.y - radius;
    } else {
      position.y = rectangle.bottom + radius;
    }
  }

  private pushAway(position: { x: number; y: number }, fromX: number, fromY: number, minimumGap: number) {
    const dx = position.x - fromX;
    const dy = position.y - fromY;
    const gap = Math.hypot(dx, dy);
    if (gap >= minimumGap) {
      return;
    }
    if (gap < 0.001) {
      position.y = fromY + minimumGap;
      return;
    }
    position.x = fromX + (dx / gap) * minimumGap;
    position.y = fromY + (dy / gap) * minimumGap;
  }

  shopAt(x: number, y: number): ShopSite | null {
    for (const chunk of this.chunks.values()) {
      for (const shop of chunk.shops) {
        if (shop.entrance.contains(x, y)) {
          return shop;
        }
      }
    }
    return null;
  }

  villagerNear(x: number, y: number, radius: number): VillagerSite | null {
    for (const chunk of this.chunks.values()) {
      for (const live of chunk.villagers) {
        if (Math.hypot(live.site.villager.x - x, live.site.villager.y - y) <= radius) {
          return live.site;
        }
      }
    }
    return null;
  }

  isInVillage(x: number, y: number): boolean {
    return this.planner.isSafe(x, y);
  }

  hitBreakable(x: number, y: number, radius: number): BrokenBreakable | null {
    for (const chunk of this.chunks.values()) {
      for (const breakable of chunk.breakables) {
        if (Math.hypot(breakable.x - x, breakable.centerY - y) <= breakable.def.hitRadius + radius) {
          return this.breakBreakable(chunk, breakable);
        }
      }
    }
    return null;
  }

  nearestBreakable(x: number, y: number, range: number): { x: number; y: number } | null {
    let nearest: { x: number; y: number } | null = null;
    let nearestDistance = range;
    this.chunks.forEach((chunk) =>
      chunk.breakables.forEach((breakable) => {
        const distance = Math.hypot(breakable.x - x, breakable.centerY - y);
        if (distance < nearestDistance) {
          nearest = { x: breakable.x, y: breakable.centerY };
          nearestDistance = distance;
        }
      }),
    );
    return nearest;
  }

  breakAllInRadius(x: number, y: number, radius: number): BrokenBreakable[] {
    const broken: BrokenBreakable[] = [];
    this.chunks.forEach((chunk) => {
      [...chunk.breakables].forEach((breakable) => {
        if (Math.hypot(breakable.x - x, breakable.centerY - y) <= breakable.def.hitRadius + radius) {
          broken.push(this.breakBreakable(chunk, breakable));
        }
      });
    });
    return broken;
  }

  private breakBreakable(chunk: LoadedChunk, breakable: LiveBreakable): BrokenBreakable {
    GameState.brokenBreakables.add(breakable.key);
    breakable.image.destroy();
    chunk.objects = chunk.objects.filter((object) => object !== breakable.image);
    chunk.breakables = chunk.breakables.filter((entry) => entry !== breakable);
    if (breakable.circle) {
      chunk.circles = chunk.circles.filter((circle) => circle !== breakable.circle);
    }
    return { def: breakable.def, x: breakable.x, y: breakable.y };
  }

  private chunkContains(chunk: LoadedChunk, x: number, y: number): boolean {
    return (
      Math.floor(x / CHUNK_SIZE) === chunk.chunkX && Math.floor(y / CHUNK_SIZE) === chunk.chunkY
    );
  }

  private loadChunk(chunkX: number, chunkY: number): LoadedChunk {
    const artSize = CHUNK_TILES * TILE_ART_SIZE;
    this.textureCounter += 1;
    const textureKey = `ground-chunk-${this.textureCounter}`;
    const canvasTexture = this.scene.textures.createCanvas(textureKey, artSize, artSize);
    if (!canvasTexture) {
      throw new Error(`Cannot create ground texture ${textureKey}`);
    }
    canvasTexture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    const villages = this.planner.villagesNear((chunkX + 0.5) * CHUNK_SIZE, (chunkY + 0.5) * CHUNK_SIZE);
    this.painter.paint(chunkX, chunkY, villages, canvasTexture.getContext());
    canvasTexture.refresh();
    const ground = this.scene.add
      .image(chunkX * CHUNK_SIZE, chunkY * CHUNK_SIZE, textureKey)
      .setOrigin(0, 0)
      .setScale(PIXEL_SCALE)
      .setDepth(GROUND_DEPTH);
    const chunk: LoadedChunk = {
      chunkX,
      chunkY,
      textureKey,
      ground,
      objects: [],
      circles: [],
      rectangles: [],
      shops: [],
      breakables: [],
      villagers: [],
    };

    const firstTileX = chunkX * CHUNK_TILES;
    const firstTileY = chunkY * CHUNK_TILES;
    for (let row = 0; row < CHUNK_TILES; row++) {
      for (let column = 0; column < CHUNK_TILES; column++) {
        this.addWildObject(chunk, firstTileX + column, firstTileY + row, villages);
      }
    }
    villages.forEach((village) => this.addVillage(chunk, village));
    return chunk;
  }

  private unloadChunk(chunk: LoadedChunk) {
    chunk.ground.destroy();
    chunk.objects.forEach((object) => object.destroy());
    chunk.villagers.forEach((live) => {
      live.image.destroy();
      live.bubble.destroy();
    });
    this.scene.textures.remove(chunk.textureKey);
  }

  private insideAnyVillage(x: number, y: number, villages: VillagePlan[]): boolean {
    return villages.some((village) => Math.hypot(x - village.centerX, y - village.centerY) < village.radius + VILLAGE_CLEARANCE);
  }

  private addWildObject(chunk: LoadedChunk, tileX: number, tileY: number, villages: VillagePlan[]) {
    const x = tileCenter(tileX);
    const y = tileCenter(tileY);
    if (this.insideAnyVillage(x, y, villages)) {
      return;
    }
    const biome = biomeAtTile(tileX, tileY);
    const offset = objectOffset(tileX, tileY);
    const decorKind = decorAtTile(tileX, tileY, biome);
    if (decorKind) {
      const decorDef = getDecorDef(decorKind);
      const decorX = Math.round(x + offset.dx);
      const decorY = Math.round(y + offset.dy);
      const flat = FLAT_DECOR_KINDS.has(decorDef.texture);
      chunk.objects.push(
        this.scene.add
          .image(decorX, decorY, WORLD_ATLAS, decorDef.texture)
          .setOrigin(0.5, flat ? 0.5 : 1)
          .setScale(PIXEL_SCALE)
          .setDepth(flat ? FLAT_DECOR_DEPTH : decorY),
      );
      if (decorDef.blockRadius > 0) {
        chunk.circles.push({ x: decorX, y: decorY - decorDef.blockRadius * 0.5, radius: decorDef.blockRadius });
      }
      return;
    }
    const breakableKind = breakableAtTile(tileX, tileY, biome);
    const key = `${tileX},${tileY}`;
    if (breakableKind && !GameState.brokenBreakables.has(key)) {
      this.addBreakable(chunk, key, getBreakableDef(breakableKind), Math.round(x + offset.dx), Math.round(y + offset.dy));
    }
  }

  private addBreakable(chunk: LoadedChunk, key: string, def: BreakableDef, x: number, y: number) {
    const image = this.scene.add
      .image(x, y, WORLD_ATLAS, def.texture)
      .setOrigin(0.5, 1)
      .setScale(PIXEL_SCALE)
      .setDepth(y);
    const circle = def.blockRadius > 0 ? { x, y: y - def.blockRadius * 0.5, radius: def.blockRadius } : null;
    if (circle) {
      chunk.circles.push(circle);
    }
    chunk.objects.push(image);
    chunk.breakables.push({ key, def, x, y, centerY: y - image.displayHeight / 2, image, circle });
  }

  private addVillage(chunk: LoadedChunk, village: VillagePlan) {
    village.buildings.forEach((building) => {
      if (!this.chunkContains(chunk, building.x, building.baseY)) {
        return;
      }
      chunk.objects.push(
        this.scene.add
          .image(building.x, building.baseY, WORLD_ATLAS, building.texture)
          .setOrigin(0.5, 1)
          .setScale(PIXEL_SCALE)
          .setDepth(building.baseY),
      );
      chunk.rectangles.push(...building.blocks);
      if (building.shop && building.entrance) {
        chunk.shops.push({ kind: building.shop, doorX: building.doorX, doorY: building.doorY, entrance: building.entrance });
      }
    });
    village.props.forEach((prop) => {
      if (!this.chunkContains(chunk, prop.x, prop.baseY)) {
        return;
      }
      chunk.objects.push(
        this.scene.add
          .image(prop.x, prop.baseY, WORLD_ATLAS, prop.texture)
          .setOrigin(0.5, 1)
          .setScale(PIXEL_SCALE)
          .setDepth(prop.block ? prop.baseY : FLAT_DECOR_DEPTH),
      );
      if (prop.block) {
        chunk.rectangles.push(prop.block);
      }
    });
    village.breakables.forEach((breakable) => {
      if (!this.chunkContains(chunk, breakable.x, breakable.y) || GameState.brokenBreakables.has(breakable.key)) {
        return;
      }
      this.addBreakable(chunk, breakable.key, getBreakableDef(breakable.kind), breakable.x, breakable.y);
    });
    village.villagers.forEach((villager) => {
      if (!this.chunkContains(chunk, villager.x, villager.y)) {
        return;
      }
      const image = this.scene.add
        .image(villager.x, villager.y, WORLD_ATLAS, villager.texture)
        .setOrigin(0.5, 1)
        .setScale(PIXEL_SCALE)
        .setDepth(villager.y);
      const topY = villager.y - image.displayHeight;
      const bubble = this.scene.add
        .image(villager.x, topY - BUBBLE_GAP, WORLD_ATLAS, TEXTURE.bubbleQuest)
        .setOrigin(0.5, 1)
        .setScale(PIXEL_SCALE)
        .setDepth(villager.y + 1);
      chunk.circles.push({ x: villager.x, y: villager.y - VILLAGER_BLOCK_RADIUS, radius: VILLAGER_BLOCK_RADIUS });
      chunk.villagers.push({ site: { villager, village }, image, bubble, topY });
    });
  }
}
