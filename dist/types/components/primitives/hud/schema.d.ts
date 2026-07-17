import { z } from "zod";
export declare const HudSchema: z.ZodObject<{
    brand: z.ZodDefault<z.ZodBoolean>;
    title: z.ZodDefault<z.ZodBoolean>;
    counter: z.ZodDefault<z.ZodBoolean>;
    progress: z.ZodDefault<z.ZodBoolean>;
    brandName: z.ZodDefault<z.ZodString>;
    tagline: z.ZodOptional<z.ZodString>;
    titleText: z.ZodDefault<z.ZodString>;
    counterText: z.ZodDefault<z.ZodString>;
    progressPct: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type HudParams = z.infer<typeof HudSchema>;
