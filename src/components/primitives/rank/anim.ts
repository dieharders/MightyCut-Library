import type { AnimDescriptor } from "../../runtime/anim";
import type { RankParams } from "./schema";

/** Default motion: the row fades in, its fill grows out from the left, then the value counts up.
 *  The fill reveals via `scaleX` on a static-width `.bcol` (mirrors `bar`'s `scaleY`), NOT by
 *  animating `width`: gsap.from({width:0}) snapshots the element's computed width when applyAnims
 *  runs, which in the showcase is synchronous before the scaled/aspect-ratio container has laid
 *  out — recording an end-width of ~0 and leaving the fill invisible at progress(1). */
export const rankAnim = (p: RankParams): AnimDescriptor[] => [
  { kind: "growBar", target: "col", time: { at: "line", n: 0 }, opts: { prop: "scaleX" } },
  {
    kind: "countUp",
    target: "value",
    time: { at: "line", n: 0, plus: 0.1 },
    opts: { to: p.value, prefix: p.unitPrefix ?? "", suffix: p.unitSuffix ?? "" },
  },
];
