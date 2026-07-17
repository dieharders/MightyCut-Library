import type { AnimDescriptor } from "../../runtime/anim";

/** The headline rises in on the first VO line; each ranked row staggers after
 *  (the treatment offsets child anims to lines 1..N automatically). */
export const barRankingAnim = (): AnimDescriptor[] => [
  { kind: "riseIn", target: "headline", time: { at: "line", n: 0 }, opts: { dist: 30 } },
];
