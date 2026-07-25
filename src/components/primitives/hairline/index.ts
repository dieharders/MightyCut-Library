import { standardDecorationComponent } from "../standard-decoration-shapes";

/** Standard decoration family — the ruled MARK (axis, ladder, margin): straight lines at the
 *  theme's one hairline weight. `axis` is the drafting cross, `ladder` the catalogue's ranged
 *  index, and `margin` the reference's `.ha` — the ONE heavier rule standard allows, over its own
 *  full-width hairline. Wide-and-short boxes, because a rule is a proportion rather than a square.
 *  Defaults to a centred axis in Ink, the colour the reference draws its accent rule in.
 *  Positioned page-space flourish; any treatment can add these via addDecorations().
 *  Standard-only by ROSTER — paints with the shared palette roles, no theme-specific token. */
export const Hairline = standardDecorationComponent("hairline", 34, {
  variant: "axis",
  x: 50,
  y: 50,
  size: 34,
  rotate: 0,
  layer: "back",
  accent: "dark",
});
