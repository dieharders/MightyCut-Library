import template from "./template.html" with { type: "text" };
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
  ground: "accent-2",
  example: { headline: "Numbers that moved" },
  fill: (p) => ({ headline: p.headline }),
  defaultChildren: () => [
    Stat({ value: 92, label: "Detection rate", unitSuffix: "%", accent: "primary" }),
    Stat({ value: 3, label: "Faster triage", unitSuffix: "x", accent: "secondary" }),
    Stat({ value: 40, label: "Cost reduction", unitSuffix: "%", accent: "accent-1" }),
  ],
  // 4+ stats crowd a row, so the grid emits two density vars — theme-agnostic policy
  // stated ONCE here rather than as an absolute font-size per theme:
  //   --dense        a boolean hook ([style*="--dense"]) for look changes a ratio can't
  //                  express (tighter gap, smaller padding); optional for a theme.
  //   --dense-scale  the figure shrink ratio, multiplied into the theme's own base size
  //                  (`font-size: calc(<base> * var(--dense-scale, 1))` in <theme>/stat.css),
  //                  so each theme keeps its own scale and states one number, not two.
  layout: (n) => ({ "--cols": String(Math.min(n, 4)), ...(n > 3 ? { "--dense": "1", "--dense-scale": "0.75" } : {}) }),
  anim: statGridAnim,
});
