import { professionalDecorationComponent } from "../professional-decoration-shapes";

/** Professional decoration family — concentric keylines (single, double, inset): the ring motif
 *  answered with right angles — clean nested square frames that keyline a region, the way an
 *  editorial deck borders a slide. Defaults to a centred single keyline. Positioned page-space
 *  flourish; any treatment can add these via addDecorations(). Professional-only by ROSTER —
 *  paints with the shared palette roles, no theme-specific token. */
export const Keyline = professionalDecorationComponent("keyline", 36, {
  variant: "single",
  x: 50,
  y: 50,
  size: 36,
  rotate: 0,
  layer: "back",
  accent: "primary",
});
