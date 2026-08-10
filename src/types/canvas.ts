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
 * `landscape-720` is WIRED BUT NOT YET USABLE as a default. It will render at the correct
 * SIZE — every `data-width`/`data-height`/`#stage` box derives from here — but the layout
 * inside it stays anchored to 1920, because the library's rem sizes only rescale with the
 * canvas once the render document sets a canvas-derived root font-size, which it does not
 * (see DESIGN_CANVAS). It exists so the threading has a second value to be proven against.
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
 * anchored to.
 *
 * DISTINCT FROM THE ACTIVE CANVAS, and the distinction is the whole point. Component CSS is
 * authored in rem on a 0.125rem grid, which would be canvas-relative IF the render document
 * set a root font-size derived from the canvas width. It does not — nothing anywhere sets
 * `html { font-size }`, so 1rem is the browser default 16px and every rem is effectively a
 * fixed px anchored to 1920. Until that is fixed, composing at any canvas other than this
 * one yields a correctly-sized video with a 1920-anchored layout inside it. A tripwire in
 * the harness asserts the active canvas still equals this, so the default cannot be moved
 * off `landscape` without the rem work being done first.
 */
export const DESIGN_CANVAS: CanvasSize = CANVAS_PRESETS.landscape;

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
