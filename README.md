# @mightycut/library

The shared **single source of truth** for MightyCut's component system — components, treatments, themes, FX descriptors, and the Zod contracts. Consumed by BOTH the render harness (`../MightyCut`) and the web UI (`../MightyCut-WebUI`), so the exact same component `build()` code drives final MP4 renders and interactive previews.

## Quick Start

If additions or edits are made to the library,

1. Commit the new code and push to origin

To sync changes to the WebUI consumer, pull latest from the submodule:

```bash
git submodule update --remote packages/mightycut-library
```

This is run automatically for you during the build/dev step to rebuild the engine:

```bash
pnpm build:engine
```

To sync changes to the media server consumer:

```bash
# after a normal clone:
git submodule update --init --recursive
```

## Layout

```
src/
  components/        the typed "trio" system (runtime/, primitives/, treatments/,
                     themes/<theme>/, compose.ts, registry.ts, icons.ts, sample-spec.ts)
  types/             the Zod contract cluster (spec, storyboard, transitions, deck, components)
  pipeline/          mini-dom + sub-composition (dependency-free render utilities)
  util/issues.ts     ZodError → compact issue list (shared with the harness)
  engine/            browser engine: mountPreview + loadTheme + THEMES (per-theme lazy chunks)
assets/
  fx/                mc.js (window.MC) + gsap.min.js — the deterministic animation runtime
  fonts/             the self-hosted core chrome fonts (a superset of every live theme's)
docs/
  THEME-AUTHORING.md how to create, wire up and verify a new theme
```

## Docs

- **[Theme Authoring Guide](docs/THEME-AUTHORING.md)** — the full contract for a new theme:
  what themes share vs. own, the palette-role colour system, the template/CSS/animation rules,
  backdrops (a shared pool) and decorations (theme-exclusive), a copy-paste starter skeleton,
  the wiring checklist, and what the test sweeps already cover for you.

## Consumers

- **Harness (Bun):** resolves this package to TS source via a `tsconfig` `paths` alias (`@mightycut/library/*` → `../MightyCut-Library/src/*`). Bun handles the trio's `import … with { type: "text" }` natively; no build step, code is used raw.

- **Web UI (Vite):** imports the browser engine build (`@mightycut/library/engine`), which the consumer produces by running `pnpm build:engine` here during its own install/build step (`dist/` is not committed — see [Scripts](#scripts)). Vite produces `dist/engine/` with the base runtime in one chunk and each theme's registration code-split into its own `register-<theme>.js`, so the UI lazy-loads one payload per theme (`loadTheme('block')`); `tsc` emits matching types to `dist/types/`.

## Scripts

```
pnpm gen:fonts      # inline theme fonts → src/engine/block-fonts.generated.ts
pnpm typecheck      # tsc --noEmit
pnpm test           # bun test (runtime + registry tripwires)
pnpm build:engine   # vite build → dist/engine (per-theme lazy chunks) + tsc → dist/types
```

> `gen:fonts` runs automatically as a prestep before `typecheck`, `test`, and `build:engine`. **`dist/` and `src/engine/block-fonts.generated.ts` are generated, not committed.**

> `src/` is the source of truth; the WebUI consumer rebuilds the engine (`pnpm build:engine`) in its own install/build step, so there's no `dist/` to commit here.

> Keep zod pinned to the exact version the harness uses (`4.0.0`) — a version skew makes schemas typed by one side incompatible with the other.
