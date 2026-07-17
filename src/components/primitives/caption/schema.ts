import { z } from "zod";

export const CaptionSchema = z.object({
  text: z.string().max(160).describe("Caption / VO-transcript line rendered in the pill"),
  accentBar: z
    .enum(["pink", "blue", "green", "yellow"])
    .default("pink")
    .describe("Color token for the left accent bar"),
});
export type CaptionParams = z.infer<typeof CaptionSchema>;
