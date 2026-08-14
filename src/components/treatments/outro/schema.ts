import { z } from "zod";

export const OutroSchema = z.object({
  headline: z.string().max(80).describe("The closing statement — a short, punchy sign-off"),
  cta: z
    .string()
    .max(120)
    .optional()
    .describe('Optional call-to-action chip below the headline, e.g. "Get started"'),
});
export type OutroParams = z.infer<typeof OutroSchema>;
