import { professionalDecorationComponent } from "../professional-decoration-shapes";

/** Professional decoration family — cobalt dot grilles (matrix, scatter, stack): the quiet dot
 *  fields the showcase drops top-right of a cover, rendered as filled, translucent discs.
 *  Defaults to a 3×3 matrix. Positioned page-space flourish; any treatment can add these via
 *  addDecorations(). Professional-only by ROSTER — paints with the shared palette roles, no
 *  theme-specific token. */
export const Grille = professionalDecorationComponent("grille", 18, {
  variant: "matrix",
  x: 88,
  y: 20,
  size: 18,
  rotate: 0,
  layer: "back",
  accent: "primary",
});
