import { z } from "zod";

export const RankSchema = z.object({
  value: z.number().describe("This row's figure — the fill grows proportional to max"),
  label: z.string().max(48).describe("Short mono caption naming the ranked item"),
  max: z.number().positive().describe("Scale maximum — the value that fills the track fully (100%)"),
  unit: z.string().max(12).optional().describe('Trailing unit appended to the value, e.g. "%", "ms", "k"'),
  leader: z.boolean().default(false).describe("Top-ranked row — fills yellow instead of the default blue"),
});
export type RankParams = z.infer<typeof RankSchema>;
