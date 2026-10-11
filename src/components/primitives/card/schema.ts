import { z } from "zod";
import { ICON_NAMES } from "../../icons";
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
  /**
   * THE BADGE CARRIES AN ICON, from the shared set the `icon` primitive draws — not typed text.
   * It was a six-character string ("I", "II", an emoji) drawn as type in the accent square,
   * which is what the spec-side `icon` field never was: the writer is told to name an icon
   * ("shield", "database") and six characters refused most of them. An enum of the set is what
   * the editor renders as a picker and what the harness maps a spec card's name onto.
   */
  icon: z.enum(ICON_NAMES).default("sparkles").describe("Icon drawn in the accent square"),
  accent: z
    .enum(PALETTE_VARS)
    .optional()
    .describe("Palette role filling the square icon (unset ⇒ the theme's default)"),
});
export type CardParams = z.infer<typeof CardSchema>;
