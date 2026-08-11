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
    max: z.number().describe("Top of the scale — normally the series maximum"),
    min: z.number().default(0).describe("Bottom of the scale (default 0)"),
    unitPrefix: z.string().max(6).optional().describe('Leading unit, e.g. "$"'),
    unitSuffix: z.string().max(12).optional().describe('Trailing unit, e.g. "%"'),
    decimals: z
      .number()
      .int()
      .min(0)
      .max(2)
      .default(0)
      .describe("Decimal places on every value — REQUIRED when any value is fractional"),
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
  });
export type PlotParams = z.infer<typeof PlotSchema>;
