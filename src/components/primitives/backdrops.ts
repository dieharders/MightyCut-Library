// Backdrop MASK designs — a small, theme-agnostic registry of full-bleed overlays
// painted on top of a scene's ground COLOUR (behind the content). This is the
// counterpart to the ground: `ground` sets the base fill (var(--<ground>) on the
// page wrapper), a backdrop paints a pattern/texture OVER it. Designs are shared
// across themes and recoloured by theme tokens (block's dots use var(--dark)); a
// theme picks its canonical design (ThemeTokens.backdrop) and a scene may override
// it (BuildContext.backdrop / storyboard options.backdrop).
//
// Shape mirrors decoration-shapes.ts: a design's `build` returns a mini-dom node +
// a scoped-later CSS string + anim descriptors. Static designs return `anims: []`;
// the field is kept so an animated mask (e.g. a seeded constellation driven off the
// scene timeline) drops in later without changing this interface or its callers.
import type { ElementNode } from "../../pipeline/mini-dom";
import type { BackdropName, FrameGround } from "../../types/storyboard";
import { rootElement } from "../runtime/dom";
import type { AnimDescriptor, BuildContext, ThemeTokens } from "../runtime/types";

export type BackdropInput = {
  /** The scene's resolved ground colour token (a design may tint against it). */
  ground: FrameGround;
  /** The active theme (tokens/skin the mask recolours from). */
  theme: ThemeTokens;
  /** Scene build context (compId is a stable per-scene seed for animated designs). */
  ctx: BuildContext;
};

export type BackdropResult = {
  /** The full-bleed overlay element, inserted behind the content (z-index 0). */
  node: ElementNode;
  /** Authored (unscoped) CSS — the emitter scopes it under `.<compId>-root`. */
  css: string;
  /** Timeline hooks for animated masks (empty for static designs). */
  anims: AnimDescriptor[];
};

export type BackdropDesign = {
  name: string;
  build: (input: BackdropInput) => BackdropResult;
};

// Shared overlay base + the per-design modifier. `.mc-backdrop` pins the layer
// full-bleed behind the content (the page wrapper is position:absolute/inset:0, so
// z-index 0 sits above the wrapper's ground bg and below back-decorations at z1).
const BACKDROP_BASE = `.mc-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}`;

/** dots — block's neobrutalist ink dot-grid (was the dead `.dg` in block/frame.css),
 *  now a shareable, theme-recoloured mask. Static (pure CSS radial-gradient). */
const dots: BackdropDesign = {
  name: "dots",
  build: () => ({
    node: rootElement(`<div class="mc-backdrop mc-backdrop--dots"></div>`),
    css: `${BACKDROP_BASE}
.mc-backdrop--dots {
  opacity: 0.32;
  /* --dot-ink lets a theme repaint the grid: block's ink dots vanish on a dark ground
     (future's --dark abyss on navy is invisible), so future re-points it to cyan. */
  background-image: radial-gradient(circle, var(--dot-ink, var(--dark)) 0.125rem, transparent 0.125rem);
  background-size: 3.625rem 3.625rem;
}`,
    anims: [],
  }),
};

// --- The three masks ported off the root chrome ------------------------------
// `gradient`, `grid` and `hatch` were `.mc-bg--gradient` / `.mc-bg--grid` /
// `.mc-bg--pattern` in root/chrome.css: a SECOND, deck-wide backdrop system painted with
// the retired theme-css tokens (--grad-page / --bg / --grid), which no palette role could
// address. They are per-scene designs now, recoloured like every other mask through an
// `--<design>-ink` hook (the `dots` convention above) so a theme repaints them from its own
// frame.css without forking the design.
//
// The two root kinds with no entry here are deliberate: `.mc-bg--solid` IS `plain` (a bare
// ground, no overlay), and `.mc-bg--particles` IS `constellation` — the same MC.particleBg
// FX, already animated and already tinted from the theme's --primary.

/** gradient — a soft vertical wash over the ground (the old `.mc-bg--gradient`, minus the
 *  hardcoded --grad-page). Darkens toward the bottom so content keeps its footing. Static. */
const gradient: BackdropDesign = {
  name: "gradient",
  build: () => ({
    node: rootElement(`<div class="mc-backdrop mc-backdrop--gradient"></div>`),
    css: `${BACKDROP_BASE}
.mc-backdrop--gradient {
  /* --wash-ink is the shade the wash pulls toward; a dark theme re-points it at an accent
     so the vignette reads as light rather than sludge. */
  background-image: linear-gradient(
    180deg,
    transparent 0%,
    color-mix(in srgb, var(--wash-ink, var(--dark)) 10%, transparent) 55%,
    color-mix(in srgb, var(--wash-ink, var(--dark)) 26%, transparent) 100%
  );
}`,
    anims: [],
  }),
};

