import { futureDecorationComponent } from "../future-decoration-shapes";

/** Future decoration family — HUD targeting reticles (corner brackets, crosshair, dial
 *  gauge, clipped-corner frame). Positioned page-space flourish; add via a treatment's
 *  addDecorations(). Future-only (references --fx-* tokens). */
export const Reticle = futureDecorationComponent(
  "reticle",
  ["brackets", "crosshair", "gauge", "frame"],
  { variant: "brackets", x: 50, y: 50, size: 26, rotate: 0, layer: "back", accent: "cyan" },
);
