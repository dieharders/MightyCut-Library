import { creativeDecorationComponent } from "../creative-decoration-shapes";

/** Creative decoration family — the rotated closing SEAL (seal, rosette, medallion): a cogged
 *  disc, a many-lobed scalloped disc, and a disc with a concentric inner rule. Round silhouettes,
 *  the one place creative allows a circle (FRAME.md · stamp + decorative-circle); everything
 *  structural in the theme stays square-cornered. Defaults to a pink seal at the brand's fixed
 *  stamp angle of −6deg and to FRAME.md's own "~18cqw square" stamp size. Positioned page-space
 *  flourish; any treatment can add these via addDecorations(). Creative-only by ROSTER (the
 *  decoration flag holds it out of every theme's Components grid; only creative rosters it) — it
 *  paints with the shared 10 palette roles, no theme-specific token. */
export const Stamp = creativeDecorationComponent("stamp", 18, {
  variant: "seal",
  x: 50,
  y: 50,
  size: 18,
  rotate: -6,
  layer: "back",
  accent: "primary",
});
