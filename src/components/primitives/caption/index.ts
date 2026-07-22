import template from "./template.html" with { type: "text" };
import { component } from "../../runtime/component";
import { CaptionSchema } from "./schema";

/** A caption pill — the VO-transcript chrome. In the real render the root owns the
 *  caption rail; this is the library/showcase piece.
 *
 *  Structure (this template) + behavior (schema/rise entrance) are shared across every
 *  theme; the SKIN is theme-owned (`theme.skins.caption` — e.g. themes/block-caption.css),
 *  styling the standard `.caption`/`.cap-*` class names. block's is the white ink-bordered
 *  pill with a hard offset shadow + pastel accent bar; another theme restyles the same names. */
export const Caption = component({
  name: "caption",
  schema: CaptionSchema,
  template,
  example: { text: "Captions render in the theme's own pill.", accentBar: "pink" },
  fill: (p) => ({ text: p.text }),
  layout: (p) => ({ "--capbar": `var(--${p.accentBar})` }),
  animIn: "rise",
  animInOpts: { dist: 20 },
});
