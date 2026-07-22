import { futureDecorationComponent } from "../future-decoration-shapes";

/** Future decoration family — hollow geometric emblems (hexagon, diamond, double
 *  chevron, triangle). Defaults to violet. Positioned page-space flourish; add via a
 *  treatment's addDecorations(). Future-only (references --fx-* tokens). */
export const Glyph = futureDecorationComponent(
  "glyph",
  ["hexagon", "diamond", "chevron", "triangle"],
  { variant: "hexagon", x: 50, y: 50, size: 22, rotate: 0, layer: "back", accent: "violet" },
);
