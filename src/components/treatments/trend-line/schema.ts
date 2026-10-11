import { z } from "zod";

export const TrendLineSchema = z.object({
  headline: z.string().max(80).describe("The chart's title line"),
  /**
   * THE X-AXIS, held once by the graph. Every series drawn on it reads these categories in
   * order, so a plot child carries values alone (plot/schema.ts) and the treatment draws the
   * label row itself. While each plot carried its own copy the overlay drew the first and the
   * author typed the same list once per line.
   */
  labels: z
    .array(z.string().min(1).max(28))
    .min(2)
    .max(8)
    .describe("Category label per point, in order — the x-axis every series on the graph shares"),
  caption: z.string().max(140).optional().describe("Optional footnote under the plot"),
});
export type TrendLineParams = z.infer<typeof TrendLineSchema>;
