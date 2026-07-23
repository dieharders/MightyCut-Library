import { futureDecorationComponent } from "../future-decoration-shapes";

/** Future decoration family — hollow geometric emblems (hexagon, diamond, double
 *  chevron, triangle). Defaults to violet. Positioned page-space flourish; add via a
 *  treatment's addDecorations(). Future-only by roster; paints with the shared 10 palette roles. */
export const Glyph = futureDecorationComponent("glyph", {
  variant: "hexagon",
  x: 50,
  y: 50,
  size: 22,
  rotate: 0,
  layer: "back",
  accent: "accent-2",
});
