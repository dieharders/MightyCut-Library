import template from "./template.html" with { type: "text" };
import { component } from "../../runtime/component";
import { ListNumberSchema } from "./schema";

/** A numbered list row — the block index bullet: a square yellow ink-bordered
 *  numeral chip beside its label text. */
export const ListNumber = component({
  name: "list-number",
  schema: ListNumberSchema,
  template,
  example: { num: "01", text: "Numbered list bullet" },
  fill: (p) => ({ num: p.num, text: p.text }),
  animIn: "rise",
  animInOpts: { dist: 18 },
});
