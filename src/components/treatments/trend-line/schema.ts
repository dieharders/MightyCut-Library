import { z } from "zod";

export const TrendLineSchema = z.object({
  headline: z.string().max(80).describe("The chart's title line"),
  caption: z.string().max(140).optional().describe("Optional footnote under the plot"),
});
export type TrendLineParams = z.infer<typeof TrendLineSchema>;
