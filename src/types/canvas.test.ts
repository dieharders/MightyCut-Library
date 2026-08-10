// Tripwires for the canvas preset table (types/canvas.ts) — the single source every
// dimension in the render, the scene hosts and the WebUI preview stage derives from.
import { describe, expect, test } from "bun:test";
import {
  CANVAS_PRESETS,
  CANVAS_PRESET_NAMES,
  DEFAULT_CANVAS_PRESET,
  DEFAULT_FPS,
  DESIGN_CANVAS,
  canvasFor,
  isCanvasPreset,
  type CanvasSize,
} from "./canvas";
import { wrapSubComposition } from "../pipeline/sub-composition";

/**
 * HyperFrames' own canvas vocabulary, transcribed from `CANVAS_DIMENSIONS` in its CLI
 * bundle (video-assets/node_modules/hyperframes/dist/cli.js — search the identifier). The
 * renderer's `--resolution` flag takes these names.
 *
 * This is the highest-value tripwire in the file: it is what silently rots on a hyperframes
 * upgrade. Our table is allowed to hold names the renderer does not (landscape-720), but a
 * name present on BOTH sides that disagrees about pixels is two naming systems for one size
 * — exactly the drift this module exists to remove.
 */
const HYPERFRAMES_CANVAS_DIMENSIONS: Record<string, { width: number; height: number }> = {
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 1080, height: 1920 },
  "landscape-4k": { width: 3840, height: 2160 },
  "portrait-4k": { width: 2160, height: 3840 },
  square: { width: 1080, height: 1080 },
  "square-4k": { width: 2160, height: 2160 },
};

describe("canvas presets", () => {
  test("every shared name matches the renderer's dimensions", () => {
    const shared = CANVAS_PRESET_NAMES.filter((n) => n in HYPERFRAMES_CANVAS_DIMENSIONS);
    // Guard the guard: if this drops to zero the assertion below becomes vacuous.
    expect(shared.length).toBeGreaterThan(0);
    for (const name of shared) {
      expect(CANVAS_PRESETS[name] as CanvasSize).toEqual(HYPERFRAMES_CANVAS_DIMENSIONS[name]!);
    }
  });

  test("the default preset is one of the presets, and is the design canvas", () => {
    expect(CANVAS_PRESET_NAMES).toContain(DEFAULT_CANVAS_PRESET);
    // DESIGN_CANVAS is what every authored rem is anchored to. Composing at a different
    // canvas is dimensionally correct but lays out at 1920 (see runtime/css.ts), so the
    // DEFAULT must not drift off it without that work being done.
    expect(CANVAS_PRESETS[DEFAULT_CANVAS_PRESET] as CanvasSize).toEqual(DESIGN_CANVAS);
  });

  test("presets have positive, even dimensions", () => {
    // Odd dimensions break yuv420p encoding and the `scale=W:-2` filters.
    for (const name of CANVAS_PRESET_NAMES) {
      const { width, height } = CANVAS_PRESETS[name];
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
      expect(width % 2).toBe(0);
      expect(height % 2).toBe(0);
    }
  });

  test("canvasFor resolves a known name, and falls back on an unknown one", () => {
    expect(canvasFor("landscape-720")).toEqual({
      name: "landscape-720",
      width: 1280,
      height: 720,
      fps: DEFAULT_FPS,
    });
    // Total, never throwing: config.ts resolves this at module init, so a bad value must
    // degrade rather than take the process down. The caller owns the warn.
    expect(canvasFor("nonsense").name).toBe(DEFAULT_CANVAS_PRESET);
    expect(canvasFor(undefined).name).toBe(DEFAULT_CANVAS_PRESET);
    expect(canvasFor("landscape", 60).fps).toBe(60);
  });

  test("isCanvasPreset does not admit inherited Object keys", () => {
    expect(isCanvasPreset("landscape")).toBe(true);
    expect(isCanvasPreset("constructor")).toBe(false);
    expect(isCanvasPreset("toString")).toBe(false);
    expect(isCanvasPreset(undefined)).toBe(false);
  });
});

describe("wrapSubComposition canvas", () => {
  const parts = { compId: "s01-x", voIds: ["l1"], bodyHtml: "", entranceJs: "", pageClasses: "mc-page" };

  test("an unset canvas reproduces the design canvas (byte stability)", () => {
    expect(wrapSubComposition(parts)).toContain('data-width="1920" data-height="1080"');
  });

  test("a threaded canvas sizes the scene host", () => {
    const html = wrapSubComposition({ ...parts, canvas: CANVAS_PRESETS["landscape-720"] });
    expect(html).toContain('data-width="1280" data-height="720"');
    expect(html).not.toContain('data-width="1920"');
  });
});
