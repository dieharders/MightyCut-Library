import { z } from "zod";

export const BarRankingSchema = z.object({
  headline: z.string().max(80).describe("The ranking's title line"),
  caption: z
    .string()
    .max(140)
    .optional()
    .describe("Optional footnote under the bars (source or scale note)"),
});
export type BarRankingParams = z.infer<typeof BarRankingSchema>;
