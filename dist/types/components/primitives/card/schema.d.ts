import { z } from "zod";
export declare const ACCENTS: readonly ["pink", "blue", "green", "yellow"];
export declare const CardSchema: z.ZodObject<{
    title: z.ZodString;
    body: z.ZodOptional<z.ZodString>;
    icon: z.ZodString;
    accent: z.ZodDefault<z.ZodEnum<{
        blue: "blue";
        pink: "pink";
        green: "green";
        yellow: "yellow";
    }>>;
}, z.core.$strip>;
export type CardParams = z.infer<typeof CardSchema>;
