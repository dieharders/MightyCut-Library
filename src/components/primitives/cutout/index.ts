import { creativeDecorationComponent } from "../creative-decoration-shapes";

/** Creative decoration family — TORN-PAPER collage scraps (torn, notch, sprocket): a rectangle
 *  with a ragged tear, a rectangle with a square bite out of a corner, and a film-strip block with
 *  punched holes. Rectangles that have been DAMAGED, never rectangles that have been softened —
 *  the pasted-up sheet a zine is made of. Defaults to an orange torn scrap at the brand's fixed
 *  badge angle of −4deg, since a pasted scrap is an annotation. Note the orange default is the
 *  hard-offset colour itself, so an unparameterised cutout's offset reads as a torn SECOND SHEET
 *  of the same paper rather than a cast shadow — that is the collage effect; any other accent role
 *  gives a contrasting offset. Positioned page-space flourish; any treatment can add these via
 *  addDecorations(). Creative-only by ROSTER — it paints with the shared 10 palette roles, no
 *  theme-specific token. */
export const Cutout = creativeDecorationComponent("cutout", 20, {
  variant: "torn",
  x: 50,
  y: 50,
  size: 20,
  rotate: -4,
  layer: "back",
  accent: "secondary",
});
