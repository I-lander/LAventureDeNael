---
name: game-architecture
description: Architecture conventions for Phaser 3 + TypeScript games (DiceWhisper is the reference. Use it to create or refactor a game's file structure, organize code, or add a scene, an object, a UI component or a piece of gameplay data. Answers the question "where should this file / this code go?".
---

# Phaser + TypeScript game architecture

Shared architecture reference for all games (DiceWhisper is the model project). When creating a new game or refactoring an existing one, the structure and conventions below must be followed exactly.

## Canonical tree

```
src/
├── main.ts                       # real entrypoint: platform detection (Capacitor), calls initPhaserGame()
├── global.d.ts                   # global declarations (e.g. window.splashStartTime)
├── vite-env.d.ts
└── game/
    ├── main.ts                   # Phaser config + new Phaser.Game(config)
    ├── customClasses/            # base classes the game extends
    │   └── CustomScene.ts        # parent of ALL gameplay scenes
    ├── elements/                 # pure DATA LAYER (types + constants + lookups). No game logic, no Phaser
    │   ├── types.ts              # shared interfaces/types/unions
    │   ├── <Domain>.ts           # one file per domain: data array + getXxxDef()
    │   ├── Rarity.ts             # enums/unions + association tables (colors, values)
    │   ├── constants.ts          # tuning constants (STARTING_*, cooldowns, cost formulas)
    │   └── index.ts              # re-exports the whole folder (single import point)
    ├── objects/                  # game objects (logic, entities, managers)
    │   ├── staticClasses/        # global singletons: state, save, options, sound
    │   ├── <domain>/             # one subfolder per system (combat/, dice/, worldMap/...)
    │   └── <Entity>.ts           # reusable visual entities (EyeBall, Crystal...)
    ├── ui/                       # interface components (cards, panels, buttons, HUD widgets)
    ├── scenes/                   # Phaser scenes only
    ├── shaders/                  # WebGL PostFX pipelines (export default)
    └── utils/                    # pure helpers, format, versionTag, translations/
```

## Placement rule: "where does this code go?"

| What you write | Folder | Hint |
|---|---|---|
| Type, interface, union, content data (enemy list, item list...) | `elements/` | No Phaser dependency, no logic |
| Persistent global state, save, options, sound manager | `objects/staticClasses/` | Singleton, accessed from anywhere |
| Gameplay system (combat engine, spawner, day/night cycle) | `objects/<domain>/` | Game logic, may be functional |
| Displayable entity reused across multiple scenes | `objects/<Entity>.ts` | Extends a GameObject or composes GameObjects |
| Card, button, panel, health bar, HUD | `ui/` | Presents / interacts, not a world entity |
| Scene | `scenes/` | Extends `CustomScene` (or `Phaser.Scene` for Loading) |
| Full-screen visual effect | `shaders/` | `export default class ... extends PostFXPipeline` |
| Stateless utility function | `utils/` | Pure, testable in isolation |

## Naming conventions

- **Class / scene / type-module files**: `PascalCase.ts` (`CombatEngine.ts`, `CampScene.ts`, `EyeCard.ts`).
- **Utility / barrel files**: `camelCase.ts` (`utils.ts`, `format.ts`, `index.ts`, `constants.ts`).
- **Classes, interfaces, types, enums**: `PascalCase`.
- **Functions and variables**: `camelCase`.
- **Module constants**: `UPPER_SNAKE_CASE` (`EYE_COOLDOWN`, `STARTING_GOLD`, `FRONT_DEPTH`).
- **Assets**: `kebab-case` (`eye-dragon.png`, `dice-roll.wav`).
- **Scene keys**: the string key equals the class name (`super('CampScene')`).

## Imports

- **Named exports everywhere**, except shaders (`export default`).
- The `elements/` folder is ALWAYS imported through its barrel: `import { EyeDef, EYES, getEyeDef } from '../elements'` (never `../elements/Eyes`).
- Relative imports only (no path aliases), matching the tsconfig (`moduleResolution: Bundler`, no `paths`).
- Recommended import order: (1) external libs (phaser, @capacitor/*), (2) scenes, (3) objects, (4) elements, (5) staticClasses, (6) ui, (7) utils.

## main.ts (Phaser config)

- Exports `initPhaserGame()`, called from `src/main.ts`.
- Fixed 16:9 resolution (`2560 x 1440`), `scale.mode = FIT`, `autoCenter = CENTER_BOTH`.
- `type: Phaser.WEBGL`, `powerPreference: 'high-performance'`, `autoMobilePipeline: true`, `fps.target: 60`.
- `parent: 'game-container'`, `disableContextMenu: true`.
- The `scene: [...]` array defines the order: the loading scene FIRST.

## CustomScene (customClasses/)

Base class for all gameplay scenes. It provides:
- shared properties `crtShader`, `tileSize`, `pixelUnit`;
- a `create()` that refreshes the scale after a short delay;
- `updateShader()` (syncs CRT uniforms with the canvas size);
- `shakeScreen(duration, intensity)` (screen shake + shader offset).

Every gameplay scene does `extends CustomScene` and calls `super.create()` at the top of its own `create()`. The loading scene may stay `extends Phaser.Scene` (no shaders needed).

## Scenes

- Each scene computes its reference frame at the start of `create()`: `tileSize = cameras.main.height / 18`, `pixelUnit = tileSize / 16`.
- `LoadingScene`: loads assets in `preload()`, starts the first scene + the HUD in `create()`. No rendering (the splash is handled in HTML).
- A persistent HUD scene is launched via `scene.launch(...)` + `scene.bringToTop(...)` and overlays the gameplay scenes.
- Scene-to-scene communication: direct references (`this.scene.get('XxxScene') as XxxScene`), no implicit event bus. Shared state goes through the `staticClasses/` singleton.

## elements/ (data layer)

- `types.ts` contains ONLY types/interfaces/unions, no heavy runtime values.
- One file per content domain: it exports the data array (`EYES`, `ENEMIES`...) AND its lookup function (`getEyeDef(id)`). The lookup lives next to its data.
- Association tables (color per rarity, value per rarity) live with their enum/union (`Rarity.ts`).
- `constants.ts`: tuning values and pure formulas (`getFloorCost`).
- `index.ts`: `export * from './...'` for each file, to offer a single import point.
- Importing Phaser or a game object from `elements/` is forbidden (data depends on nothing).

## objects/ and staticClasses/

- `staticClasses/` holds the global singletons: game state + save, options/preferences, sound/music manager, seeded RNG. Pattern: either a fully `static` class, or a singleton exposed via a `getXxx()` that memoizes a unique instance.
- Persistence: the save serializes/deserializes the full state and tolerates partial saves (`?? default` values, try/catch, `console.warn` on failure).
- `objects/<domain>/`: one gameplay system per subfolder. Pure logic (e.g. a combat engine) may be a module of functions operating on a `State` + an injected `Context`, rather than a class.
- Entities with a lifecycle are updated manually from the scene's `update()` (not via scattered listeners).

## ui/

- A component is a class that `extends Phaser.GameObjects.Container`, builds its children in the constructor, and calls `scene.add.existing(this)`.
- Exposes explicit setters (`setText`, `setEnabled`, `setSelected`, `setBadge`) and redraws via a private `redraw(hover)` method.
- UI components read data from `elements/` but never mutate state directly: they trigger callbacks provided by the scene.

## shaders/

- `export default class XxxShader extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline`.
- The class's public properties are the uniforms, pushed in `onPreRender()`.
- Registration/removal via `utils` helpers (`initShader`, `clearShader`).

## Code style rules (NON-NEGOTIABLE)

These rules come from the project `CLAUDE.md` and take precedence:
- **Never comment code**: no inline, block, JSDoc, or TODO comments. The code speaks for itself.
- **Never use single-letter variable names**: use explicit names (`graphics`, `tileSize`, `renderTexture`, `pixelUnit`, `interpolation`). Only exceptions: `x`/`y` (coordinates), `i`/`j` (loop indices), `dx`/`dy` (deltas).
- **Never use the em-dash `—`** in code, strings, or docs. Use `-`, `,`, `:`, `(...)` or `.`.
- Strict TypeScript (`strict: true`): explicit types when they aid readability, avoid `any` (flag it if unavoidable), handle null (`?.`, `??`, explicit guard), initialize or mark `!` class properties.
- Discriminated unions + type guards (`isXxx(value): value is Xxx`) for polymorphic data.

## Refactor checklist toward this format

1. Data crammed into one big file? -> split into `elements/` (types, one file per domain, constants, `index.ts` barrel).
2. Global state / save? -> `objects/staticClasses/`.
3. Gameplay system? -> `objects/<domain>/`.
4. Buttons, cards, panels? -> `ui/`.
5. Reusable world entities? -> `objects/<Entity>.ts`.
6. Delete dead stubs (`export {}`) and unused files.
7. Repoint all imports to the new paths (data consumers go through `../elements`).
8. `npx tsc --noEmit` must stay green before and after.
