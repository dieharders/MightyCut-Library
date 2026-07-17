/** An inline-SVG icon from the shared 21-icon set. Uses the runtime `rawFill` seam
 *  to inject the (unescaped) SVG markup into a data-html slot; `accent` drives the
 *  stroke color (via `currentColor`) and `size` the cqw dimensions. */
export declare const Icon: import("../../runtime").ComponentFactory<import("zod").ZodObject<{
    name: import("zod").ZodDefault<import("zod").ZodEnum<{
        filter: "filter";
        check: "check";
        email: "email";
        search: "search";
        cross: "cross";
        shield: "shield";
        doc: "doc";
        image: "image";
        word: "word";
        database: "database";
        graph: "graph";
        cloud: "cloud";
        cube: "cube";
        sparkles: "sparkles";
        chip: "chip";
        lock: "lock";
        layers: "layers";
        sync: "sync";
        arrowRight: "arrowRight";
        users: "users";
        gauge: "gauge";
    }>>;
    accent: import("zod").ZodDefault<import("zod").ZodEnum<{
        blue: "blue";
        pink: "pink";
        green: "green";
        yellow: "yellow";
        black: "black";
    }>>;
    size: import("zod").ZodDefault<import("zod").ZodNumber>;
}, import("zod/v4/core").$strip>>;
