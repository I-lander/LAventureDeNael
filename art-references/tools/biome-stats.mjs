import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { createServer } from 'vite';
import { encodePng } from '../../png-encoder.mjs';

const PROJECT_DIRECTORY = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const server = await createServer({
  root: PROJECT_DIRECTORY,
  configFile: false,
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
});
const COLORS = {
  forest: [94, 177, 56],
  snow: [235, 251, 255],
  volcano: [86, 71, 96],
  desert: [240, 190, 90],
  swamp: [78, 74, 37],
};
try {
  const generator = await server.ssrLoadModule('/src/game/objects/world/WorldGenerator.ts');
  const size = 400;
  const step = 4;
  const counts = {};
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const biome = generator.biomeAtTile((x - size / 2) * step, (y - size / 2) * step);
      counts[biome] = (counts[biome] ?? 0) + 1;
      const offset = (y * size + x) * 4;
      pixels.set([...COLORS[biome], 255], offset);
    }
  }
  console.log(Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, ((value / (size * size)) * 100).toFixed(1) + '%'])));
  writeFileSync(process.argv[2], encodePng(size, size, pixels));
} finally {
  await server.close();
}
