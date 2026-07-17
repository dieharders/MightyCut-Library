/** A label pill — the block eyebrow chrome: an ink-bordered, hard-shadowed pill in
 *  a pastel `variant`, uppercase mono text. Only the background differs by variant. */
export declare const Pill: import("../../runtime").ComponentFactory<import("zod").ZodObject<{
    text: import("zod").ZodString;
    variant: import("zod").ZodDefault<import("zod").ZodEnum<{
        cream: "cream";
        blue: "blue";
        pink: "pink";
        green: "green";
        yellow: "yellow";
        white: "white";
    }>>;
}, import("zod/v4/core").$strip>>;
