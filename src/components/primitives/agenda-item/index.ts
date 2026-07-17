import template from "./template.html" with { type: "text" };
import css from "./agenda-item.css" with { type: "text" };
import { component } from "../../runtime/component";
import { AgendaItemSchema } from "./schema";

/** A single ink-ruled agenda row: a pink index numeral, an uppercase title, and
 *  an optional right-aligned detail — the atom of the Agenda index list. */
export const AgendaItem = component({
  name: "agenda-item",
  schema: AgendaItemSchema,
  template,
  css,
  example: { num: "01", title: "Why it matters", detail: "5 min" },
  fill: (p) => ({ "step-num": p.num, "step-title": p.title, "step-body": p.detail ?? null }),
  animIn: "rise",
  animInOpts: { dist: 20 },
});
