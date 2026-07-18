import { z } from "zod";

export const BarSchema = z.object({
  value: z.number().describe("The column's numeric value (counts up from 0)"),
  label: z.string().max(28).describe("Short caption under the column"),
  max: z
    .number()
    .positive()
    .describe("The chart's maximum value — sets the height"),
  unit: z
    .string()
    .max(12)
    .optional()
    .describe('Trailing unit appended to the value, e.g. "%", "k"'),
  leader: z
    .boolean()
    .default(false)
    .describe("Highlight column in accent color instead of the default"),
});
export type BarParams = z.infer<typeof BarSchema>;
