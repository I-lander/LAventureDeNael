---
name: pixel-art-style
description: Pixel art style guide. Use it before drawing or redrawing any sprite (enemies, eyes, cultist, biomes, decor, UI) in src/tools/spriteBaker, and before generating a reference image with Gemini (Nano Banana). Defines what "hand-drawn, not procedural" means, the shading and outline rules, the anti-patterns that make a sprite look generated, the Gemini reference workflow with its user validation gate, the trace method that turns an approved reference into animated layers, and the draw, render, review loop with its done checklist.
---

# Pixel art style

Every sprite must look placed by hand, pixel by pixel, by a pixel artist. A viewer must never be able to guess the geometric primitive or the formula behind a shape.

References that pass: `src/tools/spriteBaker/SlimeArt.ts`, `src/tools/spriteBaker/GhostArt.ts`, `src/tools/spriteBaker/MouseArt.ts` (multi-part creature: head with ears, body with feet, tail, two gloves).
Counter-example (rejected): a first mouse built from ellipses and capsules, each part shaded by a script with the same rim recipe. It read as glued balls with a white rim on every part.

## 1. Authoring format

- The art is literal character grids in the source (`string[]` rows plus a `PixelLegend`), painted with `HandPixelArt` (`paintPixelRows`, `paintPart`, `stretchRows`, `leanAbove`, `sealOutline`).
- Every legend color comes from `PALETTE` (`palette.ts`). No `mixHex`, `buildRamp`, `material`, `paintShapes` or seeded random in a sprite drawer.
- A script may sketch a **silhouette** as a starting point. Everything inside the silhouette (shading, outline, details, face) is decided by hand, cluster by cluster. A script that shades parts automatically is exactly what produces the procedural look: do not use one for the final art.
- A Gemini reference image approved by the user (section 9) is traced onto the game grid with the trace method (section 10): one palette symbol per cell, then cut into animated layers and cleaned by hand. It is never rescaled and pasted as an image.

## 2. Silhouette first

- Design one silhouette for the whole creature, readable as a solid black shape at 1x. It carries the pose and the character: a lean, a hunch, a raised fist, an asymmetric ear.
- A creature is **not** a union of circles and capsules. Ears, heads and bodies get hand-drawn contours with flats, corners and tapering, not perfect ellipses.
- Proportions are chibi: big head, readable face, small limbs. The creature fills about 70 to 85% of its 64x64 canvas, with at least 1 empty pixel on every side in every frame (never clipped).
- Facing: creatures look left, toward the player.

## 3. Shading: few large masses

