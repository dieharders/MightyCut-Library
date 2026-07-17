/** A neobrutalist numbered step card: a bordered white tile with a yellow number
 *  chip, linked to the next step by a short connector bar. */
export declare const Step: import("../../runtime").ComponentFactory<import("zod").ZodObject<{
    num: import("zod").ZodString;
    title: import("zod").ZodString;
    body: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>;
