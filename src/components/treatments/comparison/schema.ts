import { z } from "zod";

export const ComparisonSchema = z.object({
  headline: z.string().max(80).describe("The slide's title line (kind: comparison)"),
  columns: z
    .tuple([
      z.string().max(36).describe('Header for the "them" column (the status quo)'),
      z.string().max(36).describe('Header for the "us" column (the highlighted approach)'),
    ])
    .default(["Them", "Us"])
    .describe("The two comparison column headers, ordered [them, us]"),
});
export type ComparisonParams = z.infer<typeof ComparisonSchema>;
