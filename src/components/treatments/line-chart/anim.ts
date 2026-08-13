import type { AnimDescriptor } from "../../runtime/anim";
import { PLOT_DRAW_SEC } from "../../primitives/plot/anim";
import type { LineChartParams } from "./schema";

/**
 * The default gap between cascade slots (`TreatmentDef.revealDelay`'s own default, mirrored by
 * `slotDefault` in mc.js). Stated here because the caption's offset below is measured against
 * it: the runtime TIGHTENS this gap on a narrated or a short scene and never widens it, so this
 * is the case the offset has to clear.
 */
const SLOT_SEC = 0.6;

/**
 * How long the caption waits past the head of its own slot, so it lands as the chart finishes
 * drawing rather than in the middle of the wipe.
 *
 * THE PREVIOUS ATTEMPT WAS A PROVABLE NO-OP, which is why this is a number and not a slot
 * choice. The caption keyed to `index 2` "rather than `line n≥1`" to avoid the caption slot —
 * and the two resolve to the SAME slot here: `captionSlot` is `childBase + children.length` =
 * `titleSlot + titleOffset + 2` with one child and no `leadIn` own-anim, and the `index` branch
 * is `titleSlot + titleOffset + n` = the same expression at `n = 2` (runtime/treatment.ts).
 * `toSlot` keeps `plus` for both, so the descriptor was byte-identical to the plain caption form
 * and the caption fired squarely inside the wipe — exactly what the comment claimed to have
 * designed around. There is no slot to move to; the plot's single child owns the only beat
 * between the title and the caption, and the wipe is longer than a beat.
 *
 * So the caption keys like every other treatment's and BUYS the delay instead: one slot has
 * already passed when it fires, so it needs the rest of the draw. On a scene tight enough for
 * the runtime to tighten the cascade the caption arrives before the wipe settles — that is the
 * fit pass doing its job (mc.js), and the same compromise every other element on a short scene
 * makes.
 */
const CAPTION_PLUS = Math.round((PLOT_DRAW_SEC - SLOT_SEC) * 100) / 100;

/**
 * The headline rises in on the first VO line; the plot draws itself in the next slot (the
 * treatment gives its single child one), and the caption follows it.
 */
export const lineChartAnim = (p: LineChartParams): AnimDescriptor[] => [
  { kind: "riseIn", target: "headline", time: { at: "line", n: 0, plus: 0.1 }, opts: { dist: 30 } },
  ...(p.caption
    ? [
        {
          kind: "riseIn" as const,
          target: "caption",
          time: { at: "line" as const, n: 1, plus: CAPTION_PLUS },
          opts: { dist: 18 },
        },
      ]
    : []),
];
