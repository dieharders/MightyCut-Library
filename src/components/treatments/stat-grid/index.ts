import template from "./template.html" with { type: "text" };
import css from "./stat-grid.css" with { type: "text" };
import { Stat } from "../../primitives/stat";
import { treatment } from "../../runtime/treatment";
import { statGridAnim } from "./anim";
import { StatGridSchema } from "./schema";

/** Headline figures that count up — a responsive grid of Stat cards. */
export const StatGrid = treatment({
  name: "stat-grid",
  childComponent: "stat",
  schema: StatGridSchema,
  template,
  css,
  ground: "green",
  example: { headline: "Numbers that moved" },
  fill: (p) => ({ headline: p.headline }),
  defaultChildren: () => [
    Stat({ value: 92, label: "Detection rate", suffix: "%", accent: "pink" }),
    Stat({ value: 3, label: "Faster triage", suffix: "x", accent: "blue" }),
    Stat({ value: 40, label: "Cost reduction", suffix: "%", accent: "yellow" }),
  ],
  layout: (n) => ({ "--cols": String(Math.min(n, 4)), ...(n > 3 ? { "--dense": "1" } : {}) }),
  anim: statGridAnim,
});
