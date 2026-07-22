import template from "./template.html" with { type: "text" };
import { Row } from "../../primitives/row";
import { treatment } from "../../runtime/treatment";
import { comparisonAnim } from "./anim";
import { ComparisonSchema } from "./schema";

/** A ledger of "them vs us" rows under two column headers, the winning column
 *  picked out in green — the block comparison frame. */
export const Comparison = treatment({
  name: "comparison",
  childComponent: "row",
  schema: ComparisonSchema,
  template,
  ground: "yellow",
  example: { headline: "Why We Win", columns: ["Status Quo", "Our Approach"] },
  fill: (p) => ({ headline: p.headline, "col-a": p.columns[0], "col-b": p.columns[1] }),
  defaultChildren: () => [
    Row({ label: "Speed", a: "Hours", b: "Minutes" }),
    Row({ label: "Cost", a: "$$$", b: "$" }),
    Row({ label: "Risk", a: "High", b: "Managed" }),
    Row({ label: "Setup", a: "Weeks", b: "Same day" }),
  ],
  anim: comparisonAnim,
});