/** grid — a 4rem ruled line grid (the old `.mc-bg--grid`). Static. */
const grid: BackdropDesign = {
  name: "grid",
  build: () => ({
    node: rootElement(`<div class="mc-backdrop mc-backdrop--grid"></div>`),
    css: `${BACKDROP_BASE}
.mc-backdrop--grid {
  opacity: 0.14;
  /* --grid-ink: the rule colour. 0.125rem keeps the hairline on the authoring grid. */
  background-image:
    linear-gradient(var(--grid-ink, var(--dark)) 0.125rem, transparent 0.125rem),
    linear-gradient(90deg, var(--grid-ink, var(--dark)) 0.125rem, transparent 0.125rem);
  background-size: 4rem 4rem;
}`,
    anims: [],
  }),
};

/** hatch — 45° repeating stripes (the old `.mc-bg--pattern`). Static. */
const hatch: BackdropDesign = {
  name: "hatch",
  build: () => ({
    node: rootElement(`<div class="mc-backdrop mc-backdrop--hatch"></div>`),
    css: `${BACKDROP_BASE}
.mc-backdrop--hatch {
  opacity: 0.16;
  /* --hatch-ink: the stripe colour. */
  background-image: repeating-linear-gradient(
    -45deg,
    var(--hatch-ink, var(--dark)) 0,
    var(--hatch-ink, var(--dark)) 0.125rem,
    transparent 0.125rem,
    transparent 1.125rem
  );
}`,
    anims: [],
  }),
};

// --- The one colour outside the CSS custom-property system ------------------
// Every other colour in this library is a role var (`var(--primary)`) and anything
// lighter/darker/translucent is derived with color-mix(). The constellation mask
// cannot play by that rule: its network is painted into a <canvas> by MC.particleBg,
// which needs a raw `"r,g,b"` triple for strokeStyle/fillStyle. Canvas 2D reads no
// CSS custom properties and color-mix() cannot reach a JS opt, so the value has to be
// a literal by the time it lands in the anim descriptor. Instead of hardcoding one,
// we RESOLVE it at build time from the active theme's --primary swatch — the palette
// stays the single source of truth, and a theme swap recolours the particles for free.

/** `#rgb` / `#rrggbb` → `"r,g,b"`. Null for anything unparseable, so a malformed
 *  swatch degrades to the fallback rather than emitting a broken canvas opt. */
const hexToRgbTriple = (hex: string): string | null => {
  const raw = hex.trim().replace(/^#/, "");
  const full = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = Number.parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

/** future's cyan (#34E1FF) — the value this mask shipped with, kept as the fallback
 *  for a theme that declares no `palette` (the field is optional on ThemeTokens). */
const PARTICLE_RGB_FALLBACK = "52,225,255";

/** The particle colour for a theme: its --primary swatch, as an `"r,g,b"` triple. */
const particleRgb = (theme: ThemeTokens): string => {
  const hex = theme.palette?.find((sw) => sw.varName === "primary")?.hex;
  return (hex ? hexToRgbTriple(hex) : null) ?? PARTICLE_RGB_FALLBACK;
};

/** constellation — an ANIMATED seeded particle network (a --primary node graph, cyan
 *  under future) painted on a
 *  full-bleed canvas over the ground; future's canonical backdrop. The motion is driven off
 *  the scene timeline by the `backdrop` anim-kind (MC.particleBg in mc.js) — deterministic
 *  (seed = compId, no rAF/Date.now), so seeking any frame repaints identically. The canvas
 *  carries a compId-scoped class because backdrop anims are NOT run through qualifyAnim and
 *  the render's `q` is document-wide (sub-composition.ts) — the scoped class keeps each
 *  scene's `q(".<compId>-bg")` resolving to its OWN canvas in the shared render DOM. */
const constellation: BackdropDesign = {
  name: "constellation",
  build: ({ ctx, theme }) => {
    // idPrefix === compId for a treatment root (children never build the backdrop).
    const canvasClass = `${ctx.idPrefix}-bg`;
    return {
      node: rootElement(
        `<div class="mc-backdrop mc-backdrop--constellation"><canvas class="${canvasClass}" width="1920" height="1080"></canvas></div>`,
      ),
      css: `${BACKDROP_BASE}
.mc-backdrop--constellation canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}`,
      anims: [
        {
          kind: "backdrop",
          target: canvasClass,
          time: { at: "seconds", t: 0 },
          // colorRgb is the theme's --primary, resolved at build time (see particleRgb
          // above — canvas JS can't read a CSS var); seed = compId → deterministic per scene.
          opts: { fn: "particleBg", seed: ctx.compId, colorRgb: particleRgb(theme), opacity: 0.8 },
        },
      ],
    };
  },
};

/** The mask designs, keyed by name. `plain` is intentionally absent — it means "no
 *  mask" and `buildBackdrop` returns null for it (byte-identical to a bare ground).
 *  Designs are SHARED (any theme may roster any of them); which ones a theme actually
 *  offers is `ThemeTokens.backdrops`, and its canonical one `ThemeTokens.backdrop`. */
export const BACKDROPS: Record<string, BackdropDesign> = { dots, constellation, gradient, grid, hatch };

/**
 * Resolve a backdrop design to its built parts, or null when there is no mask to
 * paint (`plain`, or an unknown name — degrade to no overlay rather than throw).
 */
export const buildBackdrop = (name: BackdropName | string, input: BackdropInput): BackdropResult | null => {
  if (name === "plain") return null;
  const design = BACKDROPS[name];
  return design ? design.build(input) : null;
};
