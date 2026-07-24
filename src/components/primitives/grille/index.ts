import { professionalDecorationComponent } from "../professional-decoration-shapes";

/** Professional decoration family — cobalt dot grilles (matrix, scatter, stack): the quiet dot
 *  fields the showcase drops beside a cover, rendered as bold, translucent discs. Defaults to a
 *  centred 3×3 matrix. Positioned page-space flourish; any treatment can add these via
 *  addDecorations(). Professional-only by ROSTER — paints with the shared palette roles, no
 *  theme-specific token. */
export const Grille = professionalDecorationComponent("grille", 26, {
  variant: "matrix",
  x: 50,
  y: 50,
  size: 26,
  rotate: 0,
  layer: "back",
  accent: "primary",
});
