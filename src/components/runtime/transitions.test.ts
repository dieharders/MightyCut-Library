// Tests for the shared transition catalog: the component whole-element entrance
// (elementIn), the treatment whole-page transition strings (sceneEntranceJs /
// sceneExitJs) + their runtime clamp, and a byte-identity guard asserting each
// refactored primitive still emits its exact pre-transition entrance descriptor.
import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { TIMING_SECONDS } from "../../types/transitions";
import "../registry"; // populate the registry
import type { AnimDescriptor } from "./anim";
import { component } from "./component";
import { scrubDeterminism } from "./determinism";
import { renderScene } from "./emit";
import { getComponent, getTreatment } from "./registry";
import { rootContext } from "./index";
import { blockTheme } from "../themes/block/theme";
import { DEFAULT_ENTRANCE, elementIn, sceneEntranceJs, sceneExitJs } from "./transitions";

describe("timing presets", () => {
  test("short/medium/long map to 1/3/5 seconds", () => {
    expect(TIMING_SECONDS).toEqual({ short: 1, medium: 3, long: 5 });
  });
});

describe("elementIn (component entrance descriptor)", () => {
  test("none → null", () => {
    expect(elementIn("none", "item")).toBeNull();
  });
  test("fade/scale omit the opts key entirely when empty (byte rule)", () => {
    expect(elementIn("fade", "item")).toEqual({ kind: "fadeIn", target: "item", time: { at: "line", n: 0 } });
    expect(elementIn("scale", "item")).toEqual({ kind: "scaleIn", target: "item", time: { at: "line", n: 0 } });
    expect("opts" in elementIn("fade", "item")!).toBe(false);
  });
  test("rise carries its dist opts; dur omitted unless a timing is set", () => {
    expect(elementIn("rise", "item", undefined, { dist: 26 })).toEqual({
      kind: "riseIn",
      target: "item",
      time: { at: "line", n: 0 },
      opts: { dist: 26 },
    });
    expect(elementIn("rise", "item", 3, { dist: 26 })).toEqual({
      kind: "riseIn",
      target: "item",
      time: { at: "line", n: 0 },
      opts: { dist: 26, dur: 3 },
    });
  });
  test("slide/wipe/fall compile to the generic `from` kind with gsap vars", () => {
    expect(elementIn("slide-left", "item")).toEqual({
      kind: "from",
      target: "item",
      time: { at: "line", n: 0 },
      opts: { x: -120, opacity: 0, duration: 0.6, ease: "power3.out" },
    });
    expect(elementIn("wipe", "item")!.kind).toBe("from");
    expect((elementIn("wipe", "item")!.opts as Record<string, unknown>).clipPath).toBe("inset(0 100% 0 0)");
  });
});

describe("sceneEntranceJs / sceneExitJs (treatment page transition)", () => {
  test("none ⇒ the byte-identical legacy default entrance + empty exit", () => {
    expect(sceneEntranceJs("none")).toBe(DEFAULT_ENTRANCE);
    expect(sceneExitJs("none")).toBe("");
  });
  test("entrance runs from t=0 for the clamped IN duration", () => {
    const js = sceneEntranceJs("fade", "short");
    expect(js).toContain("var _din = Math.min(1, dur);");
    expect(js).toContain("MC.fadeIn(tl, page, 0, { dur: _din });");
  });
  test("slide entrance bakes its travel + timing", () => {
    const js = sceneEntranceJs("slide-left", "medium");
    expect(js).toContain("var _din = Math.min(3, dur);");
    expect(js).toContain("MC.slideIn(tl, page, 0, { dur: _din, x: -140 });");
  });
  test("exit anchors to scene end and clamps so IN+OUT never exceed dur", () => {
    const js = sceneExitJs("fade", "short", "medium");
    expect(js).toContain("var _dout = Math.min(3, Math.max(0, dur - Math.min(1, dur)));");
    expect(js).toContain("MC.fadeOut(tl, page, dur - _dout, { dur: _dout });");
  });
  test("emitted transition JS is deterministic (no banned tokens)", () => {
    expect(() => scrubDeterminism(sceneEntranceJs("wipe", "long"))).not.toThrow();
    expect(() => scrubDeterminism(sceneExitJs("slide-right", "short", "long"))).not.toThrow();
  });
});

// Guards the anim.ts refactor: each primitive's DEFAULT build must still emit its
// exact pre-transition entrance descriptor (kind/target/time/opts), prepended before
// its internal reveals.
describe("primitive entrance byte-identity (post-refactor)", () => {
  const firstAnim = (name: string) => getComponent(name)().build(rootContext(`sc-${name}`, blockTheme)).anims[0];
  const allAnims = (name: string) => getComponent(name)().build(rootContext(`sc-${name}`, blockTheme)).anims;

  test("rise-family entrances keep their dist", () => {
    expect(firstAnim("stat")).toEqual({ kind: "riseIn", target: "sc-stat-item", time: { at: "line", n: 0 }, opts: { dist: 26 } });
    expect(firstAnim("card")).toEqual({ kind: "riseIn", target: "sc-card-item", time: { at: "line", n: 0 }, opts: { dist: 26 } });
    expect(firstAnim("pill")).toEqual({ kind: "riseIn", target: "sc-pill-item", time: { at: "line", n: 0 }, opts: { dist: 18 } });
  });
  test("fade/scale entrances carry no opts key", () => {
    expect(firstAnim("bar")).toEqual({ kind: "fadeIn", target: "sc-bar-item", time: { at: "line", n: 0 } });
    expect(firstAnim("cta")).toEqual({ kind: "scaleIn", target: "sc-cta-item", time: { at: "line", n: 0 } });
  });
  test("internal reveals are preserved after the entrance", () => {
    const stat = allAnims("stat");
    expect(stat.map((a) => a.kind)).toEqual(["riseIn", "countUp"]);
    const bar = allAnims("bar");
    expect(bar.map((a) => a.kind)).toEqual(["fadeIn", "growBar", "countUp"]);
  });
  test("row/hud keep their internal reveal with no prepended entrance (animIn unset)", () => {
    // The HUD is persistent chrome, so it has no whole-element entrance — its only
    // anim is the progress-fill reveal.
    expect(allAnims("row").map((a) => a.kind)).toEqual(["staggerIn"]);
    expect(allAnims("hud").map((a) => a.kind)).toEqual(["growBar"]);
  });
});

