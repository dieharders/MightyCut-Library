import { z } from "zod";
export declare const DECORATION_COMPONENTS: readonly ["starburst", "slab", "stripe", "badge"];
export type DecorationComponentName = (typeof DECORATION_COMPONENTS)[number];
/** The shared, var-driven decoration element (one `.deco`, styled entirely by
 *  inline custom properties from decorationLayout). */
export declare const DECO_TEMPLATE = "<div class=\"deco\" data-anim=\"item\"><i class=\"deco-shape\" data-html=\"shape\"></i></div>";
export declare const DECO_CSS = ".deco {\n  position: absolute;\n  left: var(--d-x, 50%);\n  top: var(--d-y, 50%);\n  width: var(--d-w, 16cqw);\n  height: var(--d-h, 16cqw);\n  transform: translate(-50%, -50%) rotate(var(--d-rot, 0deg));\n  background: var(--d-bg, transparent);\n  border: var(--d-border, none);\n  border-radius: var(--d-radius, 0);\n  filter: drop-shadow(0.5cqw 0.5cqw 0 var(--black));\n  z-index: var(--d-z, 1);\n  pointer-events: none;\n}\n.deco-shape { position: absolute; inset: 0; }\n.deco-shape svg { display: block; width: 100%; height: 100%; overflow: visible; }";
type DecoParams = {
    variant: string;
    x: number;
    y: number;
    size: number;
    rotate: number;
    layer: "back" | "front";
    accent: "pink" | "blue" | "green" | "yellow" | "cream";
};
/** Build one decoration component: a shape family (its own `variant` enum) over
 *  the shared placement props + shape engine. */
export declare const decorationComponent: (name: string, variants: readonly string[], example: DecoParams) => import("../runtime").ComponentFactory<z.ZodObject<{
    variant: z.ZodDefault<z.ZodEnum<{
        [x: string]: string;
    }>>;
    x: z.ZodDefault<z.ZodNumber>;
    y: z.ZodDefault<z.ZodNumber>;
    size: z.ZodDefault<z.ZodNumber>;
    rotate: z.ZodDefault<z.ZodNumber>;
    layer: z.ZodDefault<z.ZodEnum<{
        back: "back";
        front: "front";
    }>>;
    accent: z.ZodDefault<z.ZodEnum<{
        cream: "cream";
        blue: "blue";
        pink: "pink";
        green: "green";
        yellow: "yellow";
    }>>;
}, z.core.$strip>>;
export {};
