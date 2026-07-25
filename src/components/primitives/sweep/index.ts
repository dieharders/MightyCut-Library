import { standardDecorationComponent } from "../standard-decoration-shapes";

/** Standard decoration family — the OPEN compass arc (quadrant, crescent, bow): the stroke the
 *  instrument actually leaves, in three lengths of the same gesture. Where `compass` closes its
 *  circles, this family never does — which is what keeps the two apart at a glance. Defaults to a
 *  centred quarter arc in the Brownstone accent. Positioned page-space flourish; any treatment can add
 *  these via addDecorations(). Standard-only by ROSTER — paints with the shared palette roles, no
 *  theme-specific token. */
export const Sweep = standardDecorationComponent("sweep", 30, {
  variant: "quadrant",
  x: 50,
  y: 50,
  size: 30,
  rotate: 0,
  layer: "back",
  accent: "primary",
});
