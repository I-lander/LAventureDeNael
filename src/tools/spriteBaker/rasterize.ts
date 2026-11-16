import { CompositeArtDef, PALETTE, PaletteKey, PixelGrid, PixelLegend, PixelStamp } from '../../game/elements';

export interface RasterImage {
  width: number;
  height: number;
  pixels: Uint8Array;
}

export function createRaster(width: number, height: number): RasterImage {
  return { width, height, pixels: new Uint8Array(width * height * 4) };
}

function setPixel(target: RasterImage, x: number, y: number, color: number) {
  if (x < 0 || y < 0 || x >= target.width || y >= target.height) {
    return;
  }
  const offset = (y * target.width + x) * 4;
  target.pixels[offset] = (color >> 16) & 255;
  target.pixels[offset + 1] = (color >> 8) & 255;
  target.pixels[offset + 2] = color & 255;
  target.pixels[offset + 3] = 255;
}

function fillRows(target: RasterImage, top: number, height: number, color: PaletteKey) {
  for (let y = top; y < top + height; y++) {
    for (let x = 0; x < target.width; x++) {
      setPixel(target, x, y, PALETTE[color]);
    }
  }
}

export function paintGrid(
  target: RasterImage,
  rows: PixelGrid,
  legend: PixelLegend,
  offsetX: number,
  offsetY: number,
  wrap: boolean,
) {
  rows.forEach((row, rowIndex) => {
    for (let column = 0; column < row.length; column++) {
      const paletteKey = legend[row[column]];
      if (!paletteKey) {
        if (row[column] !== '.') {
          throw new Error(`Unknown pixel '${row[column]}' at ${column},${rowIndex}`);
        }
        continue;
      }
      const rawX = offsetX + column;
      const targetX = wrap ? ((rawX % target.width) + target.width) % target.width : rawX;
      setPixel(target, targetX, offsetY + rowIndex, PALETTE[paletteKey]);
    }
  });
}

function gridWidth(rows: PixelGrid): number {
  return rows.reduce((widest, row) => Math.max(widest, row.length), 0);
}

export function rasterizeGrid(rows: PixelGrid, legend: PixelLegend): RasterImage {
  const image = createRaster(gridWidth(rows), rows.length);
  paintGrid(image, rows, legend, 0, 0, false);
  return image;
}

export function rasterizeStamps(width: number, height: number, stamps: PixelStamp[]): RasterImage {
  const image = createRaster(width, height);
  stamps.forEach((stamp) => paintGrid(image, stamp.rows, stamp.legend, stamp.x, stamp.y, false));
  return image;
}

export function rasterizeComposite(artDef: CompositeArtDef): RasterImage {
  const image = createRaster(artDef.width, artDef.height);
  if (artDef.fill) {
    fillRows(image, 0, artDef.height, artDef.fill);
  }
  artDef.bands.forEach((band) => fillRows(image, band.y, band.height, band.color));
  artDef.stamps.forEach((stamp) => paintGrid(image, stamp.rows, stamp.legend, stamp.x, stamp.y, true));
  return image;
}
