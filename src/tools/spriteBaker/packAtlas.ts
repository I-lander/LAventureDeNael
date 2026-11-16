import { RasterImage, createRaster } from './rasterize';

export interface AtlasFrameSource {
  name: string;
  image: RasterImage;
}

export interface AtlasSource {
  key: string;
  frames: AtlasFrameSource[];
}

interface PhaserFrameEntry {
  frame: { x: number; y: number; w: number; h: number };
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
}

export interface PackedAtlas {
  key: string;
  image: RasterImage;
  json: {
    frames: Record<string, PhaserFrameEntry>;
    meta: { image: string; size: { w: number; h: number }; scale: string };
  };
}

const PADDING = 2;
const MIN_ATLAS_WIDTH = 512;

function blit(target: RasterImage, source: RasterImage, left: number, top: number) {
  for (let y = 0; y < source.height; y++) {
    const sourceStart = y * source.width * 4;
    const targetStart = ((top + y) * target.width + left) * 4;
    target.pixels.set(source.pixels.subarray(sourceStart, sourceStart + source.width * 4), targetStart);
  }
}

export function packAtlas(source: AtlasSource): PackedAtlas {
  const names = new Set<string>();
  source.frames.forEach((frame) => {
    if (names.has(frame.name)) {
      throw new Error(`Duplicate frame ${frame.name} in atlas ${source.key}`);
    }
    names.add(frame.name);
  });

  const widest = source.frames.reduce((current, frame) => Math.max(current, frame.image.width), 0);
  const atlasWidth = Math.max(MIN_ATLAS_WIDTH, widest + PADDING * 2);
  const ordered = [...source.frames].sort((first, second) => second.image.height - first.image.height);

  const placements: { frame: AtlasFrameSource; x: number; y: number }[] = [];
  let cursorX = PADDING;
  let cursorY = PADDING;
  let shelfHeight = 0;
  ordered.forEach((frame) => {
    if (cursorX + frame.image.width + PADDING > atlasWidth) {
      cursorX = PADDING;
      cursorY += shelfHeight + PADDING;
      shelfHeight = 0;
    }
    placements.push({ frame, x: cursorX, y: cursorY });
    cursorX += frame.image.width + PADDING;
    shelfHeight = Math.max(shelfHeight, frame.image.height);
  });
  const atlasHeight = cursorY + shelfHeight + PADDING;

  const image = createRaster(atlasWidth, atlasHeight);
  const frames: Record<string, PhaserFrameEntry> = {};
  placements.forEach(({ frame, x, y }) => {
    blit(image, frame.image, x, y);
    const width = frame.image.width;
    const height = frame.image.height;
    frames[frame.name] = {
      frame: { x, y, w: width, h: height },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: width, h: height },
      sourceSize: { w: width, h: height },
    };
  });

  return {
    key: source.key,
    image,
    json: {
      frames,
      meta: { image: `${source.key}.png`, size: { w: atlasWidth, h: atlasHeight }, scale: '1' },
    },
  };
}
