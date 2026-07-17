import { z } from "zod";
export declare const AgendaSchema: z.ZodObject<{
    headline: z.ZodString;
}, z.core.$strip>;
export type AgendaParams = z.infer<typeof AgendaSchema>;
