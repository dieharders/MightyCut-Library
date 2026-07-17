import { z } from "zod";

export const ChartSchema = z.object({
  headline: z.string().max(80).describe("The chart's title line (kind: chart)"),
  caption: z.string().max(140).optional().describe("Optional footnote shown under the bars"),
  unit: z.string().max(12).optional().describe('Unit appended to every bar value, e.g. "%", "k"'),
});
export type ChartParams = z.infer<typeof ChartSchema>;
