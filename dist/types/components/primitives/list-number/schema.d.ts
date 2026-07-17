import { z } from "zod";
export declare const ListNumberSchema: z.ZodObject<{
    num: z.ZodString;
    text: z.ZodString;
}, z.core.$strip>;
export type ListNumberParams = z.infer<typeof ListNumberSchema>;
