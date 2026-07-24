import { professionalDecorationComponent } from "../professional-decoration-shapes";

/** Professional decoration family — concentric rings (halo, target, contour): the faint
 *  concentric circles the showcase centres behind a pull quote, rendered as hairline strokes.
 *  Defaults to a two-ring halo. Positioned page-space flourish; any treatment can add these via
 *  addDecorations(). Professional-only by ROSTER — paints with the shared palette roles, no
 *  theme-specific token. */
export const Ring = professionalDecorationComponent("ring", 30, {
  variant: "halo",
  x: 50,
  y: 50,
  size: 30,
  rotate: 0,
  layer: "back",
  accent: "primary",
});
