/** A neobrutalist pull-quote: a centered bordered card on a pink ground, with an
 *  optional eyebrow pill and attribution line (kind: quote). No children. */
export declare const Quote: import("../../runtime").TreatmentFactory<import("zod").ZodObject<{
    text: import("zod").ZodString;
    attribution: import("zod").ZodOptional<import("zod").ZodString>;
    eyebrow: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>;
