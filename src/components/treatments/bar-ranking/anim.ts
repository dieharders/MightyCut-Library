import type { AnimDescriptor } from "../../runtime/anim";

/** The headline rises in on the first VO line; each ranked row staggers after
 *  (the treatment offsets child anims to lines 1..N automatically). The caption
 *  footnote rises in last, a beat after the final row settles — keyed to the
 *  child count and past the accumulated child stagger (0.16s/row) so it lands
 *  after the data, not on top of it. */
export const barRankingAnim = (_p: unknown, childCount: number): AnimDescriptor[] => [
  { kind: "riseIn", target: "headline", time: { at: "line", n: 0 }, opts: { dist: 30 } },
  { kind: "riseIn", target: "caption", time: { at: "line", n: childCount, plus: childCount * 0.16 + 0.2 }, opts: { dist: 18 } },
];
