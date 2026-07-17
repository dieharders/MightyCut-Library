/** A neobrutalist ranked row: a mono label, a bordered white track whose pastel fill
 *  grows out from the left, and a count-up value. The leader takes the yellow accent. */
export declare const Rank: import("../../runtime").ComponentFactory<import("zod").ZodObject<{
    value: import("zod").ZodNumber;
    label: import("zod").ZodString;
    max: import("zod").ZodNumber;
    unit: import("zod").ZodOptional<import("zod").ZodString>;
    leader: import("zod").ZodDefault<import("zod").ZodBoolean>;
}, import("zod/v4/core").$strip>>;
