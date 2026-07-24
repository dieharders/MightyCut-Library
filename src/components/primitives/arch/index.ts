import { capsuleDecorationComponent } from "../capsule-decoration-shapes";

/** Capsule decoration family — half-round doorway silhouettes (dome, gate, tunnel,
 *  rainbow): the pill cut in half, the biggest, quietest shapes in the set. Defaults to
 *  lavender. Positioned page-space flourish; add via a treatment's addDecorations().
 *  Capsule-only by roster; paints with the shared 10 palette roles.
 *
 *  Left UPRIGHT by default (rotate 0) where the other three families carry a candy tilt —
 *  an arch reads as an arch only while its baseline is level. */
export const Arch = capsuleDecorationComponent("arch", {
  variant: "dome",
  x: 50,
  y: 50,
  size: 24,
  rotate: 0,
  layer: "back",
  accent: "accent-3",
});
