import { z } from "zod";

export const BarSchema = z.object({
  value: z.number().min(0).describe("The column's numeric value (counts up from 0)"),
  label: z.string().max(28).describe("Short caption under the column"),
  max: z
    .number()
    .positive()
    .describe("The chart's maximum value — sets the height"),
  unitPrefix: z
    .string()
    .max(6)
    .optional()
    .describe('Leading unit prepended to the value, e.g. "$", "€"'),
  unitSuffix: z
    .string()
    .max(12)
    .optional()
    .describe('Trailing unit appended to the value, e.g. "%", "k"'),
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
    .describe("Highlight column in accent color instead of the default"),
});
export type BarParams = z.infer<typeof BarSchema>;
