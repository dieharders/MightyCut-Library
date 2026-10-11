import { z } from "zod";

/**
 * The closing plate's own slots. The call to action is NOT one of them any more: it is the
 * `cta` COMPONENT, composed as the plate's one child (`childComponent: "cta"`), so every theme
 * draws the same button here that it draws anywhere else — one skin (cta.css) rather than a
 * second, hand-matched `.closing-plate .cta` recipe per theme that was free to drift from it.
 */
export const OutroSchema = z.object({
  headline: z.string().max(80).describe("The closing statement — a short, punchy sign-off"),
  contact: z
    .string()
    .max(120)
    .optional()
    .describe('Optional contact line below the call to action, e.g. "hello@acme.com | acme.com"'),
});
export type OutroParams = z.infer<typeof OutroSchema>;
