import type { AnimDescriptor } from "../../runtime/anim";

/** The quote card scales in on the scene lead-in; the quote text fades in on the
 *  first VO line, then the attribution fades in at the next narration offset. */
export const quoteAnim = (): AnimDescriptor[] => [
  { kind: "scaleIn", target: "card", time: { at: "leadIn" }, opts: { from: 0.92 } },
  { kind: "fadeIn", target: "quote-text", time: { at: "line", n: 0 } },
  { kind: "fadeIn", target: "attribution", time: { at: "index", n: 1 } },
];
