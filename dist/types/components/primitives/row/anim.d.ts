import type { AnimDescriptor } from "../../runtime/anim";
import type { RowParams } from "./schema";
/** Default motion: the row's three cells stagger in together on its VO line
 *  (the Comparison treatment offsets each row to lines 1..N automatically). */
export declare const rowAnim: (_p: RowParams) => AnimDescriptor[];
