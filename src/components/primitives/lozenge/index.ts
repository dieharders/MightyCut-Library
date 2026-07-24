import { capsuleDecorationComponent } from "../capsule-decoration-shapes";

/** Capsule decoration family — the pure pill geometry (pill, stadium, disc, slot): the
 *  theme's own container shape, scattered as atmosphere. Defaults to sky. Positioned
 *  page-space flourish; add via a treatment's addDecorations(). Capsule-only by roster;
 *  paints with the shared 10 palette roles. */
export const Lozenge = capsuleDecorationComponent("lozenge", {
  variant: "pill",
  x: 50,
  y: 50,
  size: 18,
  rotate: 6,
  layer: "back",
  accent: "secondary",
});
