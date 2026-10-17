import { z } from "zod";

export const CtaSchema = z.object({
  // 120, matching the spec's outro `cta`: the closing plate composes this component for its
  // call to action, and the plate's own measure (every theme's outro.css caps `.cardf`) is
  // what holds a long label to the line — a 40-character cap here would refuse copy the spec
  // had already accepted.
  text: z.string().max(120).default("Click Here").describe("Button label"),
  arrow: z.boolean().default(true).describe("Show the trailing arrow"),
});
export type CtaParams = z.infer<typeof CtaSchema>;
