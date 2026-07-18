import { z } from "zod";

export const CoverSchema = z.object({
  headline: z
    .string()
    .max(80)
    .describe("The dominant title line — big, uppercase"),
  subtitle: z
    .string()
    .max(140)
    .optional()
    .describe("Supporting line under the headline; optional"),
  eyebrow: z
    .string()
    .max(60)
    .optional()
    .describe("Short uppercase kicker in a pill above headline; optional"),
});
export type CoverParams = z.infer<typeof CoverSchema>;
