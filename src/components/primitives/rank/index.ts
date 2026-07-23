import template from "./template.html" with { type: "text" };
import { component } from "../../runtime/component";
import { rankAnim } from "./anim";
import { RankSchema } from "./schema";

/** A neobrutalist ranked row: a mono label, a bordered white track whose pastel fill
 *  grows out from the left, and a count-up value. The leader takes --accent-1, the rest --secondary. */
export const Rank = component({
  name: "rank",
  schema: RankSchema,
  template,
  example: { value: 83, label: "Acme", max: 100, unitSuffix: "%" },
  fill: (p) => ({
    "bar-label": p.label,
    "bar-value": `${p.unitPrefix ?? ""}0${p.unitSuffix ?? ""}`,
  }),
  layout: (p) => ({
    // Fill = value/max, clamped to 0–100% (value ≥ max = full track). No minimum floor,
    // so small values register; no negative or over-100 overflow.
    "--fill": `${Math.min(100, Math.max(0, (p.value / p.max) * 100)).toFixed(1)}%`,
    "--col": p.leader ? "var(--accent-1)" : "var(--secondary)",
  }),
  animIn: "fade",
  anim: rankAnim,
});
