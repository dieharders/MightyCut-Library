import type { AnimDescriptor } from "../../runtime/anim";
import type { LineChartParams } from "./schema";

/**
 * The headline rises in on the first VO line; the plot draws itself in the next slot (the
 * treatment gives its single child one), and the caption follows.
 *
 * The caption keys to `index 2` rather than `line n≥1`. A `line n≥1` own-anim is remapped to
 * the CAPTION SLOT (`childBase + children.length`), which is correct for a treatment whose
 * children are read one after another — but this one has exactly ONE child that takes over a
 * second to draw, so the caption would land right on top of the wipe finishing. `index 2` is
 * the third beat, which is what "after the plot" means here.
 */
export const lineChartAnim = (p: LineChartParams): AnimDescriptor[] => [
  { kind: "riseIn", target: "headline", time: { at: "line", n: 0, plus: 0.1 }, opts: { dist: 30 } },
  ...(p.caption
    ? [
        {
          kind: "riseIn" as const,
          target: "caption",
          time: { at: "index" as const, n: 2, plus: 0.2 },
          opts: { dist: 18 },
        },
      ]
    : []),
];
