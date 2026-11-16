import Phaser from 'phaser';
import {
  BiomeKind,
  BreakableKind,
  FootprintRatio,
  PIXEL_SCALE,
  SHOPS,
  ShopKind,
  TILE_SIZE,
  VILLAGERS,
  VILLAGE_CELL_TILES,
  VILLAGE_MARGIN_TILES,
  VILLAGE_NAME_ENDS,
  VILLAGE_NAME_STARTS,
  VILLAGE_SAFE_MARGIN_TILES,
  VillagePropKind,
  VillagerKind,
  getBiomeDef,
  getHouseDef,
  getShopDef,
  getVillagePropDef,
  getVillagerDef,
} from '../../elements';
import { HOME_TILE, biomeAtTile, createRandom, hash, pick, shuffled, tileCenter } from './WorldGenerator';

export type ArtSizeLookup = (texture: string) => { width: number; height: number };

export interface PlacedSprite {
  texture: string;
  x: number;
  baseY: number;
  block: Phaser.Geom.Rectangle | null;
}

export interface PlacedBuilding {
  texture: string;
  x: number;
  baseY: number;
  blocks: Phaser.Geom.Rectangle[];
  entrance: Phaser.Geom.Rectangle | null;
  shop: ShopKind | null;
  doorX: number;
  doorY: number;
}

export interface PlacedVillager {
  id: string;
  kind: VillagerKind;
  name: string;
  texture: string;
  x: number;
  y: number;
}

export interface PlacedBreakable {
  key: string;
  kind: BreakableKind;
  x: number;
  y: number;
}

export interface PathSegment {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  halfWidth: number;
}

export interface VillagePlan {
  key: string;
  cellX: number;
  cellY: number;
  centerX: number;
  centerY: number;
  radius: number;
  safeRadius: number;
  plazaRadius: number;
  name: string;
  biome: BiomeKind;
  isHome: boolean;
  buildings: PlacedBuilding[];
  props: PlacedSprite[];
  villagers: PlacedVillager[];
  breakables: PlacedBreakable[];
  paths: PathSegment[];
}

const PLAZA_RADIUS_TILES = 5;
const PATH_HALF_WIDTH = 0.85 * TILE_SIZE;
const RING_RADII_TILES = [11, 19, 27];
const RING_SQUASH = 0.72;
const SLOT_ANGLES_DEGREES = [270, 240, 300, 215, 325, 255, 285, 200, 340, 228, 312];
const BUILDING_GAP = 1.2 * TILE_SIZE;
const DOOR_DROP = 0.6 * TILE_SIZE;
const SOUTH_ROAD_TILES = 18;
const PATH_SAMPLE_STEP = TILE_SIZE / 2;
const MAX_CACHE = 48;
const DOORWAY_DEPTH = 1.5 * TILE_SIZE;
const DOORWAY_TRIGGER_GAP = 0.35 * TILE_SIZE;

export function distanceToSegment(x: number, y: number, segment: PathSegment): number {
  const dx = segment.toX - segment.fromX;
  const dy = segment.toY - segment.fromY;
  const lengthSquared = dx * dx + dy * dy;
  const along = lengthSquared === 0 ? 0 : Phaser.Math.Clamp(((x - segment.fromX) * dx + (y - segment.fromY) * dy) / lengthSquared, 0, 1);
  return Math.hypot(x - (segment.fromX + dx * along), y - (segment.fromY + dy * along));
}

export class VillagePlanner {
  private readonly sizeOf: ArtSizeLookup;
  private readonly cache = new Map<string, VillagePlan>();
  private homePlan: VillagePlan | null = null;

  constructor(sizeOf: ArtSizeLookup) {
    this.sizeOf = sizeOf;
  }

  get home(): VillagePlan {
    if (!this.homePlan) {
      this.homePlan = this.buildPlan(0, 0);
    }
    return this.homePlan;
  }

