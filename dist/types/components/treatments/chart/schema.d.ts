import { z } from "zod";
export declare const ChartSchema: z.ZodObject<{
    headline: z.ZodString;
    caption: z.ZodOptional<z.ZodString>;
    unit: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ChartParams = z.infer<typeof ChartSchema>;
