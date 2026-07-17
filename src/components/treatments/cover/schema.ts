import { z } from "zod";

export const CoverSchema = z.object({
  headline: z.string().max(80).describe("The dominant title line — big, uppercase (kind: title)"),
  subtitle: z.string().max(140).optional().describe("Supporting line under the headline; omit to drop it"),
  eyebrow: z.string().max(60).optional().describe("Short uppercase kicker in the pill above the headline; omit to drop it"),
});
export type CoverParams = z.infer<typeof CoverSchema>;
