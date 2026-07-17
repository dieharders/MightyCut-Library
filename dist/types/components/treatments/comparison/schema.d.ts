import { z } from "zod";
export declare const ComparisonSchema: z.ZodObject<{
    headline: z.ZodString;
    columns: z.ZodDefault<z.ZodTuple<[z.ZodString, z.ZodString], null>>;
}, z.core.$strip>;
export type ComparisonParams = z.infer<typeof ComparisonSchema>;
