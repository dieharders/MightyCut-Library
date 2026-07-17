import { z } from "zod";
export declare const StepSchema: z.ZodObject<{
    num: z.ZodString;
    title: z.ZodString;
    body: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type StepParams = z.infer<typeof StepSchema>;
