/** A neobrutalist feature card: a bordered white tile with an accent icon square, a bold uppercase title, and a supporting line. */
export declare const Card: import("../../runtime").ComponentFactory<import("zod").ZodObject<{
    title: import("zod").ZodString;
    body: import("zod").ZodOptional<import("zod").ZodString>;
    icon: import("zod").ZodString;
    accent: import("zod").ZodDefault<import("zod").ZodEnum<{
        blue: "blue";
        pink: "pink";
        green: "green";
        yellow: "yellow";
    }>>;
}, import("zod/v4/core").$strip>>;
