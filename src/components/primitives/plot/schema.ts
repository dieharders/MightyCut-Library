import { z } from "zod";
import { PALETTE_VARS } from "../../../types/palette";
import { addIssue } from "../../../util/issues";

/**
 * A line plot: the WHOLE series in one component, not one component per point.
 *
 * That is the opposite of how `chart` works, and it has to be. A bar is self-contained — its
 * height is a function of its own value — so a chart is N `bar` children. A polyline is not: the
 * path CONNECTS siblings, so no child can draw its own segment without knowing the ones on
 * either side. The series therefore lives here, and a single-line `trend-line` has exactly one
 * child.
 *
 * VALUES ONLY — no category labels. The categories are the x-axis, and the x-axis is the
 * GRAPH's, shared by every series drawn on it: `trend-line` holds the labels once and draws the
 * row itself (its `labels` param, `rawFill`). While each plot carried its own copy, an overlay of
 * three series carried three lists that had to be typed in three times and agree. A plot on its
 * own — the showcase's component preview — is a line against a y-axis, which is exactly what one
 * series is.
 */
export const PlotSchema = z
  .object({
    values: z
      .array(z.number())
      .min(2)
      .max(8)
      .describe("The plotted value per point, in order — one per category on the graph's x-axis"),
    max: z.number().describe("Top of the scale — at least every value, normally the series maximum"),
    min: z.number().default(0).describe("Bottom of the scale (default 0) — at most every value"),
    unitPrefix: z.string().max(6).optional().describe('Leading unit, e.g. "$"'),
    unitSuffix: z.string().max(12).optional().describe('Trailing unit, e.g. "%"'),
    decimals: z
      .number()
      .int()
      .min(0)
      .max(2)
      .default(0)
      .describe("Minimum decimal places on every figure — a value that would round away gets more"),
    accent: z
      .enum(PALETTE_VARS)
      .optional()
      .describe("Palette role for the line and its points (unset ⇒ the theme's default)"),
    /**
     * WHAT THIS LINE IS — the only thing a series can say about itself that its geometry cannot.
     *
     * A lone plot has no use for it: it is the chart, the headline names it, and drawing a
     * one-entry key would be a label pointing at the only thing on screen. It exists for the
     * OVERLAY, where the treatment turns the point figures off (trend-line/index.ts, `layout`)
     * and colour becomes the only difference between the lines — a key with nothing to key is
     * N coloured lines and no way to tell which is which.
     *
     * Optional, and the key falls back to "Series 1", "Series 2" when it is unset, because an
     * unnamed overlay is still better served by a swatch that ties a colour to a position than
     * by no key at all — but the fallback names nothing, and a second series is worth naming.
     */
    series: z
      .string()
      .min(1)
      .max(28)
      .optional()
      .describe("This line's name, shown in the key when several series share one graph"),
  })
  .check((ctx) => {
    const p = ctx.value;
    // AN INVERTED SCALE IS NOT A SCALE. `max < min` renders a y-axis whose numbers increase
    // downward, with no warning and nothing visibly wrong. Equal is allowed: a genuinely flat
    // series is a real thing to plot, and the component draws it as a single labelled line
    // (plot/index.ts, gridTs) rather than as three lines all claiming the same value.
    if (p.max < p.min) {
      addIssue(ctx, ["max"], `max (${p.max}) is below min (${p.min}) — the scale would run backwards`, p.max);
    }
    // THE SCALE HAS TO CONTAIN THE SERIES. It did not have to before, because the geometry
    // CLAMPED a stray value onto the top or bottom gridline — invisible while the plot had no
    // axis, and a contradiction the moment the lines were labelled: a point printing "200" sat
    // exactly on the line printing "100", and every value past the scale rendered in the same
    // place. Refusing it here is an authoring error the deck can fix; clamping was a drawing
    // error it could not see.
    const outside = p.values.filter((v) => v > p.max || v < p.min);
    if (p.max >= p.min && outside.length > 0) {
      addIssue(
        ctx,
        ["values"],
        `${outside.join(", ")} ${outside.length > 1 ? "are" : "is"} outside the scale ${p.min}…${p.max} — widen max/min or the point cannot be drawn where its label says`,
        p.values,
      );
    }
  });
export type PlotParams = z.infer<typeof PlotSchema>;
