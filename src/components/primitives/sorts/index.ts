import { standardDecorationComponent } from "../standard-decoration-shapes";

/** Standard decoration family — the SORT (query, semicolon, brace, quotation): a single piece of
 *  type, set enormous and hung behind the content as a watermark. A "sort" is one character in a
 *  compositor's case, which is exactly what each of these is — a real glyph of Playfair Display,
 *  not a drawing of one, so it carries the face's own didone contrast and ball terminals at
 *  ornament scale.
 *
 *  It is the only decoration in the library made of type rather than geometry, and it is the
 *  theme's most characteristic mark: standard has no colour, no shadow, no fill and one line
 *  weight, so its typography is most of what it has to spend — and the reference already spends it
 *  this way, hanging a display-scale quotation mark behind its pull quote. Where `compass`, `sweep`
 *  and `azimuth` draw the instrument that ruled the page, this one is a piece of the page.
 *
 *  Defaults to a centred quotation mark in the Line brownstone — the reference's own `.qm`, at page
 *  scale. Positioned page-space flourish; any treatment can add these via addDecorations().
 *  Standard-only by ROSTER (the decoration flag holds it out of every theme's Components grid; only
 *  standard rosters it) — it paints with the shared 10 palette roles, no theme-specific token. */
export const Sorts = standardDecorationComponent("sorts", 26, {
  variant: "quotation",
  x: 50,
  y: 50,
  size: 26,
  rotate: 0,
  layer: "back",
  accent: "accent-3",
});
