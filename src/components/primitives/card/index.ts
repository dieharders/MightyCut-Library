import template from "./template.html" with { type: "text" };
import { component } from "../../runtime/component";
import { CardSchema } from "./schema";

/** A neobrutalist feature card: a bordered white tile with an accent icon square, a bold uppercase title, and a supporting line. */
export const Card = component({
  name: "card",
  schema: CardSchema,
  template,
  example: { title: "Prompt to preview", body: "Describe the video; get a preview-ready deck back in one pass.", icon: "I" },
  fill: (p) => ({ "card-icon": p.icon, "card-title": p.title, "card-body": p.body }),
  // Emitted only when set — see caption/index.ts.
  layout: (p): Record<string, string> => (p.accent ? { "--ic": `var(--${p.accent})` } : {}),
  animIn: "rise",
  animInOpts: { dist: 26 },
});
