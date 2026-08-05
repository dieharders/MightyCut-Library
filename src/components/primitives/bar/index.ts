import template from "./template.html" with { type: "text" };
import { component } from "../../runtime/component";
import { barAnim } from "./anim";
import { BarSchema } from "./schema";
import { seriesReserveCh, zeroValueText } from "../../runtime/value";

/** A neobrutalist vertical chart column: a bordered pastel bar that grows from the
 *  baseline while its value counts up. The leader column takes --accent-1, the rest --secondary. */
export const Bar = component({
  name: "bar",
  schema: BarSchema,
  template,
  example: { value: 42, label: "Q1", max: 100 },
  fill: (p) => ({
    "bar-value": zeroValueText(p),
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
    // Leadership as a 0/1 number so a skin can scale emphasis arithmetically
    // (calc() on a glow spread) — the flag, never the row's DOM position.
    "--lead": p.leader ? "1" : "0",
    // Room the value label needs once it has finished counting, in `ch`. The column
    // floors its own width at max(the theme's column width, --vlen ch) so a long
    // figure widens the COLUMN rather than overhanging its neighbours — and because
    // the reservation is for the final string, the width is fixed from frame 0, which
    // is what the fixed width below was defending against in the first place.
    //
    // Sized off the SERIES MAX, not this column's value: columns share a max, so they all
    // reserve the same width and the plot stays comparable by height alone — see
    // seriesReserveCh. (The container additionally reconciles any divergence.)
    "--vlen": `${seriesReserveCh(p)}`,
  }),
  animIn: "fade",
  anim: barAnim,
});
