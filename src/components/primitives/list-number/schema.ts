import { z } from "zod";

/**
 * One row of a list: a numeral chip beside the item's text, with an optional second line under
 * it. The `list` treatment composes it; the caps match the spec's list item (`text` 110,
 * `detail` 160) so nothing the writer was allowed to say is refused on the way to the frame.
 */
export const ListNumberSchema = z.object({
  num: z.string().max(4).describe("Numeral shown in the chip"),
  text: z.string().max(110).describe("The list-item text beside the chip"),
  detail: z
    .string()
    .max(160)
    .optional()
    .describe("Optional second line under the text — a qualifier, a consequence, an example"),
});
export type ListNumberParams = z.infer<typeof ListNumberSchema>;
