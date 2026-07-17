import { z } from "zod";

export const AgendaItemSchema = z.object({
  num: z.string().max(4).describe('The row index numeral, e.g. "01"'),
  title: z.string().max(48).describe("The agenda entry title (uppercased by the type)"),
  detail: z.string().max(100).optional().describe("Optional right-aligned meta, e.g. a duration or tag"),
});
export type AgendaItemParams = z.infer<typeof AgendaItemSchema>;
