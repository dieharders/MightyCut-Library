// The video canvas — the ONE place a deck's pixel dimensions and frame rate are named.
//
// Before this module the canvas was restated independently in six places that had to agree
// by hand: the harness's ffprobe gate (config.limits), the root stage's `data-width`/
// `data-height` AND its `#stage` CSS box, every scene host emitted by wrapSubComposition,
// the WebUI preview stage in engine/mount.ts (twice — a literal width and the scale()
// divisor nine lines below it), and the two backdrop canvas backing buffers. Nothing tied
// them together, and the spec schema's `meta.fps`/`width`/`height` — the one place that
// LOOKED like the setting — were required literals no renderer ever read (see the tombstone
// in types/spec.ts). Every consumer now derives from the table below.
//
// PRESET NAMES ARE NOT OURS TO INVENT. HyperFrames ships its own canvas vocabulary
// (`CANVAS_DIMENSIONS` in its CLI bundle: landscape 1920x1080, portrait 1080x1920, square
// 1080x1080, plus -4k variants) and its `--resolution` flag takes those names. A second
// naming system for the same sizes is guaranteed drift, so any name that exists on both
// sides MUST carry the same dimensions — canvas.test.ts pins that. Names the renderer does
// not have (landscape-720) are ours alone and unconstrained.

/** Frame rates the HyperFrames renderer accepts; anything else is rejected at render time. */
export type Fps = 24 | 30 | 60;

export type CanvasSize = { readonly width: number; readonly height: number };

/**
 * The canvas presets a deck may be composed at.
 *
 * `landscape-720` is the second value the threading is proven against, and it now composes
 * correctly rather than merely sizing correctly: the render document stamps a canvas-derived
 * root font-size (rootFontSizePx, below), so every authored rem is a fraction of the frame
 * and the layout rescales with it. The two things rem cannot carry are handled beside it —
 * GSAP tween distances go through `MC.u` at apply time, and canvas-2D backdrops paint through
 * a scaled context — so the only sizes still anchored to 1920 are the raster effects that
 * SHOULD be (hairlines, shadow blurs).
 *
 * No 4K entries: the renderer reaches 4K by SUPERSAMPLING a 1080-class composition
 * (`--resolution landscape-4k`), which is a different axis from the composition canvas and
 * needs no preset here.
 */
export const CANVAS_PRESETS = {
  landscape: { width: 1920, height: 1080 },
  "landscape-720": { width: 1280, height: 720 },
} as const satisfies Record<string, CanvasSize>;

export type CanvasPresetName = keyof typeof CANVAS_PRESETS;

export const CANVAS_PRESET_NAMES = Object.keys(CANVAS_PRESETS) as readonly CanvasPresetName[];

export const DEFAULT_CANVAS_PRESET: CanvasPresetName = "landscape";

export const DEFAULT_FPS: Fps = 30;

/**
 * The canvas every authored rem and every "percent of the design width" in this library is
 * expressed in. Component CSS is written as though the frame were exactly this size.
 *
 * It is NOT the active canvas — it is the UNIT the active canvas is measured in. The render
 * document sets a root font-size of `rootFontSizePx(canvas)` so that 1rem means the same
 * FRACTION OF THE FRAME at every canvas, which is what makes the authored numbers scale
 * instead of being fixed pixels.
 */
export const DESIGN_CANVAS: CanvasSize = CANVAS_PRESETS.landscape;

/**
 * The root font-size the design canvas is authored against. Every authored rem multiplies
 * this, so `1rem === 16px` only at DESIGN_CANVAS — which is exactly the property that makes
 * the 0.125rem grid land on even pixels there.
 */
export const BASE_FONT_PX = 16;

/**
 * How much larger the active canvas is than the canvas the library is authored for.
 *
 * WIDTH-ONLY, deliberately. Every "percent of the design width" convention in the library
 * (decoration placement, icon sizing) is horizontal, and a uniform width ratio keeps those
 * consistent with rem. It follows that a preset of a DIFFERENT ASPECT RATIO scales to fit
 * the width and simply leaves vertical slack — that is honest rather than correct, because
 * re-proportioning a 16:9 deck for a portrait frame is a reflow problem, not a scale one.
 * Every preset today shares one aspect ratio, so the distinction has no effect yet.
 */
export const remScaleFor = (canvas: CanvasSize): number => canvas.width / DESIGN_CANVAS.width;

/**
 * The root font-size, in CSS px, that makes authored rem canvas-relative.
 *
 * This is the ONE number that turns the library's rem sizes from fixed pixels into fractions
 * of the frame. The render document stamps it on `html` (see the harness's root-html), which
 * rescales every rem in every staged sheet and every composed scene with no CSS edits.
 *
 * It must NOT be set by anything that renders into a HOST page: rem resolves against
 * `document.documentElement` even across a shadow boundary, so the browser preview cannot
 * use this and compensates by laying out in design units instead (see engine/mount.ts).
 */
export const rootFontSizePx = (canvas: CanvasSize): number => BASE_FONT_PX * remScaleFor(canvas);

/** A fully resolved canvas: the preset's dimensions plus the frame rate to render at. */
export type Canvas = { readonly name: CanvasPresetName } & CanvasSize & { readonly fps: Fps };

export const isCanvasPreset = (name?: string): name is CanvasPresetName =>
  !!name && Object.prototype.hasOwnProperty.call(CANVAS_PRESETS, name);

/**
 * Resolve a preset name to a canvas. PURE AND TOTAL: an unknown name yields the default
 * SILENTLY — the caller owns the warn, the same split `themeFor` uses in the harness.
 *
 * Deliberately never throws. This resolves at module-init time in config.ts, which nearly
 * everything imports, so a throw on a bad value would be an unrecoverable boot failure —
 * and a fallback canvas still renders a perfectly valid video.
 */
export const canvasFor = (name?: string, fps: Fps = DEFAULT_FPS): Canvas => {
  const resolved: CanvasPresetName = isCanvasPreset(name) ? name : DEFAULT_CANVAS_PRESET;
  return { name: resolved, ...CANVAS_PRESETS[resolved], fps };
};

/**
 * The reverse lookup: which preset, if any, a pair of dimensions IS.
 *
 * A composed deck records its canvas as pixels, not as a name — the root stage's
 * `data-width`/`data-height` are what the renderer sizes the output from — so anything
 * reading a canvas back off an artifact (the harness's render gate) has dimensions in hand
 * and needs the name to describe them. It lives here, beside the table, because a lookup
 * kept away from the data it looks up is the drift this module exists to end.
 *
 * `undefined` for dimensions no preset has, which is a real answer and not an error: a deck
 * composed before a preset was retired, or by a hand-edited root, still renders — the caller
 * decides whether to warn.
 */
export const canvasPresetForSize = (size: CanvasSize): CanvasPresetName | undefined =>
  CANVAS_PRESET_NAMES.find(
    (n) => CANVAS_PRESETS[n].width === size.width && CANVAS_PRESETS[n].height === size.height,
  );
