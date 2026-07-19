import type { AnimDescriptor } from "../../runtime/anim";

/** The headline rises in on the first VO line; the two column headers rise in
 *  right after it (staggered col-a → col-b) so the "them / us" frame is set
 *  before the ledger rows stagger in after (the treatment offsets each row child
 *  to lines 1..N automatically). */
export const comparisonAnim = (): AnimDescriptor[] => [
  { kind: "riseIn", target: "headline", time: { at: "line", n: 0, plus: 0.1 }, opts: { dist: 30 } },
  { kind: "riseIn", target: "col-a", time: { at: "line", n: 0, plus: 0.4 }, opts: { dist: 18 } },
  { kind: "riseIn", target: "col-b", time: { at: "line", n: 0, plus: 0.55 }, opts: { dist: 18 } },
];
