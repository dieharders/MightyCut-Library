import { z } from "zod";
// The accent vocabulary is the SHARED palette roles — one export for every param
// that takes a palette colour (stat, card, pill, icon, both decoration engines), so
// they can never drift apart. The theme decides which colour each role holds; the UI
// de-dupes the roles down to the theme's unique colours. See types/palette.ts.
import { PALETTE_VARS } from "../../../types/palette";

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
    .enum(PALETTE_VARS)
    .optional()
    .describe("Palette role for the corner dot (unset ⇒ the theme's default)"),
});
export type StatParams = z.infer<typeof StatSchema>;
