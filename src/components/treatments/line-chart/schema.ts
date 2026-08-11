import { z } from "zod";

export const LineChartSchema = z.object({
  headline: z.string().max(80).describe("The chart's title line"),
  caption: z.string().max(140).optional().describe("Optional footnote under the plot"),
});
export type LineChartParams = z.infer<typeof LineChartSchema>;
