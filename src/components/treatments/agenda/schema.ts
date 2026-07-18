import { z } from "zod";

export const AgendaSchema = z.object({
  headline: z.string().max(80).describe("The agenda's title line"),
});
export type AgendaParams = z.infer<typeof AgendaSchema>;
