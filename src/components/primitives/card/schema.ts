import { z } from "zod";

export const ACCENTS = ["pink", "blue", "green", "yellow"] as const;

export const CardSchema = z.object({
  title: z.string().max(120).describe("The card's headline"),
  body: z
    .string()
    .max(160)
    .optional()
    .describe("Supporting sentence under title"),
  icon: z
    .string()
    .max(6)
    .describe("Glyph in accent square — Roman numeral, text or emoji"),
  accent: z
    .enum(ACCENTS)
    .default("pink")
    .describe("Background accent color for square icon"),
});
export type CardParams = z.infer<typeof CardSchema>;
