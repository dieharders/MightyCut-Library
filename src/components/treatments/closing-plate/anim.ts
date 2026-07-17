import type { AnimDescriptor } from "../../runtime/anim";
import type { ClosingPlateParams } from "./schema";

/** The card springs in at the scene lead-in, the headline rises on the first VO
 *  line, and the optional CTA chip pops in after it. */
export const closingPlateAnim = (p: ClosingPlateParams): AnimDescriptor[] => {
  const anims: AnimDescriptor[] = [
    { kind: "scaleIn", target: "card", time: { at: "leadIn" }, opts: { ease: "back.out(1.5)" } },
    { kind: "riseIn", target: "headline", time: { at: "line", n: 0 }, opts: { dist: 30 } },
  ];
  if (p.cta) {
    anims.push({ kind: "scaleIn", target: "cta", time: { at: "index", n: 1 }, opts: { ease: "back.out(2)" } });
  }
  return anims;
};
