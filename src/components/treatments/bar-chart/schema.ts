import { z } from "zod";

export const BarChartSchema = z.object({
  headline: z.string().max(80).describe("The chart's title line"),
  caption: z.string().max(140).optional().describe("Optional footnote shown under the bars"),
});
export type BarChartParams = z.infer<typeof BarChartSchema>;
