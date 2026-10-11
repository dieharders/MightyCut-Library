import type { AnimDescriptor } from "../../runtime/anim";
import type { OutroParams } from "./schema";

/** The card springs in at the scene lead-in and the headline rises on the first VO line. The
 *  call to action is a CHILD (the `cta` component) and brings its own entrance in the child
 *  slot after the headline; the optional contact line settles in after it — quietly, since it
 *  is a reference line rather than a call to act. `index n` is the beat after the title plus
 *  one per child, so the contact lands after however many buttons the plate carries. */
export const outroAnim = (p: OutroParams, childCount: number): AnimDescriptor[] => {
  const anims: AnimDescriptor[] = [
    { kind: "scaleIn", target: "card", time: { at: "leadIn" }, opts: { ease: "back.out(1.5)" } },
    { kind: "riseIn", target: "headline", time: { at: "line", n: 0 }, opts: { dist: 30 } },
  ];
  if (p.contact) {
    anims.push({ kind: "fadeIn", target: "contact", time: { at: "index", n: childCount + 1 } });
  }
  return anims;
};
