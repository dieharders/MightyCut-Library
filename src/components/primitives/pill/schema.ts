import { z } from "zod";
// Shared palette roles — see stat/schema.ts. (The field stays named `variant` for
// schema compatibility with stored decks; its VALUES are palette roles.)
import { PALETTE_VARS } from "../../../types/palette";

export const PillSchema = z.object({
  text: z.string().max(40).describe("Label text"),
  variant: z
    .enum(PALETTE_VARS)
    .optional()
    .describe("Palette role for the pill's background (unset ⇒ the theme's default)"),
});
export type PillParams = z.infer<typeof PillSchema>;
