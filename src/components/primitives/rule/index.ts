import { professionalDecorationComponent } from "../professional-decoration-shapes";

/** Professional decoration family — thin accent rules (hairline, notch, ladder): the short
 *  cobalt lines the showcase sets above a section heading (`.aline`), rendered as round-capped
 *  hairline strokes. Defaults to a single hairline. Positioned page-space flourish; any
 *  treatment can add these via addDecorations(). Professional-only by ROSTER — paints with the
 *  shared palette roles, no theme-specific token. */
export const Rule = professionalDecorationComponent("rule", 22, {
  variant: "hairline",
  x: 20,
  y: 28,
  size: 22,
  rotate: 0,
  layer: "back",
  accent: "primary",
});
