import type { AnimDescriptor } from "../../runtime/anim";
import type { MatrixParams } from "./schema";

/**
 * The headline rises in on the first VO line and the criteria header follows right after, so the
 * columns are named before any row is scored against them (the treatment then offsets each row
 * child to lines 1..N automatically). The caption sits after the last row — `n: childCount`
 * resolves to the caption slot, the same trick chart/bar-ranking use.
 *
 * The caption descriptor is emitted only when there IS a caption: the slot is optional, and
 * `fill` returns null for it when absent, which prunes the element from the DOM. A tween left
 * pointing at a pruned element resolves to an empty selector, which GSAP warns about at render
 * time — harmless, but it is noise in the render log that reads like a real missing target.
 */
export const matrixAnim = (p: MatrixParams, childCount: number): AnimDescriptor[] => [
  { kind: "riseIn", target: "headline", time: { at: "line", n: 0, plus: 0.1 }, opts: { dist: 30 } },
  { kind: "riseIn", target: "criteria", time: { at: "line", n: 0, plus: 0.45 }, opts: { dist: 18 } },
  ...(p.caption
    ? [
        {
          kind: "riseIn" as const,
          target: "caption",
          time: { at: "line" as const, n: childCount, plus: 0.2 },
          opts: { dist: 18 },
        },
      ]
    : []),
];
