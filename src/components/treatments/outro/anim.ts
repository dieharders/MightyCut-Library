import type { AnimDescriptor } from "../../runtime/anim";
import type { OutroParams } from "./schema";

/** The card springs in at the scene lead-in, the headline rises on the first VO
 *  line, the optional CTA chip pops in after it, and the optional contact line settles in
 *  last — quietly, since it is a reference line rather than a call to act. */
export const outroAnim = (p: OutroParams): AnimDescriptor[] => {
  const anims: AnimDescriptor[] = [
    { kind: "scaleIn", target: "card", time: { at: "leadIn" }, opts: { ease: "back.out(1.5)" } },
    { kind: "riseIn", target: "headline", time: { at: "line", n: 0 }, opts: { dist: 30 } },
  ];
  if (p.cta) {
    anims.push({ kind: "scaleIn", target: "cta", time: { at: "index", n: 1 }, opts: { ease: "back.out(2)" } });
  }
  if (p.contact) {
    anims.push({ kind: "fadeIn", target: "contact", time: { at: "index", n: p.cta ? 2 : 1 } });
  }
  return anims;
};
