import type { AnimDescriptor } from "../../runtime/anim";

/** The headline rises in on the first VO line; each item staggers after (the treatment
 *  offsets child anims to lines 1..N automatically) — identical to feature-cards, which
 *  this look currently shares a skin with. */
export const listAnim = (): AnimDescriptor[] => [
  { kind: "riseIn", target: "headline", time: { at: "line", n: 0, plus: 0.1 }, opts: { dist: 30 } },
];
