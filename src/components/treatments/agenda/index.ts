import template from "./template.html" with { type: "text" };
import { AgendaItem } from "../../primitives/agenda-item";
import { treatment } from "../../runtime/treatment";
import { agendaAnim } from "./anim";
import { AgendaSchema } from "./schema";

/** A sparse, ink-ruled numbered index — the Agenda skin over the steps data
 *  (sibling of Timeline). A headline over a column of AgendaItem rows. */
export const Agenda = treatment({
  name: "agenda",
  childComponent: "agenda-item",
  schema: AgendaSchema,
  template,
  ground: "offwhite",
  example: { headline: "What we'll cover" },
  defaultChildren: () => [
    AgendaItem({ num: "01", title: "The problem", detail: "Why now" }),
    AgendaItem({ num: "02", title: "Our approach", detail: "How it works" }),
    AgendaItem({ num: "03", title: "The results", detail: "Proof" }),
    AgendaItem({ num: "04", title: "What's next", detail: "Roadmap" }),
  ],
  fill: (p) => ({ headline: p.headline }),
  anim: agendaAnim,
});
