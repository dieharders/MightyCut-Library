import { z } from "zod";
export declare const RowSchema: z.ZodObject<{
    label: z.ZodString;
    a: z.ZodString;
    b: z.ZodString;
}, z.core.$strip>;
export type RowParams = z.infer<typeof RowSchema>;
