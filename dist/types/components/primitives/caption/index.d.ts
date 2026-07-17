/** A caption pill — the block VO-transcript chrome: a white pill with a solid ink
 *  border + hard offset shadow, a pastel left accent bar, and mono text. In the
 *  real render the root owns the caption rail; this is the library/showcase piece. */
export declare const Caption: import("../../runtime").ComponentFactory<import("zod").ZodObject<{
    text: import("zod").ZodString;
    accentBar: import("zod").ZodDefault<import("zod").ZodEnum<{
        blue: "blue";
        pink: "pink";
        green: "green";
        yellow: "yellow";
    }>>;
}, import("zod/v4/core").$strip>>;
