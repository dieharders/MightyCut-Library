import template from "./template.html" with { type: "text" };
import { treatment } from "../../runtime/treatment";
import { quoteAnim } from "./anim";
import { QuoteSchema } from "./schema";

/** A neobrutalist pull-quote: a centered bordered card on a pink ground, with an
 *  optional eyebrow pill and attribution line. No children. */
export const Quote = treatment({
  name: "quote",
  schema: QuoteSchema,
  template,
  ground: "pink",
  example: {
    text: "Design is not just what it looks like. Design is how it works.",
    attribution: "Steve Jobs",
    eyebrow: "In their words",
  },
  defaultChildren: () => [],
  fill: (p) => ({ "quote-text": p.text, attribution: p.attribution, eyebrow: p.eyebrow }),
  anim: quoteAnim,
});
