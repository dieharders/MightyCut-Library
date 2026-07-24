import { creativeDecorationComponent } from "../creative-decoration-shapes";

/** Creative decoration family — the zine RULE (zigzag, sawtooth, wave): a band running the full
 *  width of its box, as a sharp triangular chevron, an asymmetric ramp saw, or a squared-off
 *  crenellation. The only family with a non-square element (height ratio 0.375), so it reads as a
 *  ruled divider pasted across the frame rather than as a tile. Defaults to a green zigzag, set
 *  LEVEL — FRAME.md licenses rotation only at −4/−6deg, and a rule that runs off the horizontal
 *  stops reading as a rule. Larger default size than the solid families for the same reason.
 *  Positioned page-space flourish; any treatment can add these via addDecorations().
 *  Creative-only by ROSTER — it paints with the shared 10 palette roles, no theme-specific token. */
export const Zag = creativeDecorationComponent("zag", 26, {
  variant: "zigzag",
  x: 50,
  y: 50,
  size: 26,
  rotate: 0,
  layer: "back",
  accent: "accent-2",
});
