import type { AnimDescriptor } from "../../runtime/anim";
/** Internal reveal: the progress fill reveals via `scaleX` (mirrors `bar`/`rank` — a
 *  static transform, never an animated layout width, so the fill is visible at rest in
 *  the showcase). The HUD is persistent chrome — it has NO whole-element entrance. */
export declare const hudAnim: () => AnimDescriptor[];
