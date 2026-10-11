import template from "./template.html" with { type: "text" };
import { component } from "../../runtime/component";
import { ListNumberSchema } from "./schema";

/** A list row: a numeral chip beside its text, with an optional detail line under the text —
 *  the `list` treatment's child, one per claim. The detail is pruned when absent, so a one-line
 *  item leaves no empty line behind. */
export const ListNumber = component({
  name: "list-number",
  schema: ListNumberSchema,
  template,
  example: { num: "01", text: "Numbered list bullet", detail: "A second line under it" },
  fill: (p) => ({ num: p.num, text: p.text, detail: p.detail ?? null }),
  animIn: "rise",
  animInOpts: { dist: 18 },
});
