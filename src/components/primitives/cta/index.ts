import template from "./template.html" with { type: "text" };
import { component } from "../../runtime/component";
import { CtaSchema } from "./schema";

/** A CTA button — the block call-to-action: a yellow, ink-bordered, hard-shadowed
 *  button with bold Inter text and an optional trailing arrow. */
export const Cta = component({
  name: "cta",
  schema: CtaSchema,
  template,
  example: { text: "Click Here", arrow: true },
  fill: (p) => ({ text: p.text, arrow: p.arrow ? " →" : null }),
  animIn: "scale",
});