// A picked transition and an internal reveal aimed at the SAME target both compile to
// `tl.from()` on one element; GSAP's immediateRender then makes the second sample the
// first's from-state (opacity 0) as its END value, so the element reveals and vanishes
// for good. The entrance must WIN — one reveal per box.
describe("entrance vs. internal reveal on the same target", () => {
  const withIn = (name: string, animIn: "pop" | "rise" | "fade") =>
    getComponent(name)()
      .withTransition({ animIn })
      .build(rootContext(`sc-${name}`, blockTheme)).anims;

  test("row: a picked entrance replaces the same-target staggerIn", () => {
    // rowAnim's staggerIn targets `item` — exactly what elementIn drives.
    for (const t of ["pop", "rise", "fade"] as const) {
      const anims = withIn("row", t);
      expect(anims).toHaveLength(1);
      expect(anims[0].target).toBe("sc-row-item");
      expect(anims.filter((a) => a.target === "sc-row-item")).toHaveLength(1);
    }
  });

  test("row: pop is the back-eased scaleIn, not a dropped no-op", () => {
    expect(withIn("row", "pop")[0]).toEqual({
      kind: "scaleIn",
      target: "sc-row-item",
      time: { at: "line", n: 0 },
      opts: { from: 0.8, ease: "back.out(2)" },
    });
  });

  test("internal reveals on SUB-parts survive the entrance", () => {
    // bar's growBar/countUp target col/value — different boxes, so they still stack.
    expect(withIn("bar", "pop").map((a) => a.kind)).toEqual(["scaleIn", "growBar", "countUp"]);
    expect(withIn("stat", "pop").map((a) => a.kind)).toEqual(["scaleIn", "countUp"]);
  });

  // Only a same-target REVEAL is dropped — the filter is kind-aware, matching mc.js's
  // runtime guard. A to/fromTo tween (or growBar's from-on-scale) aimed at the element's
  // OWN root stacks on the entrance legitimately: nothing in the registry does that today,
  // so without this an over-broad `a.target !== entrance.target` filter passes every
  // existing test while silently deleting the first such component's motion.
  describe("a NON-reveal internal on the root survives the entrance", () => {
    const Probe = (internal: AnimDescriptor["kind"]) =>
      component({
        name: `probe-${internal}`,
        schema: z.object({}),
        template: `<div class="probe" data-anim="item"></div>`,
        example: {},
        animIn: "fade",
        anim: () => [{ kind: internal, target: "item", time: { at: "line", n: 0 } }],
      });

    test.each(["rule", "float", "countUp", "growBar"] as const)(
      "'%s' on the root is kept alongside a picked entrance",
      (kind) => {
        const anims = Probe(kind)()
          .withTransition({ animIn: "pop" })
          .build(rootContext("sc-probe", blockTheme)).anims;
        expect(anims.map((a) => a.kind)).toEqual(["scaleIn", kind]);
        // …both aimed at the same box, which is exactly what makes them non-additive
        // ONLY for reveals — the runtime guard lets these through for the same reason.
        expect(new Set(anims.map((a) => a.target)).size).toBe(1);
      },
    );

    test("a same-target REVEAL is still dropped", () => {
      const anims = Probe("fadeIn")()
        .withTransition({ animIn: "pop" })
        .build(rootContext("sc-probe", blockTheme)).anims;
      expect(anims.map((a) => a.kind)).toEqual(["scaleIn"]);
    });
  });
});

describe("treatment scene transition (render)", () => {
  test("default treatment ⇒ legacy entrance, no exit", () => {
    const html = renderScene(getTreatment("stat-grid")(), rootContext("s01-def", blockTheme, { voIds: ["l1", "l2"] }));
    expect(html).toContain('tl.from(page, { opacity: 0, duration: 0.3, ease: "power2.out" }, 0);');
    expect(html).not.toContain("_dout");
  });
  test("assigned animOut emits the clamped page exit; stays deterministic + leak-free", () => {
    const html = renderScene(
      getTreatment("stat-grid")().withTransition({ animOut: "slide-left", timeOut: "medium" }),
      rootContext("s01-out", blockTheme, { voIds: ["l1", "l2", "l3"] }),
    );
    expect(html).toContain("MC.slideOut(tl, page, dur - _dout, { dur: _dout, x: -140 });");
    expect(html).toContain("var _dout = Math.min(3, Math.max(0, dur - Math.min(1, dur)));");
    expect(html).not.toContain("data-anim");
    expect(() => scrubDeterminism(html)).not.toThrow();
  });
  test("assigned animIn replaces the legacy entrance", () => {
    const html = renderScene(
      getTreatment("stat-grid")().withTransition({ animIn: "wipe", timeIn: "long" }),
      rootContext("s01-in", blockTheme, { voIds: ["l1", "l2"] }),
    );
    expect(html).toContain("var _din = Math.min(5, dur);");
    expect(html).toContain("MC.wipeIn(tl, page, 0, { dur: _din });");
    expect(html).not.toContain("duration: 0.3"); // legacy default entrance gone
  });
});
