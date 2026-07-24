import { professionalDecorationComponent } from "../professional-decoration-shapes";

/** Professional decoration family — framing corner marks (corners, elbow, ticks): L-brackets and
 *  edge ticks that frame a region like a viewfinder or print crop marks — recognisable and
 *  structural, not abstract. Defaults to four centred corner brackets. Positioned page-space
 *  flourish; any treatment can add these via addDecorations(). Professional-only by ROSTER —
 *  paints with the shared palette roles, no theme-specific token. */
export const Corner = professionalDecorationComponent("corner", 46, {
  variant: "corners",
  x: 50,
  y: 50,
  size: 46,
  rotate: 0,
  layer: "back",
  accent: "primary",
});
