import template from "./template.html" with { type: "text" };
import css from "./bar.css" with { type: "text" };
import { component } from "../../runtime/component";
import { barAnim } from "./anim";
import { BarSchema } from "./schema";

/** A neobrutalist vertical chart column: a bordered pastel bar that grows from the
 *  baseline while its value counts up. The leader column is yellow, the rest blue. */
export const Bar = component({
  name: "bar",
  schema: BarSchema,
  template,
  css,
  example: { value: 42, label: "Q1", max: 100 },
  fill: (p) => ({ "bar-value": `0${p.unit ?? ""}`, "bar-label": p.label }),
  layout: (p) => ({
    "--fill": `${Math.max(4, (p.value / p.max) * 100).toFixed(1)}%`,
    "--col": p.leader ? "var(--yellow)" : "var(--blue)",
  }),
  animIn: "fade",
  anim: barAnim,
});
