import { futureDecorationComponent } from "../future-decoration-shapes";

/** Future decoration family — luminous constellation points (ring, core, orbit, pulse)
 *  that echo the backdrop's particle network. Positioned page-space flourish; any
 *  treatment can add these via addDecorations(). Future-only (references --fx-* tokens). */
export const Node = futureDecorationComponent(
  "node",
  ["ring", "core", "orbit", "pulse"],
  { variant: "orbit", x: 50, y: 50, size: 22, rotate: 0, layer: "back", accent: "cyan" },
);
