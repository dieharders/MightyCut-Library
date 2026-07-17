import { z } from "zod";

export const CtaSchema = z.object({
  text: z.string().max(40).default("Click Here").describe("Button label (rendered uppercase)"),
  arrow: z.boolean().default(true).describe("Show the trailing → arrow"),
});
export type CtaParams = z.infer<typeof CtaSchema>;
