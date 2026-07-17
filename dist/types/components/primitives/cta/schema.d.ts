import { z } from "zod";
export declare const CtaSchema: z.ZodObject<{
    text: z.ZodDefault<z.ZodString>;
    arrow: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type CtaParams = z.infer<typeof CtaSchema>;
