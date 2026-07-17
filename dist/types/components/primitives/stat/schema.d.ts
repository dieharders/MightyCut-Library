import { z } from "zod";
export declare const ACCENTS: readonly ["pink", "blue", "green", "yellow"];
export declare const StatSchema: z.ZodObject<{
    value: z.ZodNumber;
    label: z.ZodString;
    prefix: z.ZodOptional<z.ZodString>;
    suffix: z.ZodOptional<z.ZodString>;
    decimals: z.ZodDefault<z.ZodNumber>;
    accent: z.ZodDefault<z.ZodEnum<{
        blue: "blue";
        pink: "pink";
        green: "green";
        yellow: "yellow";
    }>>;
}, z.core.$strip>;
export type StatParams = z.infer<typeof StatSchema>;
