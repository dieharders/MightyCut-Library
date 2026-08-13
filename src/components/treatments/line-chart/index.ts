import template from "./template.html" with { type: "text" };
import { Plot } from "../../primitives/plot";
import { treatment } from "../../runtime/treatment";
import { lineChartAnim } from "./anim";
import { LineChartSchema } from "./schema";

/**
 * A line chart — `chart`'s sibling over the same spec data (`chart.series`), for the case
 * `chart` structurally cannot draw: `chart.type === "line"`.
 *
 * ONE child, not one per point, because a polyline connects its points — see plot/schema.ts.
 * That also makes this the only child-bearing treatment whose cascade has a single child slot,
 * which is what its caption has to work around: one beat is not long enough for the plot to
 * draw, and there is no second child slot to hide behind, so the caption buys the delay with an
 * offset instead of a slot (see anim.ts).
 */
export const LineChart = treatment({
  name: "line-chart",
  childComponent: "plot",
  schema: LineChartSchema,
  template,
  // chart's and bar-ranking's ground: the three are the same device seen three ways, and in the
  // two themes that keep per-treatment grounds they should land on the same plane.
  ground: "muted-1",
  example: { headline: "Losses fall quarter over quarter", caption: "Incidents per 1,000 sessions" },
  fill: (p) => ({ headline: p.headline, caption: p.caption ?? null }),
  defaultChildren: () => [
    Plot({ labels: ["Q1", "Q2", "Q3", "Q4"], values: [18, 34, 29, 61], max: 61 }),
  ],
  anim: lineChartAnim,
});
