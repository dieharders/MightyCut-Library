import { z } from "zod";
export declare const CoverSchema: z.ZodObject<{
    headline: z.ZodString;
    subtitle: z.ZodOptional<z.ZodString>;
    eyebrow: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CoverParams = z.infer<typeof CoverSchema>;
