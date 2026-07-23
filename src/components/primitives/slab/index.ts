import { decorationComponent } from "../decoration-shapes";

/** Decoration family — angular ink-bordered blocks (square, rectangle, rhombus,
 *  hexagon, cross). Positioned page-space flourish; add via a treatment's addDecorations(). */
export const Slab = decorationComponent(
  "slab",
  ["square", "rectangle", "rhombus", "hexagon", "cross"],
  { variant: "square", x: 50, y: 50, size: 24, rotate: 0, layer: "back", accent: "secondary" },
);
