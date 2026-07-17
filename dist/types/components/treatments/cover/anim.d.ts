import type { AnimDescriptor } from "../../runtime/anim";
/** Cover motion: the eyebrow pill fades in on the scene lead-in, the headline
 *  drives up on the first VO line, and the subtitle fades in a beat later.
 *  Optional-slot anims no-op when the slot is dropped (the interpreter skips a
 *  missing target). */
export declare const coverAnim: () => AnimDescriptor[];
