import { z } from "zod";

export const ACCENTS = ["pink", "blue", "green", "yellow"] as const;

export const StatSchema = z.object({
  value: z.number().describe("The figure to count up to"),
  label: z.string().max(48).describe("Short caption under the number"),
  unitPrefix: z
    .string()
    .max(6)
    .optional()
    .describe('Leading unit prepended to the value, e.g. "$", "€"'),
  unitSuffix: z
    .string()
    .max(10)
    .optional()
    .describe('Trailing unit appended to the value, e.g. "%", "x", "hrs"'),
  decimals: z
    .number()
    .int()
    .min(0)
    .max(2)
    .default(0)
    .describe("Decimal places shown while counting"),
  accent: z
    .enum(ACCENTS)
    .default("pink")
    .describe("Accent color for corner dot"),
});
export type StatParams = z.infer<typeof StatSchema>;
