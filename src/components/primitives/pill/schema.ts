import { z } from "zod";

export const PillSchema = z.object({
  text: z.string().max(40).describe("Label text"),
  variant: z
    .enum(["pink", "blue", "green", "yellow", "cream", "white"])
    .default("white")
    .describe("Pastel background color token"),
});
export type PillParams = z.infer<typeof PillSchema>;
