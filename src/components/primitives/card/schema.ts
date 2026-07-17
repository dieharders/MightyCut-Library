import { z } from "zod";

export const ACCENTS = ["pink", "blue", "green", "yellow"] as const;

export const CardSchema = z.object({
  title: z.string().max(120).describe("The card's headline, shown uppercase"),
  body: z.string().max(160).optional().describe("Supporting sentence under the title"),
  icon: z.string().max(6).describe('Glyph in the accent square — a Roman numeral or short text mark, e.g. "I"'),
  accent: z.enum(ACCENTS).default("pink").describe("Accent color token for the icon square background"),
});
export type CardParams = z.infer<typeof CardSchema>;
