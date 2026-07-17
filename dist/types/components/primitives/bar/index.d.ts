/** A neobrutalist vertical chart column: a bordered pastel bar that grows from the
 *  baseline while its value counts up. The leader column is yellow, the rest blue. */
export declare const Bar: import("../../runtime").ComponentFactory<import("zod").ZodObject<{
    value: import("zod").ZodNumber;
    label: import("zod").ZodString;
    max: import("zod").ZodNumber;
    unit: import("zod").ZodOptional<import("zod").ZodString>;
    leader: import("zod").ZodDefault<import("zod").ZodBoolean>;
}, import("zod/v4/core").$strip>>;
