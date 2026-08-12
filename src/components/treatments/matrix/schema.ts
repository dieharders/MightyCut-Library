import { z } from "zod";

export const MatrixSchema = z.object({
  headline: z.string().max(80).describe("The slide's title line"),
  criteria: z
    .array(z.string().max(22))
    .min(2)
    .max(5)
    .default(["Fast", "Auditable", "Self-serve"])
    .describe(
      "The capability columns, terse — each row answers these in order, left to right",
    ),
  caption: z.string().max(140).optional().describe("Optional footnote under the table"),
});
export type MatrixParams = z.infer<typeof MatrixSchema>;
