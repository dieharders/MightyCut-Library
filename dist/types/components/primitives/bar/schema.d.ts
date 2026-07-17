import { z } from "zod";
export declare const BarSchema: z.ZodObject<{
    value: z.ZodNumber;
    label: z.ZodString;
    max: z.ZodNumber;
    unit: z.ZodOptional<z.ZodString>;
    leader: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type BarParams = z.infer<typeof BarSchema>;
