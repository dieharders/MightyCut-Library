import template from "./template.html" with { type: "text" };
import { treatment } from "../../runtime/treatment";
import { statementAnim } from "./anim";
import { StatementSchema } from "./schema";

/** A neobrutalist pull-quote: a centered bordered card on a pink ground, with an
 *  optional eyebrow pill and attribution line. No children. */
export const Statement = treatment({
  name: "statement",
  schema: StatementSchema,
  template,
  ground: "primary",
  example: {
    text: "Design is not just what it looks like. Design is how it works.",
    attribution: "Steve Jobs",
    eyebrow: "In their words",
  },
  defaultChildren: () => [],
  fill: (p) => ({ "quote-text": p.text, attribution: p.attribution, eyebrow: p.eyebrow }),
  anim: statementAnim,
});
