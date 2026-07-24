import { professionalDecorationComponent } from "../professional-decoration-shapes";

/** Professional decoration family — diagonal accent panels (wedge, slice, flank): the soft
 *  clip-path plane the showcase floats behind a cover headline, rendered as a faint cobalt tint
 *  edged by a hairline. Defaults to a right-hand wedge. Positioned page-space flourish; any
 *  treatment can add these via addDecorations(). Professional-only by ROSTER (the decoration
 *  flag holds it out of every theme's Components grid; only professional rosters it) — it paints
 *  with the shared palette roles, no theme-specific token. */
export const Panel = professionalDecorationComponent("panel", 40, {
  variant: "wedge",
  x: 82,
  y: 50,
  size: 40,
  rotate: 0,
  layer: "back",
  accent: "primary",
});
