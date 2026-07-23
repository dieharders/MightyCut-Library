import { z } from "zod";
import { ICON_NAMES } from "../../icons";
// Shared palette roles — see stat/schema.ts.
import { PALETTE_VARS } from "../../../types/palette";

export const IconSchema = z.object({
  name: z.enum(ICON_NAMES).default("shield").describe("Icon alias"),
  accent: z
    .enum(PALETTE_VARS)
    .optional()
    .describe("Palette role for the stroke colour (unset ⇒ the theme's default)"),
  size: z
    .number()
    .positive()
    .max(40)
    .default(10)
    .describe("Icon size as a percent of the 1920 design width (10 = 10%, emitted as rem)"),
});
export type IconParams = z.infer<typeof IconSchema>;
