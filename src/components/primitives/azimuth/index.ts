import { standardDecorationComponent } from "../standard-decoration-shapes";

/** Standard decoration family — the RADIAL bearing (rose, fan, pivot): straight radii struck out
 *  from a pivot, never a closed curve. `rose` is the sixteen-point compass rose with its four
 *  cardinals drawn heavy, `fan` the protractor's quarter-turn swing from a corner, `pivot` the
 *  graduated dial face with its ring left for the eye to complete. Together with `compass` (which
 *  closes a curve) and `sweep` (which leaves one open) they are one instrument answered three ways.
 *  Defaults to a centred rose in Ink — the one standard mark drawn in the theme's black rather than
 *  in stone, which is why the roster caps decorations at two per frame. Positioned page-space
 *  flourish; any treatment can add these via addDecorations(). Standard-only by ROSTER (the
 *  decoration flag holds it out of every theme's Components grid; only standard rosters it) — it
 *  paints with the shared 10 palette roles, no theme-specific token. */
export const Azimuth = standardDecorationComponent("azimuth", 32, {
  variant: "rose",
  x: 50,
  y: 50,
  size: 32,
  rotate: 0,
  layer: "back",
  accent: "dark",
});
