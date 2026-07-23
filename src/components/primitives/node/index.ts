import { futureDecorationComponent } from "../future-decoration-shapes";

/** Future decoration family — luminous constellation points (ring, core, orbit, pulse)
 *  that echo the backdrop's particle network. Defaults to cyan. Positioned page-space
 *  flourish; any treatment can add these via addDecorations(). Future-only by ROSTER
 *  (the decoration flag holds it out of every theme's Components grid; only future rosters
 *  it) — it paints with the shared 10 palette roles, no theme-specific token. */
export const Node = futureDecorationComponent(
  "node",
  ["ring", "core", "orbit", "pulse"],
  { variant: "orbit", x: 50, y: 50, size: 22, rotate: 0, layer: "back", accent: "primary" },
);
