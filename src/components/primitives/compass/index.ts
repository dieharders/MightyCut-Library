import { standardDecorationComponent } from "../standard-decoration-shapes";

/** Standard decoration family — the drafted compass RING PAIR (dial, lens, eclipse). `dial` is the
 *  reference's own `.geo-ring` verbatim: a solid outer circle with a dashed inner at 70% of its
 *  radius, the single most recognisable mark in the theme. Defaults to a centred dial in the Line
 *  taupe at the reference's own cover-ring size (~36cqw). Positioned page-space flourish; any
 *  treatment can add these via addDecorations(). Standard-only by ROSTER (the decoration flag
 *  holds it out of every theme's Components grid; only standard rosters it) — it paints with the
 *  shared 10 palette roles, no theme-specific token. */
export const Compass = standardDecorationComponent("compass", 36, {
  variant: "dial",
  x: 50,
  y: 50,
  size: 36,
  rotate: 0,
  layer: "back",
  accent: "accent-3",
});
