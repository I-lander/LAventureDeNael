import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { encodeIco, encodePng } from './png-encoder.mjs';

const PROJECT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const ANDROID_MAIN_DIRECTORY = join(PROJECT_DIRECTORY, 'android', 'app', 'src', 'main');
const ANDROID_RES_DIRECTORY = join(ANDROID_MAIN_DIRECTORY, 'res');
const PUBLIC_DIRECTORY = join(PROJECT_DIRECTORY, 'public');
const SUPERSAMPLING = 8;
const SHADOW_OPACITY = 0.45;

const ANDROID_DENSITIES = [
  { folder: 'mipmap-mdpi', scale: 1 },
  { folder: 'mipmap-hdpi', scale: 1.5 },
  { folder: 'mipmap-xhdpi', scale: 2 },
  { folder: 'mipmap-xxhdpi', scale: 3 },
  { folder: 'mipmap-xxxhdpi', scale: 4 },
];

const TRANSPARENT = { red: 0, green: 0, blue: 0, alpha: 0 };

function toColor(hexValue) {
  return { red: (hexValue >> 16) & 255, green: (hexValue >> 8) & 255, blue: hexValue & 255 };
}

function blendOver(base, color, opacity) {
  const resultAlpha = opacity + base.alpha * (1 - opacity);
  if (resultAlpha === 0) return TRANSPARENT;
  const mixChannel = (top, bottom) => (top * opacity + bottom * base.alpha * (1 - opacity)) / resultAlpha;
  return {
    red: mixChannel(color.red, base.red),
    green: mixChannel(color.green, base.green),
    blue: mixChannel(color.blue, base.blue),
    alpha: resultAlpha,
  };
}

function insideShape(shape, sampleX, sampleY, size) {
  const half = size / 2;
  if (shape === 'none') return false;
  if (shape === 'square') return true;
  if (shape === 'circle') return (sampleX - half) ** 2 + (sampleY - half) ** 2 <= half * half;
  const cornerRadius = size * 0.22;
  const nearestX = Math.min(Math.max(sampleX, cornerRadius), size - cornerRadius);
  const nearestY = Math.min(Math.max(sampleY, cornerRadius), size - cornerRadius);
  return (sampleX - nearestX) ** 2 + (sampleY - nearestY) ** 2 <= cornerRadius * cornerRadius;
}

function backgroundAt(colors, sampleX, sampleY, size) {
  const half = size / 2;
  const distance = Math.min(1, Math.hypot(sampleX - half, sampleY - half) / (half * Math.SQRT2));
  const mix = (center, edge) => center + (edge - center) * distance;
  return {
    red: mix(colors.backgroundCenter.red, colors.backgroundEdge.red),
    green: mix(colors.backgroundCenter.green, colors.backgroundEdge.green),
    blue: mix(colors.backgroundCenter.blue, colors.backgroundEdge.blue),
    alpha: 1,
  };
}

function renderIcon(art, colors, { size, artWidthRatio, shape, shadow }) {
  const artScale = (size * artWidthRatio) / Math.max(art.width, art.height);
  const artLeft = (size - art.width * artScale) / 2;
  const artTop = (size - art.height * artScale) / 2;
  const shadowCenterY = artTop + art.height * artScale - artScale;
  const shadowRadiusX = art.width * artScale * 0.52;
  const shadowRadiusY = artScale * 4;
  const pixels = new Uint8Array(size * size * 4);
  const sampleCount = SUPERSAMPLING * SUPERSAMPLING;

  for (let pixelY = 0; pixelY < size; pixelY += 1) {
    for (let pixelX = 0; pixelX < size; pixelX += 1) {
      let sumRed = 0;
      let sumGreen = 0;
      let sumBlue = 0;
      let sumAlpha = 0;
      for (let subY = 0; subY < SUPERSAMPLING; subY += 1) {
        for (let subX = 0; subX < SUPERSAMPLING; subX += 1) {
          const sampleX = pixelX + (subX + 0.5) / SUPERSAMPLING;
          const sampleY = pixelY + (subY + 0.5) / SUPERSAMPLING;
          let sample = insideShape(shape, sampleX, sampleY, size)
            ? backgroundAt(colors, sampleX, sampleY, size)
            : TRANSPARENT;
          if (shadow && (shape === 'none' || sample.alpha > 0)) {
            const ellipseX = (sampleX - size / 2) / shadowRadiusX;
            const ellipseY = (sampleY - shadowCenterY) / shadowRadiusY;
            if (ellipseX * ellipseX + ellipseY * ellipseY <= 1) sample = blendOver(sample, colors.shadow, SHADOW_OPACITY);
          }
          const artX = Math.floor((sampleX - artLeft) / artScale);
          const artY = Math.floor((sampleY - artTop) / artScale);
          if (artWidthRatio > 0 && artX >= 0 && artY >= 0 && artX < art.width && artY < art.height) {
            const artOffset = (artY * art.width + artX) * 4;
            if (art.pixels[artOffset + 3] > 0) {
              sample = {
                red: art.pixels[artOffset],
                green: art.pixels[artOffset + 1],
                blue: art.pixels[artOffset + 2],
                alpha: 1,
              };
            }
          }
          sumRed += sample.red * sample.alpha;
          sumGreen += sample.green * sample.alpha;
          sumBlue += sample.blue * sample.alpha;
          sumAlpha += sample.alpha;
        }
      }
      const offset = (pixelY * size + pixelX) * 4;
      if (sumAlpha > 0) {
        pixels[offset] = Math.round(sumRed / sumAlpha);
        pixels[offset + 1] = Math.round(sumGreen / sumAlpha);
        pixels[offset + 2] = Math.round(sumBlue / sumAlpha);
        pixels[offset + 3] = Math.round((sumAlpha / sampleCount) * 255);
      }
    }
  }
  return { width: size, height: size, pixels };
}

