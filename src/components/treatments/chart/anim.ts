import type { AnimDescriptor } from "../../runtime/anim";

/** The headline rises in on the first VO line; each bar child grows after
 *  (the treatment offsets child anims to lines 1..N automatically). The caption
 *  footnote rises in last, a beat after the final bar settles — keyed to the
 *  child count and past the accumulated child stagger (0.16s/bar) so it lands
 *  after the data, not on top of it. */
export const chartAnim = (_p: unknown, childCount: number): AnimDescriptor[] => [
  { kind: "riseIn", target: "headline", time: { at: "line", n: 0, plus: 0.1 }, opts: { dist: 30 } },
  { kind: "riseIn", target: "caption", time: { at: "line", n: childCount, plus: childCount * 0.16 + 0.2 }, opts: { dist: 18 } },
];
