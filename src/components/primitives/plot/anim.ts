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
 * untouched. The skin states the END value explicitly, because `from` interpolates toward the
 * element's CURRENT computed value and `none` is not interpolable.
 *
 * THE SIDE INSETS ARE NEGATIVE, in both the from-state and the skin's end value, and they must
 * agree: a value label is centred on its point, so the FIRST and LAST points — the two whose
 * band centre sits closest to the box edge — hang their label over it, and a wide one (a long
 * `unitSuffix`, a 2-decimal figure) is cut in half by the very clip that draws the line. A
 * negative inset offset expands the clip region past the border box, which un-clips the
 * overhang while leaving the wipe itself untouched: only the RIGHT component animates, and it
 * animates in the same unit (100% → -6%) so GSAP interpolates one number per component with no
 * unit conversion in the middle. The vertical overhang is reserved in the geometry instead
 * (`PAD_TOP`, index.ts) — there is a headline directly above the plot box, so growing upward
 * would trade a clipped label for one sitting on the title.
 *
 * The allowance is 6% rather than 3% because the series now runs edge to edge: `PAD_X` leaves
 * the end points 4% from the box, where they used to sit a whole half-cell in (12.5% on a
 * four-point plot), so what a label can hang over the edge grew by the same amount the dead
 * space shrank.
 */
export const plotAnim = (_p: PlotParams): AnimDescriptor[] => [
  {
    kind: "from",
    target: "wipe",
    time: { at: "line", n: 0, plus: 0.15 },
    opts: { clipPath: "inset(0 100% 0 -6%)", duration: 1.1, ease: "power2.out" },
  },
];
