import { z } from "zod";

export const QuoteSchema = z.object({
  text: z.string().max(200).describe("The pull-quote body (kind: quote)"),
  attribution: z.string().max(80).optional().describe("Who said it — name, role, or source"),
  eyebrow: z.string().max(40).optional().describe("Small pill label above the quote card"),
});
export type QuoteParams = z.infer<typeof QuoteSchema>;
