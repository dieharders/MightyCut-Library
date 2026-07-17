import { z } from "zod";
export declare const IconSchema: z.ZodObject<{
    name: z.ZodDefault<z.ZodEnum<{
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
    accent: z.ZodDefault<z.ZodEnum<{
        blue: "blue";
        pink: "pink";
        green: "green";
        yellow: "yellow";
        black: "black";
    }>>;
    size: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type IconParams = z.infer<typeof IconSchema>;
