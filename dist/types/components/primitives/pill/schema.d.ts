import { z } from "zod";
export declare const PillSchema: z.ZodObject<{
    text: z.ZodString;
    variant: z.ZodDefault<z.ZodEnum<{
        cream: "cream";
        blue: "blue";
        pink: "pink";
        green: "green";
        yellow: "yellow";
        white: "white";
    }>>;
}, z.core.$strip>;
export type PillParams = z.infer<typeof PillSchema>;
