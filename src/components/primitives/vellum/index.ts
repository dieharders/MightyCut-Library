import { standardDecorationComponent } from "../standard-decoration-shapes";

/** Standard decoration family — the TRACING-PAPER plane (sheet, band, folio): standard's one
 *  FILLED mark, a 30%-white wash under a hairline edge that lets the stone canvas read straight
 *  through it, exactly as a feature card does. `folio` adds the catalogue's turned-page corner.
 *  This is the family that keeps the set from collapsing into "more line-art". Defaults to a
 *  centred sheet edged in the Line taupe. Positioned page-space flourish; any treatment can add
 *  these via addDecorations(). Standard-only by ROSTER — paints with the shared palette roles, no
 *  theme-specific token. */
export const Vellum = standardDecorationComponent("vellum", 26, {
  variant: "sheet",
  x: 50,
  y: 50,
  size: 26,
  rotate: 0,
  layer: "back",
  accent: "accent-3",
});
