import { z } from "zod";
export declare const QuoteSchema: z.ZodObject<{
    text: z.ZodString;
    attribution: z.ZodOptional<z.ZodString>;
    eyebrow: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type QuoteParams = z.infer<typeof QuoteSchema>;
