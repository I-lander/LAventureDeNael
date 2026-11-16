# L'aventure de Nael

## Who writes the prompts
- Prompts are written by an 8-year-old child.
- When a request lacks detail, do not guess silently: offer 2 to 4 concrete options as a choice (AskUserQuestion), each with a short, visual description, and suggest related improvements as extra options.
- Questions and options in simple French, short sentences, no technical jargon.

## Commands
- Read and search files with the Read, Glob and Grep tools, never with `head`, `cat` or `python -c` in Bash.
- Write any data-processing script to a `.py` or `.mjs` file under `tools/`, then run it with one command (`python tools/x.py`), instead of inline `python -c` or `node -e`.
- Edit files with the Edit tool, never with `sed`, a `for` loop or an `if` in Bash.
- One simple command per Bash call (e.g. `npx tsc --noEmit`): no `cd`, no `&&` chaining, no loops.
- Run commands from the project root, with paths relative to it.

## Code rules

### General rules
- **Never comment code**
- **Never use single-letter variable names.** Always use explicit, descriptive names:
  - `g` -> `graphics`
  - `ts` -> `tileSize`
  - `rt` -> `renderTexture`
  - `px` -> `pixelUnit`
  - `x`, `y` acceptable for coordinates
  - `i`, `j` acceptable for loop indices
  - `t` -> `interpolation` or a descriptive name
  - `dx`, `dy` acceptable for deltas/offsets

### TypeScript
- Explicit types when it improves readability
- Avoid `any` unless absolutely necessary, and flag it
- Use Phaser types when relevant
- Clearly declare class properties
- Initialize or guard potentially null properties
- Watch for `strictNullChecks`, uninitialized properties, callbacks losing context, confusion between Phaser GameObjects and Physics Objects types
- Never write comments in code. No inline comments, no block comments, no JSDoc, no TODO comments. The code must speak for itself.