- One light source, top-left, for the whole sprite.
- Per material: 3 to 4 tones (shadow, base, light, optional highlight). Each tone is a **large, shaped cluster**, not a band that follows every edge.
- Shade the **volume of the whole creature**, not each part separately. The head casts a shadow on the body under the chin; an arm in front casts a shadow on the torso; a back limb is darker than a front limb.
- The light reads as one crescent or plane on the main mass (see the slime's dome). Small parts (arms, ears, feet) get at most one light cluster and one shadow cluster.
- A highlight is rare and deliberate: one specular spot on a glossy surface, a glint in an eye. Never a rim of white around every shape.

## 4. Outline

- Colored selective outline: a darker shade of the local color, almost black on the shadow side, lighter on the lit side (top-left).
- Internal lines only where two forms overlap and must separate (an arm in front of the body, a head over a torso). Use the darker local tone, never a full black ring around each part. Break internal lines where the light hits.
- `sealOutline` repairs edges exposed by a pose transform. It is a safety net, not a way to draw the outline.

## 5. Clusters and detail

- No isolated single pixels, except deliberate ones (eye glint, specular, whisker tip).
- No dithering checkers, no noise, no 1-pixel alternating stripes, no gradients made of thin bands.
- Every detail is a designed shape: a 2 to 3 pixel tooth, a 3-pixel whisker line, a 2x2 nostril. Details are few and chosen to sell the character.
- Each material is limited to 3 or 4 colors; the whole sprite stays around 8 to 12 colors.

## 6. Faces

- The face is the focal point: large, high contrast, drawn as its own grid (open and blink variants).
- Eyes on a 64 canvas are 6 to 8 pixels wide, with a shaped lid or brow that carries the expression (angry, smug, scared). A pupil is at least 2x2 and has a glint when the eye is open.
- Mouths and teeth are designed shapes with an inner dark and, when open, a tongue or throat tone.

## 7. Animation

- Few layers: typically body, head, face, front limb, back limb.
- Poses come from moving layers (`rigFor`, `reachOffset`), stretching rows (`stretchRows`, breathing), leaning (`leanAbove`, attacks), and swapping hand-drawn variants (blink, tail positions).
- Each layer is drawn so that it still connects to the body at the extreme offset of the pose (overlap columns, no gap).
- A creature that stands on the ground keeps its feet planted: paint the feet with `plantedPart(feet, -rig.torso[1])` at `[rig.torso[0], 0]`, so breathing never lifts them. A creature that does not fly gets no wing flap and no vertical bob of the whole sprite.
- The silhouette must stay clean at every frame: check attack peaks and hit frames, not only rest.

## 8. Anti-patterns (procedural tells)

| Tell | What it looks like | Fix |
| --- | --- | --- |
| Pillow shading | every part has light on its top-left rim and dark on its bottom-right rim | shade the creature's volume once; one light cluster per form |
| Stacked primitives | head, ears, gloves read as circles glued together | redraw contours by hand with flats and tapers |
| Outline rings | a black ring around every part, inside the body too | outline the silhouette; internal lines only at overlaps, in local dark tone |
| White rim | thin light border hugging every edge | one light plane on the main mass |
| Striped thin parts | 1 to 2 pixel wide tails or limbs alternating tones | a single tone plus outline, or make the part thicker |
| Floating details | dots near the silhouette (whiskers, sparks) not attached | attach to the form or remove |
| Uniform rim shadow | dark stripe of constant width down one side | shadow as a shaped mass that widens where the form turns away |

## 9. Gemini reference images

Gemini (Nano Banana Pro, `gemini-3-pro-image`) produces a reference image that fixes the construction and the look before any pixel is placed. Key `GEMINI_API_KEY` in `.env`. Paid usage: generate 2 variants per subject, and ask the user before a batch of more than about 10 images.

### Command

```
python .claude/skills/pixel-art-style/scripts/generate_reference.py --prompt <prompt.txt> --image <image 1> [--image <image 2> ...] --out <path without extension> [--count 2] [--aspect-ratio 1:1]
```

Images are sent in order, and the prompt names them "image 1", "image 2". Give each image a single role, instead of a composite sheet:

| Role | Image | Prompt says |
| --- | --- | --- |
| Style | approved game sprites at the same scale, on the game background | match exactly the outline, tones, shading, face style, pixel size |
| Content | the user's own drawing of the subject, when one exists (`git show <commit>:public/assets/...` for older art) | keep the design: silhouette, pose, proportions, expression, colors |
| Geometry | the current sprite, only when the texture is composed with others (mirror frame over its glass, hood over the eye mask) | keep exactly the silhouette and every empty area |
| Sprite to improve | the current sprite at 8x on `#2a2030`, as image 1, with the style sheet as image 2 | improve image 1, keep the head, face, palette, size and framing, fix the listed problems |

### Improving an existing sprite: the prompt that works

The phrasing decides the outcome:

- "Keep the design of image 2" (the current sprite as content): Gemini copies the sprite almost pixel for pixel. Nothing improves.
- A free redesign from a description: Gemini drifts to a detailed, realistic style that clashes with the game (fur strands, thin claws, heavy outline).
- What works: an **edit** of the current sprite. Image 1 is the sprite, image 2 the approved style sheet. The prompt keeps the style, palette, size, framing, head, face and facing, allows redrawing the body, limbs, wings and tail, and lists each problem to fix as a concrete anatomy instruction ("the front arm is a flat bar across the belly: redraw it with a shoulder, an elbow and a clawed hand"). Inspect the sprite at 8x and name the defects before writing the prompt.

Because the framing is kept, the head of the reference lands on the head of the game sprite, which makes the trace method (section 10) possible.

A variant that fails for a transient reason (network, 429, 5xx, empty answer) is retried once; a blocked prompt or a bad key is not. The script refuses an `--out` that already has outputs, so an approved reference is never overwritten: use a new name per run. It ends with "N of M variants written" and exits 1 when none was written. `GEMINI_API_KEY` may also come from the environment.

### Prompt checklist

- The style traits in words: pixel grid, outline color and weight, 3 to 4 flat tones per material, light from the top-left, no dithering, no gradients, face style.
- The colors as `INK` hex values, or "the colors of image N".
- The subject, the view (state "strictly front view, symmetric" or "facing left": Gemini defaults to a three-quarter view) and every anatomy landmark that matters.
- Empty areas that must stay empty (a face opening where the game draws eyes, the inside of a frame).
- Output: one single sprite, centered, about 85% of the image, plain flat background `#2a2030`, nearest-neighbor crisp pixels, no text, no ground line, no shadow.

### Validation gate (mandatory, after every generation)

Build a comparison sheet: style reference, the user's drawing if any, then each variant, at the same scale. Show it to the user and **stop**. Draw from a variant only after the user approved it, and note the approved file. A reference the user did not approve is never drawn from, however good it looks. When the user rejects the direction, ask what is wrong before generating again.

State, when presenting: fit to the style reference (detail density, outline, face, palette brightness and saturation), fidelity to the user's drawing, and the deviations you see.

### Known limits

- Gemini does not keep a pixel size: it draws on a grid of about 50 to 100 cells whatever the request, with off-palette, antialiased colors. Never rescale its output into a sprite (BOX or LANCZOS blurs and mixes tones): trace it (section 10).
- Its background is close to `#2a2030` but not exact: the trace script samples the corner.
- It does not reproduce a geometry exactly. If a texture must line up with others, plan to draw the grids by hand on the current geometry, or to change the composition code, and say which.
- Some variants come back empty: generate again rather than settling for a single choice.

## 10. Trace method: from an approved reference to animated layers

Approved by the user on 2026-11-10 after a hand redraw over a blurred guide drifted too far from the reference ("il me faut un résultat plus proche"). Reference results: `DragonArt.ts`, `AncientDragonArt.ts`, `MedusaArt.ts`.

Scripts in `.claude/skills/pixel-art-style/scripts/`; work files (trace, parts file) go in the scratchpad.

1. **Trace.** One palette symbol per cell, by majority vote over the inner part of each cell, colors read from the drawer's legend:
   ```
   python .claude/skills/pixel-art-style/scripts/trace_reference.py --image <approved.jpg> --art src/tools/spriteBaker/<Name>Art.ts --legend <NAME>_LEGEND --out <scratchpad>/<name>-trace.txt
   ```
   Read the printed grid (columns are numbered), and render it next to the current sprite with the head mask overlaid before cutting anything. Options:
   - `--outline O` when the legend's outline symbol is not `o` (Spartan, Slenderman). A drawer with two legends (BlazingEye: flame and eye) is traced once per legend and the parts file picks each region from its trace.
   - `--flood 120` when the background is uneven or a dark material is close to it (black cat, dark boots): the background becomes the pixels connected to the image border, so a near-background fur stays filled. Add `--no-outline-rule` when that dark material is still read as outline.
   - `--no-outline-rule` alone when a dark material (wing membrane) comes out as outline; then map in the parts file: interior outline cells to the membrane symbol, the pupil black to outline, off-material colors (a blue highlight in a beard) to the right tone.
   - An enclosed gap (between legs) keeps a background-colored symbol: empty it in the parts file, or it shows as a dark block on the biome.
2. **Cut into layers** in a parts file that builds `PARTS = {name: spec}` with `trace_lib` (`load_trace`, `read_part_mask`, `cells_to_spec`, `keep_inside_canvas`, `show`):
   - Keep the game's face grids (open and blink): skip trace cells inside the head area (a rectangle, or `read_part_mask(art, '<NAME>_HEAD')`). Check first that the reference head lands on the game head. Trace cells around the head that the old head does not cover (ears, whiskers, a different crest) go in a `<NAME>_HEAD_EXTRA` layer painted at the head offset before the head. When the reference head differs a lot (Spartan helmet), trace the whole head instead and repaint the traced eyes with the visor or skin tone so the face overlay and its blink sit on a clean surface.
   - Faces drawn as overlays on raw grids (Slime, Ghost) stay at their absolute position: replace the traced face pixels with the surrounding body tone, then recompute the face offset, the body origin and the stretch pivot from the new grid.
   - Static mass (body, wing, tail, coil) in one layer moving with `rig.torso`.
   - Each moving limb (front arm for the claw swipe) bounded row by row by its own outline line (a `{row: (left, right)}` table read from the printed grid), excluding the colors that belong behind it. Fill the cells under it in the body layer with the local body tone, so the swipe never reveals a hole.
   - Feet: rows from the bottom of the body down, planted with `plantedPart`; repeat the first two rows in the body layer so they overlap.
   - Parts that sway on their own (snakes) as separate layers grouped by region; pixels that overlap the hair go in the head layer so necks stay attached.
   - `keep_inside_canvas(cells, 63 - recoil - 1)` on layers near the right edge: the hit recoil pushes 2 pixels right.
   - Preview the composition with `show(PARTS, order)` before injecting.
3. **Inject**, then update the draw function by hand (paint order, removed parts, `plantedPart` for the feet):
   ```
   python .claude/skills/pixel-art-style/scripts/inject_parts.py --art src/tools/spriteBaker/<Name>Art.ts --parts <scratchpad>/<name>_parts.py --anchor "const <NAME>_LEGEND" [--remove OLD_PART,OTHER_PART]
   ```
4. **Check every frame.** `npm run preview:sprites`, then a sheet of `idle-1`, `attack-0`, `attack-1` and `hit-0` at the same scale: nothing detached, nothing clipped, feet on the same bottom row. Fix clipping by moving a sway or anchoring a layer, not by shrinking the art.
5. **Clean by hand** what the trace got wrong: stray pixels, broken outline cells reported by the audit, a cut that leaves a seam.
6. **Show** the baked sprite next to the approved reference at the same scale, and wait for the user's approval. The preview also rebakes the other atlases: restore those that are not part of the change (`git checkout -- public/assets/sprites/<family>.*`).

## 11. Loop and done checklist

1. For a new or redrawn subject, generate and validate a Gemini reference first (section 9), then trace it (section 10). Small fixes to an existing grid are drawn by hand.
2. `npm run preview:sprites`, then read `sprite-preview/enemy-<id>.png` (or the family sheet) and judge it as a pixel artist would: silhouette, masses, face, procedural tells from section 8.
3. Fix and repeat until the checklist passes:
   - [ ] Silhouette readable as a solid shape; no visible primitive.
   - [ ] One light direction; shading in few large clusters; no pillow shading or rim on every part.
   - [ ] Selective colored outline; internal lines only at overlaps.
   - [ ] No stray pixels, dithering, noise, or striped thin parts.
   - [ ] Face large and expressive; open and blink variants both read.
   - [ ] All frames: nothing clipped, no gap between layers, outline closed.
   - [ ] Audit line for the sprite in the bake output is empty (palette, clipping, stray, outline gaps), or each remaining item is intentional.
