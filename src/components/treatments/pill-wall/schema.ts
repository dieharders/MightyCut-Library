import { z } from "zod";

export const PillWallSchema = z.object({
  headline: z.string().max(80).describe("The slide's title line"),
  caption: z.string().max(140).optional().describe("Optional footnote under the wall"),
});
export type PillWallParams = z.infer<typeof PillWallSchema>;
