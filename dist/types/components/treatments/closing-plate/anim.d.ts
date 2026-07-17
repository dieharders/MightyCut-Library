import type { AnimDescriptor } from "../../runtime/anim";
import type { ClosingPlateParams } from "./schema";
/** The card springs in at the scene lead-in, the headline rises on the first VO
 *  line, and the optional CTA chip pops in after it. */
export declare const closingPlateAnim: (p: ClosingPlateParams) => AnimDescriptor[];
