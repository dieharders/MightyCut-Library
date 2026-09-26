import { z } from "zod";

export const OutroSchema = z.object({
  headline: z.string().max(80).describe("The closing statement — a short, punchy sign-off"),
  cta: z
    .string()
    .max(120)
    .optional()
    .describe('Optional call-to-action chip below the headline, e.g. "Get started"'),
  contact: z
    .string()
    .max(120)
    .optional()
    .describe('Optional contact line below the call to action, e.g. "hello@acme.com | acme.com"'),
});
export type OutroParams = z.infer<typeof OutroSchema>;
