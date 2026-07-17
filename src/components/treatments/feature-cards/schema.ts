import { z } from "zod";

export const FeatureCardsSchema = z.object({
  headline: z.string().max(80).describe("The row's title line (kind: cards)"),
});
export type FeatureCardsParams = z.infer<typeof FeatureCardsSchema>;
