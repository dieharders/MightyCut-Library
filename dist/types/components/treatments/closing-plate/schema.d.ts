import { z } from "zod";
export declare const ClosingPlateSchema: z.ZodObject<{
    headline: z.ZodString;
    cta: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ClosingPlateParams = z.infer<typeof ClosingPlateSchema>;
