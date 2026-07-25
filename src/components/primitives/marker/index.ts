import { creativeDecorationComponent } from "../creative-decoration-shapes";

/** Creative decoration family — the bold editorial CALLOUT mark (bolt, blade, caret): a lightning
 *  zag, a sheared parallelogram slash, and a chunky angular arrow-head. Pointed and angular —
 *  every vertex is a corner, nothing is eased — the flourish form of FRAME.md's marker-block, the
 *  frame's one hard-offset featured element. Defaults to a yellow bolt at the brand's fixed badge
 *  angle of −4deg. Positioned page-space flourish; any treatment can add these via
 *  addDecorations(). Creative-only by ROSTER — it paints with the shared 10 palette roles, no
 *  theme-specific token. */
export const Marker = creativeDecorationComponent("marker", 16, {
  variant: "bolt",
  x: 50,
  y: 50,
  size: 16,
  rotate: -4,
  layer: "back",
  accent: "accent-1",
});
