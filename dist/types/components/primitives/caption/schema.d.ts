import { z } from "zod";
export declare const CaptionSchema: z.ZodObject<{
    text: z.ZodString;
    accentBar: z.ZodDefault<z.ZodEnum<{
        blue: "blue";
        pink: "pink";
        green: "green";
        yellow: "yellow";
    }>>;
}, z.core.$strip>;
export type CaptionParams = z.infer<typeof CaptionSchema>;
