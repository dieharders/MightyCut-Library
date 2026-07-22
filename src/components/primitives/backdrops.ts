// Backdrop MASK designs — a small, theme-agnostic registry of full-bleed overlays
// painted on top of a scene's ground COLOUR (behind the content). This is the
// counterpart to the ground: `ground` sets the base fill (var(--<ground>) on the
// page wrapper), a backdrop paints a pattern/texture OVER it. Designs are shared
// across themes and recoloured by theme tokens (block's dots use var(--black)); a
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
  background-image: radial-gradient(circle, var(--black) 0.125rem, transparent 0.125rem);
  background-size: 3.625rem 3.625rem;
}`,
    anims: [],
  }),
};

/** The mask designs, keyed by name. `plain` is intentionally absent — it means "no
 *  mask" and `buildBackdrop` returns null for it (byte-identical to a bare ground). */
export const BACKDROPS: Record<string, BackdropDesign> = { dots };

/**
 * Resolve a backdrop design to its built parts, or null when there is no mask to
 * paint (`plain`, or an unknown name — degrade to no overlay rather than throw).
 */
export const buildBackdrop = (name: BackdropName | string, input: BackdropInput): BackdropResult | null => {
  if (name === "plain") return null;
  const design = BACKDROPS[name];
  return design ? design.build(input) : null;
};
