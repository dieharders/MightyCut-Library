import template from "./template.html" with { type: "text" };
import css from "./rank.css" with { type: "text" };
import { component } from "../../runtime/component";
import { rankAnim } from "./anim";
import { RankSchema } from "./schema";

/** A neobrutalist ranked row: a mono label, a bordered white track whose pastel fill
 *  grows out from the left, and a count-up value. The leader takes the yellow accent. */
export const Rank = component({
  name: "rank",
  schema: RankSchema,
  template,
  css,
  example: { value: 83, label: "Acme", max: 100, unit: "%" },
  fill: (p) => ({ "bar-label": p.label, "bar-value": `0${p.unit ?? ""}` }),
  layout: (p) => ({
    "--fill": `${Math.max(4, (p.value / p.max) * 100).toFixed(1)}%`,
    "--col": p.leader ? "var(--yellow)" : "var(--blue)",
  }),
  animIn: "fade",
  anim: rankAnim,
});
