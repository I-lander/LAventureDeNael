import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { encodePng } from './png-encoder.mjs';

const PROJECT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIRECTORY = join(PROJECT_DIRECTORY, 'public', 'assets', 'sprites');
const PREVIEW_DIRECTORY = join(PROJECT_DIRECTORY, 'sprite-preview');
const PREVIEW_SCALE = 4;
const PREVIEW_BACKGROUND = [0x2a, 0x20, 0x30];

function upscaleOnBackground(image, scale) {
  const width = image.width * scale;
  const height = image.height * scale;
  const output = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const source = (Math.floor(y / scale) * image.width + Math.floor(x / scale)) * 4;
      const target = (y * width + x) * 4;
      const opaque = image.pixels[source + 3] > 0;
      output[target] = opaque ? image.pixels[source] : PREVIEW_BACKGROUND[0];
      output[target + 1] = opaque ? image.pixels[source + 1] : PREVIEW_BACKGROUND[1];
      output[target + 2] = opaque ? image.pixels[source + 2] : PREVIEW_BACKGROUND[2];
      output[target + 3] = 255;
    }
  }
  return { width, height, pixels: output };
}

const writePreview = process.argv.includes('--preview');

const server = await createServer({
  root: PROJECT_DIRECTORY,
  configFile: false,
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
});
try {
  const { buildSpriteCatalog } = await server.ssrLoadModule('/src/tools/spriteBaker/SpriteCatalog.ts');
  const { packAtlas } = await server.ssrLoadModule('/src/tools/spriteBaker/packAtlas.ts');
  mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  if (writePreview) mkdirSync(PREVIEW_DIRECTORY, { recursive: true });
  for (const source of buildSpriteCatalog()) {
    const atlas = packAtlas(source);
    const { width, height, pixels } = atlas.image;
    writeFileSync(join(OUTPUT_DIRECTORY, `${atlas.key}.png`), encodePng(width, height, pixels));
    writeFileSync(join(OUTPUT_DIRECTORY, `${atlas.key}.json`), `${JSON.stringify(atlas.json, null, 2)}\n`);
    console.log(`${atlas.key}: ${width}x${height}, ${source.frames.length} frames`);
    if (writePreview) {
      const preview = upscaleOnBackground(atlas.image, PREVIEW_SCALE);
      writeFileSync(join(PREVIEW_DIRECTORY, `${atlas.key}.png`), encodePng(preview.width, preview.height, preview.pixels));
    }
  }
} finally {
  await server.close();
}
