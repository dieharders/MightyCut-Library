import { z } from "zod";
export declare const AgendaItemSchema: z.ZodObject<{
    num: z.ZodString;
    title: z.ZodString;
    detail: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type AgendaItemParams = z.infer<typeof AgendaItemSchema>;
