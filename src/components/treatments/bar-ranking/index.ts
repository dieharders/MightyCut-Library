import template from "./template.html" with { type: "text" };
import { Rank } from "../../primitives/rank";
import { treatment } from "../../runtime/treatment";
import { barRankingAnim } from "./anim";
import { BarRankingSchema } from "./schema";

/** A horizontal ranked chart — a stack of Rank rows whose pastel fills grow
 *  left-to-right; the top row leads in yellow. */
export const BarRanking = treatment({
  name: "bar-ranking",
  childComponent: "rank",
  schema: BarRankingSchema,
  template,
  ground: "muted-1",
  example: {
    headline: "Market share by vendor",
    caption: "Share of new installs, 2026",
  },
  fill: (p) => ({ headline: p.headline, caption: p.caption }),
  defaultChildren: () => {
    const rows = [
      { label: "Acme", value: 38 },
      { label: "Globex", value: 27 },
      { label: "Initech", value: 19 },
      { label: "Umbrella", value: 11 },
    ];
    const max = Math.max(...rows.map((r) => r.value));
    return rows.map((r, i) =>
      Rank({ value: r.value, label: r.label, max, unitSuffix: "%", leader: i === 0 }),
    );
  },
  anim: barRankingAnim,
});
