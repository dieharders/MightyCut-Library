# @mightycut/library

The shared **single source of truth** for MightyCut's component system — components,
treatments, themes, FX descriptors, and the Zod contracts. Consumed by BOTH the render
harness (`../MightyCut`) and the web UI (`../MightyCut-WebUI`), so the exact same
component `build()` code drives final MP4 renders and interactive previews.

## Quick Start

If additions or edits are made to the library,

1. Rebuild the engine:

   ```bash
   pnpm build:engine
   ```

2. Commit the new code in `/dist` and push to origin

To sync changes to the WebUI consumer, pull latest from the submodule:

```bash
git -C packages/library pull        # (or: git submodule update --remote packages/library)
pnpm install                        # pnpm COPIES the file: dep into its store, required
```

To sync changes to the media server consumer:

```bash
# after a normal clone:
git submodule update --init --recursive
# git submodule update --remote packages/mightycut-library
```

## Layout

```
src/
  components/        the typed "trio" system (runtime/, primitives/, treatments/,
                     themes/block.ts, compose.ts, registry.ts, icons.ts, sample-spec.ts)
  types/             the Zod contract cluster (spec, storyboard, transitions, deck, components)
  pipeline/          mini-dom + sub-composition (dependency-free render utilities)
  util/issues.ts     ZodError → compact issue list (shared with the harness)
  engine/            browser engine: mountPreview + loadTheme + THEMES (per-theme lazy chunks)
assets/
  fx/                mc.js (window.MC) + gsap.min.js — the deterministic animation runtime
  themes/block/      self-hosted block theme fonts
```

## Consumers

- **Harness (Bun):** resolves this package to TS source via a `tsconfig` `paths` alias
  (`@mightycut/library/*` → `../MightyCut-Library/src/*`). Bun handles the trio's
  `import … with { type: "text" }` natively; no build step.
- **Web UI (Vite):** imports the prebuilt browser engine (`@mightycut/library/engine`).
  `pnpm build:engine` (Vite) produces `dist/engine/` with the base runtime in one chunk
  and each theme's registration code-split into its own `register-<theme>.js`, so the
  UI lazy-loads one payload per theme (`loadTheme('block')`).

## Scripts

```
pnpm typecheck      # tsc --noEmit
pnpm test           # bun test (runtime + registry tripwires)
pnpm build:engine   # vite build → dist/engine (per-theme lazy chunks)
```

> Keep zod pinned to the exact version the harness uses (`4.0.0`) — a version skew makes
> schemas typed by one side incompatible with the other.
