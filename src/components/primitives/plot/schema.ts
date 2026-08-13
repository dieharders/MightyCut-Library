import { z } from "zod";
import { PALETTE_VARS } from "../../../types/palette";

/**
 * A line plot: the WHOLE series in one component, not one component per point.
 *
 * That is the opposite of how `chart` works, and it has to be. A bar is self-contained — its
 * height is a function of its own value — so a chart is N `bar` children. A polyline is not: the
 * path CONNECTS siblings, so no child can draw its own segment without knowing the ones on
 * either side. The series therefore lives here, and `line-chart` has exactly one child.
 *
 * PARALLEL ARRAYS, not an array of {label, value} objects, and that is a deliberate concession
 * to the editor rather than a modelling preference. The web UI renders an array param as ONE
 * comma-separated text input and coerces it back to string[] or number[] (`coerceField`,
 * lib/library.ts) — it has no control for an array of objects, so a `series` of pairs would
 * become an unusable text box that rejects whatever was typed into it. Two aligned lists each
 * get a working input. A superRefine keeps them the same length, so the pairing is still
 * enforced; it is just enforced at validation rather than by the shape.
 */
export const PlotSchema = z
  .object({
    labels: z
      .array(z.string().min(1).max(28))
      .min(2)
      .max(8)
      .describe("Category label per point, in order — same length as `values`"),
    values: z
      .array(z.number())
      .min(2)
      .max(8)
      .describe("The plotted value per point, in order — same length as `labels`"),
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
  })
  .superRefine((p, ctx) => {
    if (p.labels.length !== p.values.length) {
      ctx.addIssue({
        code: "custom",
        path: ["values"],
        message: `values has ${p.values.length} entries but labels has ${p.labels.length} — a point needs both`,
      });
    }
    // AN INVERTED SCALE IS NOT A SCALE. `max < min` renders a y-axis whose numbers increase
    // downward, with no warning and nothing visibly wrong. Equal is allowed: a genuinely flat
    // series is a real thing to plot, and the component draws it as a single labelled line
    // (plot/index.ts, gridTs) rather than as three lines all claiming the same value.
    if (p.max < p.min) {
      ctx.addIssue({
        code: "custom",
        path: ["max"],
        message: `max (${p.max}) is below min (${p.min}) — the scale would run backwards`,
      });
    }
    // THE SCALE HAS TO CONTAIN THE SERIES. It did not have to before, because the geometry
    // CLAMPED a stray value onto the top or bottom gridline — invisible while the plot had no
    // axis, and a contradiction the moment the lines were labelled: a point printing "200" sat
    // exactly on the line printing "100", and every value past the scale rendered in the same
    // place. Refusing it here is an authoring error the deck can fix; clamping was a drawing
    // error it could not see.
    const outside = p.values.filter((v) => v > p.max || v < p.min);
    if (p.max >= p.min && outside.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["values"],
        message: `${outside.join(", ")} ${outside.length > 1 ? "are" : "is"} outside the scale ${p.min}…${p.max} — widen max/min or the point cannot be drawn where its label says`,
      });
    }
  });
export type PlotParams = z.infer<typeof PlotSchema>;
