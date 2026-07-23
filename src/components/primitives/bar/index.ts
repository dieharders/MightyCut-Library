import template from "./template.html" with { type: "text" };
import { component } from "../../runtime/component";
import { barAnim } from "./anim";
import { BarSchema } from "./schema";

/** A neobrutalist vertical chart column: a bordered pastel bar that grows from the
 *  baseline while its value counts up. The leader column takes --accent-1, the rest --secondary. */
export const Bar = component({
  name: "bar",
  schema: BarSchema,
  template,
  example: { value: 42, label: "Q1", max: 100 },
  fill: (p) => ({
    "bar-value": `${p.unitPrefix ?? ""}0${p.unitSuffix ?? ""}`,
    "bar-label": p.label,
  }),
  layout: (p) => ({
    // Fill = value/max, clamped to 0–100% (0 = empty, value ≥ max = full). No minimum floor,
    // so small values register; no negative or over-100 overflow.
    "--fill": `${Math.min(100, Math.max(0, (p.value / p.max) * 100)).toFixed(1)}%`,
    // The leader/base COLOURS resolve through --lead-col/--base-col so a theme can
    // re-point what "leader" looks like from its own skin without the component
    // knowing (future reserves its cyan for the winner and quiets the rest).
    // Unset ⇒ the shared accent roles, i.e. block renders exactly as before.
    "--col": p.leader ? "var(--lead-col, var(--accent-1))" : "var(--base-col, var(--secondary))",
  }),
  animIn: "fade",
  anim: barAnim,
});
