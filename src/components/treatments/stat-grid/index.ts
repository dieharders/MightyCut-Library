import template from "./template.html" with { type: "text" };
import { Stat } from "../../primitives/stat";
import { treatment } from "../../runtime/treatment";
import { ACCENT_CYCLE } from "../../../types/palette";
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
  // Dots take the shared ACCENT_CYCLE in order, so the roles a repeated-accent list walks
  // are stated once (types/palette.ts) rather than re-picked per treatment.
  defaultChildren: () =>
    [
      { value: 92, label: "Detection rate", unitSuffix: "%" },
      { value: 3, label: "Faster triage", unitSuffix: "x" },
      { value: 40, label: "Cost reduction", unitSuffix: "%" },
    ].map((p, i) => Stat({ ...p, accent: ACCENT_CYCLE[i % ACCENT_CYCLE.length]! })),
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
