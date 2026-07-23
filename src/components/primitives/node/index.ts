import { futureDecorationComponent } from "../future-decoration-shapes";

/** Future decoration family — luminous constellation points (ring, core, orbit, pulse)
 *  that echo the backdrop's particle network. Defaults to cyan. Positioned page-space
 *  flourish; any treatment can add these via addDecorations(). Future-only by ROSTER
 *  (the decoration flag holds it out of every theme's Components grid; only future rosters
 *  it) — it paints with the shared 10 palette roles, no theme-specific token.
 *
 *  Exported as `NodeDeco`, not `Node`: the bare name shadows the DOM's `Node` global in
 *  every module that imports it (registry.ts also handles DOM-shaped values), where an
 *  `instanceof Node` would then silently mean this component. The COMPONENT name — the
 *  string decks, schemas and the editor address it by — is still `"node"`. */
export const NodeDeco = futureDecorationComponent("node", {
  variant: "orbit",
  x: 50,
  y: 50,
  size: 22,
  rotate: 0,
  layer: "back",
  accent: "primary",
});
