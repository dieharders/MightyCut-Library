import template from "./template.html" with { type: "text" };
import { component } from "../../runtime/component";
import { rankAnim } from "./anim";
import { RankSchema } from "./schema";
import { seriesReserveCh, zeroValueText } from "../../runtime/value";

/** A neobrutalist ranked row: a mono label, a bordered white track whose pastel fill
 *  grows out from the left, and a count-up value. The leader takes --accent-1, the rest --secondary. */
export const Rank = component({
  name: "rank",
  schema: RankSchema,
  template,
  example: { value: 83, label: "Acme", max: 100, unitSuffix: "%" },
  fill: (p) => ({
    "bar-label": p.label,
    "bar-value": zeroValueText(p),
  }),
  layout: (p) => ({
    // Fill = value/max, clamped to 0–100% (value ≥ max = full track). No minimum floor,
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
    // Room the value label needs once it has finished counting, in `ch`. Every skin
    // floors .bv at max(its own column width, --vlen ch), so a long figure widens the
    // box (the flex:1 track yields) instead of spilling past the canvas edge, and it
    // is sized for the FINAL string from frame 0 so counting never resizes it.
    //
    // Sized off the SERIES MAX, not this row's value: rows share a max, so they all
    // reserve the same box and their tracks end on one vertical line — see
    // seriesReserveCh. (The container additionally reconciles any divergence.)
    "--vlen": `${seriesReserveCh(p)}`,
  }),
  animIn: "fade",
  anim: rankAnim,
});
