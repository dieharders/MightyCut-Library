import template from "./template.html" with { type: "text" };
import css from "./caption.css" with { type: "text" };
import { component } from "../../runtime/component";
import { CaptionSchema } from "./schema";

/** A caption pill — the block VO-transcript chrome: a white pill with a solid ink
 *  border + hard offset shadow, a pastel left accent bar, and mono text. In the
 *  real render the root owns the caption rail; this is the library/showcase piece. */
export const Caption = component({
  name: "caption",
  schema: CaptionSchema,
  template,
  css,
  example: { text: "Captions render in the theme's own pill.", accentBar: "pink" },
  fill: (p) => ({ text: p.text }),
  layout: (p) => ({ "--capbar": `var(--${p.accentBar})` }),
  animIn: "rise",
  animInOpts: { dist: 20 },
});