function writePng(path, image) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, encodePng(image.width, image.height, image.pixels));
  console.log(`${path.slice(PROJECT_DIRECTORY.length + 1)}: ${image.width}x${image.height}`);
}

const server = await createServer({
  root: PROJECT_DIRECTORY,
  configFile: false,
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
});
try {
  const { PALETTE } = await server.ssrLoadModule('/src/game/elements/Palette.ts');
  const { heroHeadImage } = await server.ssrLoadModule('/src/tools/spriteBaker/SpriteCatalog.ts');
  const art = heroHeadImage();
  const colors = {
    backgroundCenter: toColor(PALETTE.mist),
    backgroundEdge: toColor(PALETTE.mossDeep),
    shadow: toColor(PALETTE.ink),
  };

  for (const density of ANDROID_DENSITIES) {
    const folder = join(ANDROID_RES_DIRECTORY, density.folder);
    const legacySize = Math.round(48 * density.scale);
    const adaptiveSize = Math.round(108 * density.scale);
    writePng(
      join(folder, 'ic_launcher.png'),
      renderIcon(art, colors, { size: legacySize, artWidthRatio: 0.74, shape: 'rounded', shadow: true }),
    );
    writePng(
      join(folder, 'ic_launcher_round.png'),
      renderIcon(art, colors, { size: legacySize, artWidthRatio: 0.66, shape: 'circle', shadow: true }),
    );
    writePng(
      join(folder, 'ic_launcher_foreground.png'),
      renderIcon(art, colors, { size: adaptiveSize, artWidthRatio: 0.5, shape: 'none', shadow: true }),
    );
    writePng(
      join(folder, 'ic_launcher_background.png'),
      renderIcon(art, colors, { size: adaptiveSize, artWidthRatio: 0, shape: 'square', shadow: false }),
    );
  }

  writePng(
    join(ANDROID_MAIN_DIRECTORY, 'ic_launcher-playstore.png'),
    renderIcon(art, colors, { size: 512, artWidthRatio: 0.72, shape: 'square', shadow: true }),
  );

  const faviconImages = [16, 32, 48].map((size) =>
    renderIcon(art, colors, { size, artWidthRatio: 1, shape: 'none', shadow: false }),
  );
  mkdirSync(PUBLIC_DIRECTORY, { recursive: true });
  writeFileSync(join(PUBLIC_DIRECTORY, 'favicon.ico'), encodeIco(faviconImages));
  console.log('public/favicon.ico: 16, 32, 48');
  writePng(
    join(PUBLIC_DIRECTORY, 'favicon.png'),
    renderIcon(art, colors, { size: 192, artWidthRatio: 0.96, shape: 'none', shadow: false }),
  );
  writePng(
    join(PUBLIC_DIRECTORY, 'apple-touch-icon.png'),
    renderIcon(art, colors, { size: 180, artWidthRatio: 0.72, shape: 'square', shadow: true }),
  );
} finally {
  await server.close();
}
