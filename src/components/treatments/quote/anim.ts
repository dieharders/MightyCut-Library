import type { AnimDescriptor } from "../../runtime/anim";

/** The eyebrow pill fades in on the scene lead-in as the quote card scales in with
 *  it; the quote text fades in on the first VO line, then the attribution fades in
 *  at the next narration offset. */
export const quoteAnim = (): AnimDescriptor[] => [
  { kind: "fadeIn", target: "eyebrow", time: { at: "leadIn" } },
  { kind: "scaleIn", target: "card", time: { at: "leadIn" }, opts: { from: 0.92 } },
  { kind: "fadeIn", target: "quote-text", time: { at: "line", n: 0 } },
  { kind: "fadeIn", target: "attribution", time: { at: "index", n: 1 } },
];
