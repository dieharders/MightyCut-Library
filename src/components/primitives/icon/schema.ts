import { z } from "zod";
import { ICON_NAMES } from "../../icons";

export const IconSchema = z.object({
  name: z.enum(ICON_NAMES).default("shield").describe("Icon alias"),
  accent: z
    .enum(["pink", "blue", "green", "yellow", "black"])
    .default("black")
    .describe("Stroke color token"),
  size: z
    .number()
    .positive()
    .max(40)
    .default(10)
    .describe("Icon size as a percent of the 1920 design width (10 = 10%, emitted as rem)"),
});
export type IconParams = z.infer<typeof IconSchema>;
