import { z } from "zod";

export const StatGridSchema = z.object({
  headline: z.string().max(80).describe("The grid's title line (kind: stats)"),
});
export type StatGridParams = z.infer<typeof StatGridSchema>;
