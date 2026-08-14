import { z } from "zod";

export const ListSchema = z.object({
  headline: z.string().max(80).describe("The list's title line"),
});
export type ListParams = z.infer<typeof ListSchema>;
