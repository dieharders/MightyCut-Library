import { z } from "zod";
// Shared palette roles — see stat/schema.ts. `ACCENTS` used to be duplicated in both
// files; PALETTE_VARS is now the single export.
import { PALETTE_VARS } from "../../../types/palette";

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
    .enum(PALETTE_VARS)
    .optional()
    .describe("Palette role filling the square icon (unset ⇒ the theme's default)"),
});
export type CardParams = z.infer<typeof CardSchema>;
