import { z } from "zod";

export const TeamSchema = z.object({
  headline: z.string().max(80).describe("The slide's title line"),
  caption: z.string().max(140).optional().describe("Optional footnote under the roster"),
});
export type TeamParams = z.infer<typeof TeamSchema>;
