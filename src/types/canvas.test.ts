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
 * We no longer share any of them: our presets state their height (`landscape-1080`), because
 * a name here is read by a person picking a resolution and `landscape` does not say 1920x1080.
 * The overlap set is therefore EMPTY today, and the test below asserts agreement rather than
 * overlap — it is armed for the case that matters (someone re-adds a bare `landscape`, or a
 * hyperframes upgrade starts using one of our names) without demanding a collision exist.
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
  test("any name shared with the renderer matches its dimensions", () => {
    // Deliberately NOT guarded with `shared.length > 0` any more. That guard was right while
    // sharing the vocabulary was the intent; now that our names carry their height, an empty
    // overlap is the CORRECT state and the guard would fail the design rather than a defect.
    for (const name of CANVAS_PRESET_NAMES.filter((n) => n in HYPERFRAMES_CANVAS_DIMENSIONS)) {
      expect(CANVAS_PRESETS[name] as CanvasSize).toEqual(HYPERFRAMES_CANVAS_DIMENSIONS[name]!);
    }
  });

  test("every preset name states its height", () => {
    // The convention the rename established, pinned so the next preset cannot quietly drop it.
    // A name is the whole UI in a CLI flag, and one that does not say its size sends the reader
    // to this table to find out — which is exactly what `landscape` used to do.
    for (const name of CANVAS_PRESET_NAMES) {
      expect(name).toMatch(new RegExp(`-${CANVAS_PRESETS[name].height}$`));
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
    expect(canvasFor("landscape-1080", 60).fps).toBe(60);
  });

  test("isCanvasPreset does not admit inherited Object keys", () => {
    expect(isCanvasPreset("landscape-1080")).toBe(true);
    // The retired name must NOT resolve — it is what stored data and old flags will carry.
    expect(isCanvasPreset("landscape")).toBe(false);
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
