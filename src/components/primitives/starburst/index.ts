import { decorationComponent } from "../decoration-shapes";

/** Decoration family — pointed & round bursts (star, burst, triangle, circle).
 *  Positioned page-space flourish; any treatment can add these via addDecorations(). */
export const Starburst = decorationComponent("starburst", {
  variant: "star",
  x: 50,
  y: 50,
  size: 26,
  rotate: 0,
  layer: "back",
  accent: "primary",
});
