import { z } from "zod";

export const ClosingPlateSchema = z.object({
  headline: z.string().max(80).describe("The closing statement — a short, punchy sign-off"),
  cta: z
    .string()
    .max(120)
    .optional()
    .describe('Optional call-to-action chip below the headline, e.g. "Get started"'),
});
export type ClosingPlateParams = z.infer<typeof ClosingPlateSchema>;
