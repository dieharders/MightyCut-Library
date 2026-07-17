import { z } from "zod";
export declare const FeatureCardsSchema: z.ZodObject<{
    headline: z.ZodString;
}, z.core.$strip>;
export type FeatureCardsParams = z.infer<typeof FeatureCardsSchema>;
