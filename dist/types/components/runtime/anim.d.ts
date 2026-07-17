import { z } from "zod";
export declare const AnimTimeSchema: z.ZodUnion<readonly [z.ZodObject<{
    at: z.ZodLiteral<"line">;
    n: z.ZodNumber;
    plus: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    at: z.ZodLiteral<"index">;
    n: z.ZodNumber;
    plus: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    at: z.ZodLiteral<"leadIn">;
    plus: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    at: z.ZodLiteral<"seconds">;
    t: z.ZodNumber;
}, z.core.$strip>]>;
export type AnimTime = z.infer<typeof AnimTimeSchema>;
export declare const ANIM_KINDS: readonly ["riseIn", "fadeIn", "staggerIn", "rule", "float", "countUp", "growBar", "scaleIn", "from"];
export type AnimKind = (typeof ANIM_KINDS)[number];
export declare const AnimDescriptorSchema: z.ZodObject<{
    kind: z.ZodEnum<{
        riseIn: "riseIn";
        fadeIn: "fadeIn";
        staggerIn: "staggerIn";
        rule: "rule";
        float: "float";
        countUp: "countUp";
        growBar: "growBar";
        scaleIn: "scaleIn";
        from: "from";
    }>;
    target: z.ZodString;
    time: z.ZodUnion<readonly [z.ZodObject<{
        at: z.ZodLiteral<"line">;
        n: z.ZodNumber;
        plus: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
        at: z.ZodLiteral<"index">;
        n: z.ZodNumber;
        plus: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
        at: z.ZodLiteral<"leadIn">;
        plus: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
        at: z.ZodLiteral<"seconds">;
        t: z.ZodNumber;
    }, z.core.$strip>]>;
    opts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodString, z.ZodBoolean]>>>;
}, z.core.$strip>;
export type AnimDescriptor = z.infer<typeof AnimDescriptorSchema>;
/** Shift a content anim's line/index by `addN` and its stagger fallback by `addPlus`
 *  (used when composing a component as the i-th child of a treatment). */
export declare const offsetAnim: (a: AnimDescriptor, addN: number, addPlus: number) => AnimDescriptor;
/** Rewrite a local `target` (a data-anim id) to a fully-qualified scoped class. */
export declare const qualifyAnim: (a: AnimDescriptor, prefix: string) => AnimDescriptor;
/** Serialize anim descriptors to the single inline call the sub-comp <script> runs.
 *  Returns "" when there is nothing to animate. */
export declare const serializeAnims: (anims: AnimDescriptor[]) => string;
