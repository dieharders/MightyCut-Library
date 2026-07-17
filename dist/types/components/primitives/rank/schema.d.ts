import { z } from "zod";
export declare const RankSchema: z.ZodObject<{
    value: z.ZodNumber;
    label: z.ZodString;
    max: z.ZodNumber;
    unit: z.ZodOptional<z.ZodString>;
    leader: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type RankParams = z.infer<typeof RankSchema>;
