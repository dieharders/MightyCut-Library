import { z } from "zod";

export const StatsSchema = z.object({
  headline: z.string().max(80).describe("The grid's title line"),
});
export type StatsParams = z.infer<typeof StatsSchema>;
