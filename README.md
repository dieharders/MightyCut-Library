# @mightycut/library

The **single source of truth** for MightyCut's component system — components, treatments, themes,
FX descriptors, and the Zod contracts. The same component `build()` code drives final MP4 renders
and interactive previews.

**One consumer: the MotionBuff desktop app**, which includes this repo as a git submodule at
`packages/library`. The render harness and the web UI used to be the other two; neither is any
more — the harness *became* MotionBuff, and the web UI no longer depends on this library.

## Quick Start

Edit here, commit, push. Then in MotionBuff:

```bash
git submodule update --remote packages/library   # take the latest
# ...or pin a specific commit:
git -C packages/library checkout <sha>
git add packages/library                         # record the new pointer
```

The pointer is a real commit, which is the point of the submodule: checking out an old MotionBuff
commit gets the library that was current *then*, not whatever is newest.

After a fresh clone of a consumer:

```bash
git submodule update --init --recursive
```

The browser engine (`dist/`) is **not committed** — the consumer rebuilds it with
`bun run build:engine`. See [Scripts](#scripts).

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

## Rendering gotchas

- **No exit tweens inside a sub-composition — scene exits live on the root timeline.**
  HyperFrames renders by SEEKING a paused GSAP timeline, and a tween INSIDE a nested
  sub-composition that drives an element toward a _hidden_ end-state (opacity 0 / off-canvas)
  leaks that end-state BACKWARD across the whole scene — the content blanks partway through
  while its narration/caption is still on screen. An _entrance_ ends visible, so the identical
  leak is invisible; only exits show it. So `runtime/treatment.ts` `buildScene` emits the page
  **entrance** but never an **exit** (`sceneExitJs` is retained but unwired). The animated exit
  instead runs on the **root/master** timeline at the clip level — root-level tweens do NOT
  leak (captions, HUD and the progress bar animate there cleanly). The harness's
  `components/root-scenes.ts` resolves each scene's `animOut` via `pageOutFor` **at root-write
  time** — from the persisted deck, else spec + storyboard, with no sidecar in between — and
  `pipeline/root-html.ts` emits `MC.<fn>(tl, "#<clip>", start, …)`, clamped so the exit never
  begins before the scene's narration ends. A scene with no `animOut` hard-cuts (a `tl.set` on
  the clip's `autoAlpha`). The same pass resolves each scene's **ground** off
  `TreatmentFactory.ground`, so the root's ground rail switches in step with the scenes.
- **Verify transition timing against the real MP4, not `hyperframes snapshot`.** A single
  seek (snapshot) does not reproduce the leak above; only the actual render does. Extract
  frames from `final.mp4` with ffmpeg when checking entrance/exit behaviour.

## The consumer

**MotionBuff** uses this library two ways at once, which is why both the source and a built
engine matter:

- **Server side (Bun):** resolves to TS **source** through `tsconfig` `paths`
  (`mightycut-library/*` → `packages/library/src/*`). Bun handles the trio's
  `import … with { type: "text" }` natively — no build step, the code is used raw.

- **Browser side (the in-app showcase and deck editor):** imports the built engine
  (`mightycut-library/engine`), because `src/engine/fx.ts` uses Vite's `?raw` suffix, which
  Bun's bundler cannot parse. That entry deliberately has **no `paths` mapping** in MotionBuff,
  so it falls through to this package's own `exports` map — `import` → `dist/engine/index.js`,
  `types` → `dist/types/engine/index.d.ts`. Vite code-splits each theme's registration into
  `register-<theme>.js`, so one payload loads per theme (`loadTheme('block')`).

## Scripts

Run with any package manager; the pre-steps shell out to **bun** rather than pnpm, so a CI
runner needs no extra package manager installed.

```
bun run gen:fonts      # inline theme fonts → src/engine/<theme>-fonts.generated.ts
bun run typecheck      # tsc --noEmit
bun run test           # bun test (runtime + registry tripwires)
bun run build:engine   # vite build → dist/engine (per-theme lazy chunks) + tsc → dist/types
```

> `gen:fonts` runs automatically as a prestep before `typecheck`, `test`, and `build:engine`.
> **`dist/` and `src/engine/*-fonts.generated.ts` are generated, not committed.**

> `src/` is the source of truth; the consumer rebuilds the engine (`bun run build:engine`) in its
> own build step, so there is no `dist/` to commit here.

> Keep zod pinned to the exact version the harness uses (`4.0.0`) — a version skew makes schemas typed by one side incompatible with the other.
