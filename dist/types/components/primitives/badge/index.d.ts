/** Decoration family — rounded / tag shapes (shield, tag, ticket, capsule) that
 *  soften the sharp slab. Positioned page-space flourish; add via addDecorations(). */
export declare const Badge: import("../../runtime").ComponentFactory<import("zod").ZodObject<{
    variant: import("zod").ZodDefault<import("zod").ZodEnum<{
        [x: string]: string;
    }>>;
    x: import("zod").ZodDefault<import("zod").ZodNumber>;
    y: import("zod").ZodDefault<import("zod").ZodNumber>;
    size: import("zod").ZodDefault<import("zod").ZodNumber>;
    rotate: import("zod").ZodDefault<import("zod").ZodNumber>;
    layer: import("zod").ZodDefault<import("zod").ZodEnum<{
        back: "back";
        front: "front";
    }>>;
    accent: import("zod").ZodDefault<import("zod").ZodEnum<{
        cream: "cream";
        blue: "blue";
        pink: "pink";
        green: "green";
        yellow: "yellow";
    }>>;
}, import("zod/v4/core").$strip>>;
