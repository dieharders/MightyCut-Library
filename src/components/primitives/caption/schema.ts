import { z } from "zod";
// Shared palette roles — see stat/schema.ts.
import { PALETTE_VARS } from "../../../types/palette";

export const CaptionSchema = z.object({
  text: z.string().max(160).describe("Caption / VO-transcript line rendered in the pill"),
  accentBar: z
    .enum(PALETTE_VARS)
    .default("primary")
    .describe("Palette role for the left accent bar"),
});
export type CaptionParams = z.infer<typeof CaptionSchema>;