  villageInCell(cellX: number, cellY: number): VillagePlan {
    if (cellX === 0 && cellY === 0) {
      return this.home;
    }
    const key = `${cellX},${cellY}`;
    const cached = this.cache.get(key);
    if (cached) {
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached;
    }
    const plan = this.buildPlan(cellX, cellY);
    if (this.cache.size >= MAX_CACHE) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) {
        this.cache.delete(oldest);
      }
    }
    this.cache.set(key, plan);
    return plan;
  }

  villagesNear(x: number, y: number): VillagePlan[] {
    const cellX = Math.floor(x / TILE_SIZE / VILLAGE_CELL_TILES);
    const cellY = Math.floor(y / TILE_SIZE / VILLAGE_CELL_TILES);
    const villages: VillagePlan[] = [];
    for (let offsetY = -1; offsetY <= 1; offsetY++) {
      for (let offsetX = -1; offsetX <= 1; offsetX++) {
        villages.push(this.villageInCell(cellX + offsetX, cellY + offsetY));
      }
    }
    return villages;
  }

  nearestVillage(x: number, y: number): { village: VillagePlan; distance: number } {
    const villages = this.villagesNear(x, y);
    let nearest = villages[0];
    let nearestDistance = Number.POSITIVE_INFINITY;
    villages.forEach((village) => {
      const distance = Math.hypot(x - village.centerX, y - village.centerY);
      if (distance < nearestDistance) {
        nearest = village;
        nearestDistance = distance;
      }
    });
    return { village: nearest, distance: nearestDistance };
  }

  villageAt(x: number, y: number, extraMargin: number = 0): VillagePlan | null {
    const { village, distance } = this.nearestVillage(x, y);
    return distance <= village.radius + extraMargin ? village : null;
  }

  isSafe(x: number, y: number): boolean {
    const { village, distance } = this.nearestVillage(x, y);
    return distance <= village.safeRadius;
  }

  private centerTile(cellX: number, cellY: number): { x: number; y: number } {
    if (cellX === 0 && cellY === 0) {
      return HOME_TILE;
    }
    const span = VILLAGE_CELL_TILES - 2 * VILLAGE_MARGIN_TILES;
    return {
      x: cellX * VILLAGE_CELL_TILES + VILLAGE_MARGIN_TILES + Math.floor(hash(cellX, cellY, 101) * span),
      y: cellY * VILLAGE_CELL_TILES + VILLAGE_MARGIN_TILES + Math.floor(hash(cellX, cellY, 202) * span),
    };
  }

  private footprintRect(texture: string, x: number, baseY: number, footprint: FootprintRatio): Phaser.Geom.Rectangle {
    const size = this.sizeOf(texture);
    const width = size.width * PIXEL_SCALE * footprint.width;
    const depth = size.height * PIXEL_SCALE * footprint.depth;
    return new Phaser.Geom.Rectangle(x - width / 2, baseY - depth, width, depth);
  }

  private spriteRect(texture: string, x: number, baseY: number): Phaser.Geom.Rectangle {
    const size = this.sizeOf(texture);
    return new Phaser.Geom.Rectangle(
      x - (size.width * PIXEL_SCALE) / 2,
      baseY - size.height * PIXEL_SCALE,
      size.width * PIXEL_SCALE,
      size.height * PIXEL_SCALE,
    );
  }

  private buildPlan(cellX: number, cellY: number): VillagePlan {
    const random = createRandom(hash(cellX, cellY, 909));
    const center = this.centerTile(cellX, cellY);
    const centerX = tileCenter(center.x);
    const centerY = tileCenter(center.y);
    const isHome = cellX === 0 && cellY === 0;
    const biome = isHome ? 'forest' : biomeAtTile(center.x, center.y);
    const plazaRadius = PLAZA_RADIUS_TILES * TILE_SIZE;
    const occupied: Phaser.Geom.Rectangle[] = [];
    const buildings: PlacedBuilding[] = [];
    const props: PlacedSprite[] = [];
    const paths: PathSegment[] = [];
    const breakables: PlacedBreakable[] = [];
    const villagers: PlacedVillager[] = [];
    const villageKey = `${cellX},${cellY}`;

    const fits = (rect: Phaser.Geom.Rectangle, gap: number): boolean => {
      const grown = new Phaser.Geom.Rectangle(rect.x - gap, rect.y - gap, rect.width + 2 * gap, rect.height + 2 * gap);
      return occupied.every((other) => !Phaser.Geom.Intersects.RectangleToRectangle(grown, other));
    };
    const crossesPaths = (rect: Phaser.Geom.Rectangle): boolean =>
      paths.some((segment) => this.segmentHitsRect(segment, rect, PATH_HALF_WIDTH));

    const centerpiece: VillagePropKind = isHome || random() < 0.55 ? 'fountain' : 'well';
    const centerpieceDef = getVillagePropDef(centerpiece);
    const centerpieceBaseY = centerY + (this.sizeOf(centerpieceDef.texture).height * PIXEL_SCALE) / 2;
    const centerpieceBlock = centerpieceDef.footprint
      ? this.footprintRect(centerpieceDef.texture, centerX, centerpieceBaseY, centerpieceDef.footprint)
      : null;
    props.push({ texture: centerpieceDef.texture, x: centerX, baseY: centerpieceBaseY, block: centerpieceBlock });
    occupied.push(new Phaser.Geom.Rectangle(centerX - plazaRadius, centerY - plazaRadius, plazaRadius * 2, plazaRadius * 2));

    const southRoad: PathSegment = {
      fromX: centerX,
      fromY: centerY,
      toX: centerX,
      toY: centerY + SOUTH_ROAD_TILES * TILE_SIZE,
      halfWidth: PATH_HALF_WIDTH,
    };
    paths.push(southRoad);

    const shopKinds: ShopKind[] = isHome
      ? SHOPS.map((shop) => shop.kind)
      : shuffled(SHOPS.map((shop) => shop.kind), random).slice(0, 1 + Math.floor(random() * 2));
    const houseCount = 3 + Math.floor(random() * 4);
    const houseKinds = getBiomeDef(biome).houses;
    const requests: {
      texture: string;
      footprint: FootprintRatio;
      doorOffsetX: number;
      doorWidth: number;
      shop: ShopKind | null;
    }[] = shopKinds.map((shop) => {
      const shopDef = getShopDef(shop);
      return { texture: shopDef.houseTexture, footprint: shopDef.footprint, doorOffsetX: 0, doorWidth: shopDef.doorWidth, shop };
    });
    for (let i = 0; i < houseCount; i++) {
      const houseDef = getHouseDef(pick(houseKinds, random));
      requests.push({
        texture: houseDef.texture,
        footprint: houseDef.footprint,
        doorOffsetX: houseDef.doorOffsetX,
        doorWidth: 0,
        shop: null,
      });
    }

    requests.forEach((request) => {
      const size = this.sizeOf(request.texture);
      const angleOffset = (random() - 0.5) * 8;
      for (const ringTiles of RING_RADII_TILES) {
        for (const angleDegrees of SLOT_ANGLES_DEGREES) {
          const angle = Phaser.Math.DegToRad(angleDegrees + angleOffset);
          const radius = ringTiles * TILE_SIZE + (size.height * PIXEL_SCALE) / 3;
          const x = Math.round(centerX + Math.cos(angle) * radius);
          const baseY = Math.round(centerY + Math.sin(angle) * radius * RING_SQUASH + (size.height * PIXEL_SCALE) / 2);
          const visual = this.spriteRect(request.texture, x, baseY);
          const doorX = x + request.doorOffsetX * size.width * PIXEL_SCALE;
          const doorY = baseY + DOOR_DROP;
          if (doorY > centerY - plazaRadius * 0.4 || !fits(visual, BUILDING_GAP) || crossesPaths(visual)) {
            continue;
          }
          const path: PathSegment = { fromX: doorX, fromY: doorY, toX: centerX, toY: centerY, halfWidth: PATH_HALF_WIDTH };
          if (occupied.slice(1).some((other) => this.segmentHitsRect(path, other, PATH_HALF_WIDTH))) {
            continue;
          }
          occupied.push(visual);
          paths.push(path);
          const footprint = this.footprintRect(request.texture, x, baseY, request.footprint);
          const doorwayWidth = size.width * PIXEL_SCALE * request.doorWidth;
          buildings.push({
            texture: request.texture,
            x,
            baseY,
            blocks: request.shop ? this.doorwayBlocks(footprint, doorX, doorwayWidth) : [footprint],
            entrance: request.shop
              ? new Phaser.Geom.Rectangle(doorX - doorwayWidth / 2, baseY - DOORWAY_DEPTH, doorwayWidth, DOORWAY_DEPTH - DOORWAY_TRIGGER_GAP)
              : null,
            shop: request.shop,
            doorX,
            doorY,
          });
          return;
        }
      }
    });

    const measureRadius = (): number => {
      let farthest = plazaRadius + SOUTH_ROAD_TILES * TILE_SIZE * 0.6;
      occupied.slice(1).forEach((rect) => {
        [
          [rect.left, rect.top],
          [rect.right, rect.top],
          [rect.left, rect.bottom],
          [rect.right, rect.bottom],
        ].forEach(([cornerX, cornerY]) => {
          farthest = Math.max(farthest, Math.hypot(cornerX - centerX, cornerY - centerY));
        });
      });
      return farthest + 2 * TILE_SIZE;
    };
    southRoad.toY = centerY + Math.max(SOUTH_ROAD_TILES * TILE_SIZE, measureRadius());

    const tryProp = (kind: VillagePropKind, x: number, baseY: number, avoidPaths: boolean): boolean => {
      const propDef = getVillagePropDef(kind);
      const visual = this.spriteRect(propDef.texture, Math.round(x), Math.round(baseY));
      if (!fits(visual, TILE_SIZE * 0.3) || (avoidPaths && crossesPaths(visual))) {
        return false;
      }
      occupied.push(visual);
      props.push({
        texture: propDef.texture,
        x: Math.round(x),
        baseY: Math.round(baseY),
        block: propDef.footprint ? this.footprintRect(propDef.texture, Math.round(x), Math.round(baseY), propDef.footprint) : null,
      });
      return true;
    };

    const lampRadius = plazaRadius + TILE_SIZE * 1.5;
    [45, 135, 225, 315].forEach((angleDegrees) => {
      const angle = Phaser.Math.DegToRad(angleDegrees);
      tryProp('streetLamp', centerX + Math.cos(angle) * lampRadius, centerY + Math.sin(angle) * lampRadius, true);
    });
    for (let step = 1; step <= 3; step++) {
      const side = step % 2 === 0 ? -1 : 1;
      tryProp('streetLamp', centerX + side * 2 * TILE_SIZE, centerY + (5 + step * 4) * TILE_SIZE, true);
    }

    buildings.forEach((building) => {
      const size = this.sizeOf(building.texture);
      const halfWidth = (size.width * PIXEL_SCALE) / 2;
      const roll = random();
      const sideX = building.doorX < building.x ? building.x + halfWidth * 0.55 : building.x - halfWidth * 0.55;
      if (roll < 0.35) {
        tryProp('flowerBed', sideX, building.baseY + TILE_SIZE * 2.5, true);
      } else if (roll < 0.6) {
        tryProp('barrels', building.x + halfWidth + TILE_SIZE, building.baseY, true);
      } else if (roll < 0.8) {
        tryProp('fence', sideX, building.baseY + TILE_SIZE * 2.2, true);
      }
      if (random() < 0.6) {
        const potX = Math.round(building.x - halfWidth - TILE_SIZE * 0.8);
        const potY = Math.round(building.baseY - TILE_SIZE * 0.2);
        const spot = new Phaser.Geom.Rectangle(potX - TILE_SIZE / 2, potY - TILE_SIZE, TILE_SIZE, TILE_SIZE);
        if (fits(spot, TILE_SIZE * 0.2) && !crossesPaths(spot)) {
          occupied.push(spot);
          breakables.push({
            key: `v${villageKey},${buildings.indexOf(building)}`,
            kind: random() < 0.5 ? 'clayPot' : 'crate',
            x: potX,
            y: potY,
          });
        }
      }
    });

    const stallCount = isHome ? 2 : Math.floor(random() * 3);
    for (let i = 0; i < stallCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      tryProp('marketStall', centerX + side * 6 * TILE_SIZE, centerY + (9 + Math.floor(random() * 5)) * TILE_SIZE, true);
    }

    const decorations: VillagePropKind[] = ['flowerBed', 'flowerBed', 'flowerBed', 'bench', 'barrels'];
    let attempts = 0;
    let placed = 0;
    const wanted = 4 + Math.floor(random() * 4);
    while (placed < wanted && attempts < 60) {
      attempts += 1;
      const angle = Phaser.Math.DegToRad(-10 + random() * 200);
      const distance = plazaRadius + TILE_SIZE * (2 + random() * 12);
      if (tryProp(pick(decorations, random), centerX + Math.cos(angle) * distance, centerY + Math.sin(angle) * distance, true)) {
        placed += 1;
      }
    }

    const villagerCount = isHome ? 2 : 1 + Math.floor(random() * 3);
    const villagerKinds = shuffled(
      VILLAGERS.map((villager) => villager.kind),
      random,
    );
    let villagerAttempts = 0;
    while (villagers.length < villagerCount && villagerAttempts < 40) {
      villagerAttempts += 1;
      const angle = Phaser.Math.DegToRad(20 + random() * 140);
      const distance = plazaRadius + TILE_SIZE * (1.5 + random() * 6);
      const x = Math.round(centerX + Math.cos(angle) * distance);
      const y = Math.round(centerY + Math.sin(angle) * distance);
      const spot = new Phaser.Geom.Rectangle(x - TILE_SIZE * 0.6, y - TILE_SIZE * 1.6, TILE_SIZE * 1.2, TILE_SIZE * 1.6);
      if (!fits(spot, TILE_SIZE * 0.6)) {
        continue;
      }
      occupied.push(spot);
      const kind = villagerKinds[villagers.length % villagerKinds.length];
      const villagerDef = getVillagerDef(kind);
      villagers.push({
        id: `${villageKey},${villagers.length}`,
        kind,
        name: pick(villagerDef.names, random),
        texture: villagerDef.texture,
        x,
        y,
      });
    }

    const radius = measureRadius();

    return {
      key: villageKey,
      cellX,
      cellY,
      centerX,
      centerY,
      radius,
      safeRadius: radius + VILLAGE_SAFE_MARGIN_TILES * TILE_SIZE,
      plazaRadius,
      name: isHome ? 'BOURG-NAEL' : `${pick(VILLAGE_NAME_STARTS, random)}-${pick(VILLAGE_NAME_ENDS[biome], random)}`,
      biome,
      isHome,
      buildings,
      props,
      villagers,
      breakables,
      paths,
    };
  }

  private doorwayBlocks(footprint: Phaser.Geom.Rectangle, doorX: number, doorwayWidth: number): Phaser.Geom.Rectangle[] {
    const doorLeft = doorX - doorwayWidth / 2;
    const doorRight = doorX + doorwayWidth / 2;
    const doorwayTop = footprint.bottom - DOORWAY_DEPTH;
    return [
      new Phaser.Geom.Rectangle(footprint.x, footprint.y, footprint.width, doorwayTop - footprint.y),
      new Phaser.Geom.Rectangle(footprint.x, doorwayTop, doorLeft - footprint.x, DOORWAY_DEPTH),
      new Phaser.Geom.Rectangle(doorRight, doorwayTop, footprint.right - doorRight, DOORWAY_DEPTH),
    ];
  }

  private segmentHitsRect(segment: PathSegment, rect: Phaser.Geom.Rectangle, margin: number): boolean {
    const length = Math.hypot(segment.toX - segment.fromX, segment.toY - segment.fromY);
    const steps = Math.max(1, Math.ceil(length / PATH_SAMPLE_STEP));
    const grown = new Phaser.Geom.Rectangle(rect.x - margin, rect.y - margin, rect.width + 2 * margin, rect.height + 2 * margin);
    for (let i = 0; i <= steps; i++) {
      const along = i / steps;
      if (grown.contains(segment.fromX + (segment.toX - segment.fromX) * along, segment.fromY + (segment.toY - segment.fromY) * along)) {
        return true;
      }
    }
    return false;
  }
}
