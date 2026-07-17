import { z } from "zod";
import { ICON_NAMES } from "../../icons";

export const IconSchema = z.object({
  name: z.enum(ICON_NAMES).default("shield").describe("Which icon from the shared 21-icon set"),
  accent: z
    .enum(["pink", "blue", "green", "yellow", "black"])
    .default("black")
    .describe("Stroke color token"),
  size: z.number().positive().max(40).default(10).describe("Icon size in cqw (percent of frame width)"),
});
export type IconParams = z.infer<typeof IconSchema>;
