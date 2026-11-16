# Sprite redraw brief (v4)

## Why

The game sprites are drawn as character grids (`PixelGrid` rows plus a `PixelLegend`) in `src/tools/spriteBaker/half/<Family>Half.ts`. They were produced by an automatic trace of approved reference sheets and the user rejects them: "unreadable", and "pixels are missing, like in the hero's head". Measured causes:

- Holes: dark cells (eyes, outline) were mistaken for the background and left empty inside heads and bodies.
- Noise: JPEG artifacts became 20 to 40 near-identical colors per sprite, with lone pixels everywhere.
- Misaligned grid on some sprites (blurred, wrong cells).

Every sprite of your family must be redone from its reference model, then audited.

## Sources for your family

Everything is listed in `art-references/v4/<family>/family.json`:

- `reference`: the approved big-pixel sheet. It is the model. Silhouette, pose, proportions, colors and details come from it.
- `design`: higher resolution sheets of the same subjects, same order. Use them only to understand what an ambiguous cluster is (an eye, a buckle, a hand).
- `sprites[].cells` + `index`: the reference already sampled cell by cell (`cells.json`, exact colors, no holes), with `cells.png` showing reference next to sampled cells.
- `art`: the TypeScript file you rewrite. `palette`: the palette file you rewrite.
- `box` `[width, height, footRows]`: the frame the sprite must fit when its feet are centered. `max` `[width, height]`: hard size limit.
- `legends`: every legend the grid is rendered with (color variants).

## Tools (run from the project root, one command per Bash call)

```
python tools/ref_extract.py --image <sheet> --out art-references/v4/<family>/cells [--cell N] [--spread 0.05] [--tolerance 16] [--merge 20] [--min-area 300] [--scale 10] [--quiet]
python tools/ref_quantize.py --cells <cells.json> --palette art-references/v4/<family>/palette.json --sprites 0=NAME,1=NAME --legend <LEGEND_NAME> --out art-references/v4/<family>/draft [--auto <keyPrefix>]
python tools/audit_sprites.py --family art-references/v4/<family>/family.json --out sprite-preview/audit/<family> [--names A,B] [--scale 10]
python tools/sprite_sheet.py --file <art file> --out sprite-preview/audit/<family>-sheet.png [--scale 12] [--names A,B] [--legend NAME] [--holes] [--light]
```

- `ref_extract` only needs a rerun if `cells.png` shows a wrong grid or a wrong sprite split. Without `--quiet` it prints the dominant cell colors with their counts: use that list to design the palette.
- `ref_quantize` maps each reference cell to the nearest color of `palette.json` (`{"colors": [{"symbol": "k", "key": "heroInk", "hex": "#000228"}]}`), writes `draft.ts.txt` (grids and legend), `draft-palette.ts.txt` (palette lines) and `draft.png` (reference, cells, quantized). `--auto <keyPrefix>` writes a first automatic `palette.json` when the file does not exist yet: it is only a starting point, far too many tones.
- `audit_sprites` prints errors and warnings per sprite and writes `<family>.png` (reference, sprite, flags, diff) and `<family>-game.png` (small size on grass, as seen in game). Flags: magenta = hole or notch, yellow = lone cell, cyan = light cell on the silhouette edge. Diff: red = reference cell missing, green = cell added, orange = different color.

Read the PNG files with the Read tool: looking at the result is mandatory, numbers are not enough.

## Method

1. Look first: reference sheet, design sheet, `cells.png`, and the current state (`audit_sprites` before any change).
2. Design the palette by hand in `palette.json`: one near-black outline ink, then 2 to 4 flat tones per material (shadow, base, light, rare highlight). Merge the JPEG variants of a tone into one color. Target 16 colors or fewer per sprite and the smallest family palette that keeps the model's look.
3. Quantize, read `draft.png`, adjust the palette until the quantized column is a clean copy of the reference.
4. Rewrite the art file and the palette file from the draft.
5. Hand pass, sprite by sprite, as a pixel artist: compare with the reference at the same scale and fix what the sampling got wrong. Faces first (two clear dark eyes, a readable mouth, glint only where the model has one), then outline (closed, dark, one cell thick), then lone pixels and JPEG crumbs, then clusters (flat, shaped, few).
6. Audit, read both PNG files, fix, repeat until there are 0 errors and every remaining warning is either fixed or deliberate (name why).

## Rules

- Fidelity: do not redesign. A viewer must recognize the reference model at once. Hand edits make it cleaner and more readable, never different.
- No empty cell enclosed inside a sprite. A real see-through gap (between two legs, under an arch) is fine when the model has it.
- Every row of a grid has the same length. Symbols are single characters (letters, digits), never `'` or `\`.
- Keep every exported name, every legend name and the meaning of each variant legend (see the family notes in your task). The file is imported by `src/tools/spriteBaker/SpriteCatalog.ts`: read how your exports are used there.
- Sprite sizes stay those of the reference cells (plus or minus one cell) and must pass the `box` / `max` checks.
- Palette file format, nothing else in the file:
  ```ts
  export const <PALETTE_CONST> = {
    heroInk: 0x000228,
  } as const;
  ```
  Every key starts with the family `keyPrefix` (`heroInk`, `heroHairBase`), is unique across the whole project, and every key is used by a legend. Remove the old `<x>2...` keys.
- Art file format: `import type { PixelGrid, PixelLegend } from '../../../game/elements';`, then `export const NAME: PixelGrid = [...]` and `export const NAME: PixelLegend = {...}`, as today.
- Project code rules apply (CLAUDE.md): no comments in code, no single-letter variable names, explicit names.
- Files you may write: your art file, your palette file, `art-references/v4/<family>/*`, `sprite-preview/audit/<family>*`, helper scripts named `tools/<family>_*.py`. Nothing else. Other agents work on the other families at the same time in the same folder.
- Never edit `SpriteCatalog.ts`, `HalfArtPalette.ts`, `Palette.ts` or the shared tools. If one of them needs a change, say so in your final report under "integration notes".
- Never run `npm run bake:sprites`, `npm run preview:sprites` or `npm run bake:icons`: they write shared files. `npx tsc --noEmit` may show errors from families still in progress: only your own files matter.

## Final report

Return plain text with: for each sprite its size, color count, audit errors (must be 0) and each warning you left with its reason; the family palette size; integration notes; anything you could not fix.
