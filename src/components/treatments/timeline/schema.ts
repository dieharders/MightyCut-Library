import { z } from "zod";

export const TimelineSchema = z.object({
  headline: z.string().max(80).describe("The timeline's title line"),
});
export type TimelineParams = z.infer<typeof TimelineSchema>;
