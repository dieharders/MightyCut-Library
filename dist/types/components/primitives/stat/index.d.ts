/** A neobrutalist stat card: a bordered white tile whose figure counts up from 0. */
export declare const Stat: import("../../runtime").ComponentFactory<import("zod").ZodObject<{
    value: import("zod").ZodNumber;
    label: import("zod").ZodString;
    prefix: import("zod").ZodOptional<import("zod").ZodString>;
    suffix: import("zod").ZodOptional<import("zod").ZodString>;
    decimals: import("zod").ZodDefault<import("zod").ZodNumber>;
    accent: import("zod").ZodDefault<import("zod").ZodEnum<{
        blue: "blue";
        pink: "pink";
        green: "green";
        yellow: "yellow";
    }>>;
}, import("zod/v4/core").$strip>>;
