// A canvas-2D backdrop is the one thing in this library that rem cannot reach.
//
// Every authored size in a component is a rem, and the render document stamps a canvas-derived
// root font-size (types/canvas.ts rootFontSizePx) so those become fractions of the frame. A
// <canvas> opts out of all of it: its backing buffer is canvas-sized and CSS-stretched to the
// frame 1:1, so every absolute number inside the factory that paints it — drift amplitude,
// link distance, node radius, hairline width — is a fixed fraction of the DESIGN frame and a
// larger one at any smaller canvas. Left alone, `future`'s constellation renders as a denser
// web of fatter dots at 1280 than at 1920, with a different link topology, while the layout
// around it scales correctly.
//
// The contract these tests pin is that the factory is authored in DESIGN units and the CONTEXT
// carries the ratio — one transform instead of a list of per-value multiplies that has to be
// kept complete. It is checked by driving MC.particleBg against a recording 2D context, because
// the alternative is comparing rendered frames and the failure is a subtle density change.
import { describe, expect, test } from "bun:test";

const MC_SRC = await Bun.file(`${import.meta.dir}/../../../assets/fx/mc.js`).text();

type Call = { fn: string; args: number[] };

type Recorder = {
  calls: Call[];
  transforms: number[][];
  /** Every point an arc() was centred on, in the units the factory drew in. */
  arcs: { x: number; y: number; r: number }[];
  lineWidths: number[];
};

/** A 2D context that records geometry instead of painting it. */
const recordingCanvas = (width: number, height: number) => {
  const rec: Recorder = { calls: [], transforms: [], arcs: [], lineWidths: [] };
  const noop = () => {};
  const ctx = {
    setTransform: (...a: number[]) => {
      rec.transforms.push(a);
      rec.calls.push({ fn: "setTransform", args: a });
    },
    clearRect: (...a: number[]) => rec.calls.push({ fn: "clearRect", args: a }),
    arc: (x: number, y: number, r: number) => rec.arcs.push({ x, y, r }),
    createRadialGradient: () => ({ addColorStop: noop }),
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    fill: noop,
    set lineWidth(v: number) {
      rec.lineWidths.push(v);
    },
    strokeStyle: "",
    fillStyle: "",
  };
  const canvas = { width, height, getContext: () => ctx };
  return { canvas, rec };
};

const loadMc = () => {
  const win: Record<string, unknown> = {};
  new Function("window", MC_SRC)(win);
  return win.MC as {
    particleBg: (c: unknown, o: unknown) => { addTo: (tl: unknown, at: number, d: number) => unknown };
  };
};

/** Paint one frame of the constellation at a canvas size and report what was drawn. */
const paintAt = (width: number, height: number): Recorder => {
  const { canvas, rec } = recordingCanvas(width, height);
  // The factory paints frame 0 on construction, which is the frame under test.
  loadMc().particleBg(canvas, { seed: "fixed", colorRgb: "52,225,255" });
  return rec;
};

const DESIGN = { width: 1920, height: 1080 };
const SMALL = { width: 1280, height: 720 };
const RATIO = SMALL.width / DESIGN.width;

describe("particleBg scales the drawing, not the numbers", () => {
  test("the context carries the canvas ratio", () => {
    expect(paintAt(SMALL.width, SMALL.height).transforms[0]).toEqual([RATIO, 0, 0, RATIO, 0, 0]);
  });

  test("at the design canvas the transform is the identity", () => {
    // Anything else would change every deck ever rendered.
    expect(paintAt(DESIGN.width, DESIGN.height).transforms[0]).toEqual([1, 0, 0, 1, 0, 0]);
  });

  // setTransform, NOT scale: a repaint runs this on every frame of the scene, and `scale`
  // multiplies into whatever matrix the last frame left behind — the field would shrink
  // toward the origin frame by frame.
  test("the transform is re-stamped absolutely on every frame", () => {
    const { canvas, rec } = recordingCanvas(SMALL.width, SMALL.height);
    const fx = loadMc().particleBg(canvas, { seed: "fixed", colorRgb: "52,225,255" });
    const tweens: { onUpdate: () => void }[] = [];
    const tl = { to: (_p: unknown, vars: { onUpdate: () => void }) => tweens.push(vars) };
    fx.addTo(tl, 0, 6);
    tweens[0]!.onUpdate();
    tweens[0]!.onUpdate();
    expect(rec.transforms.length).toBeGreaterThan(2);
    for (const t of rec.transforms) expect(t).toEqual([RATIO, 0, 0, RATIO, 0, 0]);
  });

  // THE POINT. The seeded field is identical at every canvas — same nodes, same radii, same
  // distances between them — and only the transform differs. That is what makes the two
  // renders the same picture at two sizes rather than two different constellations.
  test("the painted field is identical in design units at both canvases", () => {
    const design = paintAt(DESIGN.width, DESIGN.height).arcs;
    const small = paintAt(SMALL.width, SMALL.height).arcs;
    expect(small.length).toBe(design.length);
    expect(small.length).toBeGreaterThan(0);
    for (let i = 0; i < design.length; i++) {
      expect(small[i]!.x).toBeCloseTo(design[i]!.x, 6);
      expect(small[i]!.y).toBeCloseTo(design[i]!.y, 6);
      expect(small[i]!.r).toBeCloseTo(design[i]!.r, 6);
    }
  });

  // The field is laid out across the design frame, not the buffer — the transform is what puts
  // it back on the buffer. A node drawn at a buffer coordinate would cluster the whole
  // constellation into the top-left two thirds of a 1280 frame.
  test("nodes are laid out across the DESIGN frame at a smaller canvas", () => {
    const arcs = paintAt(SMALL.width, SMALL.height).arcs;
    const maxX = Math.max(...arcs.map((a) => a.x));
    const maxY = Math.max(...arcs.map((a) => a.y));
    expect(maxX).toBeGreaterThan(SMALL.width);
    expect(maxX).toBeLessThanOrEqual(DESIGN.width);
    expect(maxY).toBeGreaterThan(SMALL.height);
    expect(maxY).toBeLessThanOrEqual(DESIGN.height);
  });

  test("clearRect covers the whole buffer once the transform is applied", () => {
    const rec = paintAt(SMALL.width, SMALL.height);
    const clear = rec.calls.find((c) => c.fn === "clearRect")!;
    expect(clear.args[2]! * RATIO).toBeCloseTo(SMALL.width, 6);
    expect(clear.args[3]! * RATIO).toBeCloseTo(SMALL.height, 6);
  });

  // The transform must be stamped BEFORE anything is drawn through it, or the first frame of
  // every scene paints at design scale and then snaps.
  test("the transform precedes the clear and the first arc", () => {
    const rec = paintAt(SMALL.width, SMALL.height);
    expect(rec.calls[0]!.fn).toBe("setTransform");
    expect(rec.calls[1]!.fn).toBe("clearRect");
  });
});
