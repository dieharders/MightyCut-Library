import { z } from "zod";
export declare const TimelineSchema: z.ZodObject<{
    headline: z.ZodString;
}, z.core.$strip>;
export type TimelineParams = z.infer<typeof TimelineSchema>;
