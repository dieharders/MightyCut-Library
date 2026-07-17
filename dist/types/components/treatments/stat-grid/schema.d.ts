import { z } from "zod";
export declare const StatGridSchema: z.ZodObject<{
    headline: z.ZodString;
}, z.core.$strip>;
export type StatGridParams = z.infer<typeof StatGridSchema>;
