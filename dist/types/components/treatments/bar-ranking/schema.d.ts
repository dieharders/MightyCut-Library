import { z } from "zod";
export declare const BarRankingSchema: z.ZodObject<{
    headline: z.ZodString;
    caption: z.ZodOptional<z.ZodString>;
    unit: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type BarRankingParams = z.infer<typeof BarRankingSchema>;
