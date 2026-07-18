import { z } from "zod";

export const ListNumberSchema = z.object({
  num: z.string().max(4).describe("Numeral shown in the chip"),
  text: z
    .string()
    .max(80)
    .describe("The list-item text beside the numeral chip"),
});
export type ListNumberParams = z.infer<typeof ListNumberSchema>;
