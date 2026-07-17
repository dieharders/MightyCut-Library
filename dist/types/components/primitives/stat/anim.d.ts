import type { AnimDescriptor } from "../../runtime/anim";
import type { StatParams } from "./schema";
/** Internal reveal: the number counts up from 0 (the card's whole-element entrance
 *  is the `animIn` transition on the component def). */
export declare const statAnim: (p: StatParams) => AnimDescriptor[];
