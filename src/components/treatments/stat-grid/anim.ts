import type { AnimDescriptor } from "../../runtime/anim";

/** The headline rises in on the first VO line; each stat child staggers after
 *  (the treatment offsets child anims to lines 1..N automatically). */
export const statGridAnim = (): AnimDescriptor[] => [
  { kind: "riseIn", target: "headline", time: { at: "line", n: 0, plus: 0.1 }, opts: { dist: 30 } },
];
