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
  fill: (p) => ({
    "bar-value": `${p.unitPrefix ?? ""}0${p.unitSuffix ?? ""}`,
    "bar-label": p.label,
  }),
  layout: (p) => ({
    // Fill = value/max, clamped to 0–100% (0 = empty, value ≥ max = full). No minimum floor,
    // so small values register; no negative or over-100 overflow.
    "--fill": `${Math.min(100, Math.max(0, (p.value / p.max) * 100)).toFixed(1)}%`,
    "--col": p.leader ? "var(--yellow)" : "var(--blue)",
  }),
  animIn: "fade",
  anim: barAnim,
});
