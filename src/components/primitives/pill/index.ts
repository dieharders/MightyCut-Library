import template from "./template.html" with { type: "text" };
import { component } from "../../runtime/component";
import { PillSchema } from "./schema";

/** A label pill — the block eyebrow chrome: an ink-bordered, hard-shadowed pill in
 *  a pastel `variant`, uppercase mono text. Only the background differs by variant. */
export const Pill = component({
  name: "pill",
  schema: PillSchema,
  template,
  example: { text: "Label Pill", variant: "pink" },
  fill: (p) => ({ text: p.text }),
  layout: (p) => ({ "--pillbg": `var(--${p.variant})` }),
  animIn: "rise",
  animInOpts: { dist: 18 },
});
