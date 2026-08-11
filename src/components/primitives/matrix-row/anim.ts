import type { AnimDescriptor } from "../../runtime/anim";
import type { MatrixRowParams } from "./schema";

/** Default motion: the row's label and its check/cross cells stagger in together on its VO
 *  line (the Matrix treatment offsets each row to lines 1..N automatically), so a row reads
 *  left-to-right as it lands rather than appearing all at once. */
export const matrixRowAnim = (_p: MatrixRowParams): AnimDescriptor[] => [
  { kind: "staggerIn", target: "item", time: { at: "line", n: 0 }, opts: { dist: 18, each: 0.08 } },
];
