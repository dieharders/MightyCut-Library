import type { AnimDescriptor } from "../../runtime/anim";
import type { BarParams } from "./schema";
/** Internal reveal: the column grows up from the baseline, then the value counts up
 *  from 0 (the whole-bar entrance is the `animIn` transition on the component def). */
export declare const barAnim: (p: BarParams) => AnimDescriptor[];
