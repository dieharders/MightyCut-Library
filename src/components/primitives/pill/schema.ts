import { z } from "zod";
// Shared palette roles — see stat/schema.ts. The field is named `accent` like every
// other palette-role param (stat, card, icon); it was `variant` until the values
// became roles, and a stored deck still naming `variant` loses its colour on read
// (z.object strips unknown keys) rather than throwing — the same read-path break the
// retired colour names took.
import { PALETTE_VARS } from "../../../types/palette";

export const PillSchema = z.object({
  text: z.string().max(40).describe("Label text"),
  accent: z
    .enum(PALETTE_VARS)
    .optional()
    .describe("Palette role for the pill's background (unset ⇒ the theme's default)"),
});
export type PillParams = z.infer<typeof PillSchema>;
