import type { AnimDescriptor } from "../../runtime/anim";

/** Internal reveal: the progress fill reveals via `scaleX` (mirrors `bar`/`rank` — a
 *  static transform, never an animated layout width, so the fill is visible at rest in
 *  the showcase). The HUD is persistent chrome — it has NO whole-element entrance. */
export const hudAnim = (): AnimDescriptor[] => [
  { kind: "growBar", target: "fill", time: { at: "line", n: 0, plus: 0.1 }, opts: { prop: "scaleX" } },
];
