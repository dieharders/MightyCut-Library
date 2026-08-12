import type { AnimDescriptor } from "../../runtime/anim";
import type { PlotParams } from "./schema";

/**
 * ONE LEFT-TO-RIGHT WIPE, and it reveals the line, its points and their values together —
 * which is what a line chart drawing itself looks like.
 *
 * `from` with a `clip-path`, not `strokeDashoffset`. The obvious way to draw a polyline is to
 * dash it and animate the offset, and it cannot be done from here: the SVG is injected as RAW
 * TEXT through the `data-html` seam (fillRaw sets a single text node), so `stampAnims` never
 * walks into it and no element inside the SVG can be given a scoped anim class to target. What
 * IS targetable is the wrapper the raw markup sits in — and clipping that wrapper wipes the
 * geometry and the HTML point overlay in one pass, which the dash trick could not do anyway.
 *
 * `uVars` (mc.js) only unit-converts numeric `x`/`y`, so the clip-path string reaches GSAP
 * untouched. The skin states the END value (`clip-path: inset(0)`) explicitly, because `from`
 * interpolates toward the element's CURRENT computed value and `none` is not interpolable.
 */
export const plotAnim = (_p: PlotParams): AnimDescriptor[] => [
  {
    kind: "from",
    target: "wipe",
    time: { at: "line", n: 0, plus: 0.15 },
    opts: { clipPath: "inset(0 100% 0 0)", duration: 1.1, ease: "power2.out" },
  },
];
