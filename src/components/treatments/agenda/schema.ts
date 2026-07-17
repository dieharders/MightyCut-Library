import { z } from "zod";

export const AgendaSchema = z.object({
  headline: z.string().max(80).describe("The agenda's title line (kind: steps → agenda skin)"),
});
export type AgendaParams = z.infer<typeof AgendaSchema>;
