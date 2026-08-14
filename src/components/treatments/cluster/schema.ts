import { z } from "zod";

export const ClusterSchema = z.object({
  headline: z.string().max(80).describe("The slide's title line"),
  hub: z.string().max(28).default("Platform").describe("The centre everything connects to"),
  caption: z.string().max(140).optional().describe("Optional footnote under the diagram"),
});
export type ClusterParams = z.infer<typeof ClusterSchema>;
