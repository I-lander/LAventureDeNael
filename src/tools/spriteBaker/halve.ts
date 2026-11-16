import type { PixelGrid } from '../../game/elements';

const EMPTY = '.';

export function halveGrid(rows: PixelGrid): PixelGrid {
  const width = rows.reduce((widest, row) => Math.max(widest, row.length), 0);
  const halfWidth = Math.ceil(width / 2);
  const halfHeight = Math.ceil(rows.length / 2);
  const result: string[] = [];
  for (let y = 0; y < halfHeight; y++) {
    let line = '';
    for (let x = 0; x < halfWidth; x++) {
      const counts = new Map<string, number>();
      let opaque = 0;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const symbol = rows[y * 2 + dy]?.[x * 2 + dx] ?? EMPTY;
          if (symbol === EMPTY) {
            continue;
          }
          opaque += 1;
          counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
        }
      }
      if (opaque < 2) {
        line += EMPTY;
        continue;
      }
      let best = EMPTY;
      let bestCount = 0;
      counts.forEach((count, symbol) => {
        if (count > bestCount) {
          best = symbol;
          bestCount = count;
        }
      });
      line += best;
    }
    result.push(line);
  }
  return result;
}
