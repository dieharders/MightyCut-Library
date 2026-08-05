import { z } from "zod";

export const RankSchema = z.object({
  value: z.number().min(0).describe("This row's value"),
  label: z
    .string()
    .max(48)
    .describe("Short mono caption naming the ranked item"),
  max: z.number().positive().describe("Scale's maximum value"),
  unitPrefix: z
    .string()
    .max(6)
    .optional()
    .describe('Leading unit prepended to the value, e.g. "$", "€"'),
  unitSuffix: z
    .string()
    .max(12)
    .optional()
    .describe('Trailing unit appended to the value, e.g. "%", "ms", "k"'),
  decimals: z
    .number()
    .int()
    .min(0)
    .max(2)
    .default(0)
    .describe("Decimal places shown while counting — 1.2 needs one, or it reads as 1"),
  leader: z
    .boolean()
    .default(false)
    .describe("Top-ranked row — fills accent color instead of default"),
});
export type RankParams = z.infer<typeof RankSchema>;
