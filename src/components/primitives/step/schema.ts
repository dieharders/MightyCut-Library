import { z } from "zod";

export const StepSchema = z.object({
  num: z.string().max(4).describe('Step index chip, e.g. "01"'),
  title: z.string().max(40).describe("Short step title (uppercased in the frame)"),
  body: z.string().max(120).optional().describe("Optional one-line description of the step"),
});
export type StepParams = z.infer<typeof StepSchema>;
