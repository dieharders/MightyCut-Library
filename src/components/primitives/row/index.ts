import template from "./template.html" with { type: "text" };
import css from "./row.css" with { type: "text" };
import { component } from "../../runtime/component";
import { rowAnim } from "./anim";
import { RowSchema } from "./schema";

/** A neobrutalist ledger row: a label plus a "them"/"us" cell pair, the winning
 *  cell picked out in green. Composed into the Comparison treatment's ledger. */
export const Row = component({
  name: "row",
  schema: RowSchema,
  template,
  css,
  example: { label: "Speed", a: "Hours", b: "Minutes" },
  fill: (p) => ({ "row-label": p.label, "cell-a": p.a, "cell-b": p.b }),
  anim: rowAnim,
});
