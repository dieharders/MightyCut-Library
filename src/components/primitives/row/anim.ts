import type { AnimDescriptor } from "../../runtime/anim";
import type { RowParams } from "./schema";

/** Default motion: the row's three cells stagger in together on its VO line
 *  (the Comparison treatment offsets each row to lines 1..N automatically). */
export const rowAnim = (_p: RowParams): AnimDescriptor[] => [
  { kind: "staggerIn", target: "item", time: { at: "line", n: 0 }, opts: { dist: 18, each: 0.08 } },
];
