import template from "./template.html" with { type: "text" };
import { Bar } from "../../primitives/bar";
import { treatment } from "../../runtime/treatment";
import { chartAnim } from "./anim";
import { ChartSchema } from "./schema";

/** A vertical bar chart on a cream ground — bordered pastel columns that grow from
 *  a baseline while their values count up; the last column leads in yellow. */
export const Chart = treatment({
  name: "chart",
  childComponent: "bar",
  schema: ChartSchema,
  template,
  ground: "cream",
  example: { headline: "Revenue by quarter", caption: "Net new revenue" },
  defaultChildren: () => {
    const series = [
      { value: 42, label: "Q1" },
      { value: 68, label: "Q2" },
      { value: 79, label: "Q3" },
      { value: 96, label: "Q4" },
    ];
    const max = Math.max(...series.map((s) => s.value));
    return series.map((s, i) =>
      Bar({
        value: s.value,
        label: s.label,
        max,
        unitPrefix: "$",
        unitSuffix: "M",
        leader: i === series.length - 1,
      }),
    );
  },
  fill: (p) => ({ headline: p.headline, caption: p.caption }),
  anim: chartAnim,
});
