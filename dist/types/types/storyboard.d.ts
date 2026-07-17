import { z } from "zod";
/**
 * The frame-theme names — the themes the frame builder renders (each with its own
 * annotated showcase + treatments + frame.css). Canonical home so the storyboard
 * schema, generate-content's selector, and the CLI/job overrides share one list
 * (no drift). `block` is the reference; the others go live as their showcases are
 * annotated.
 */
export declare const FRAME_THEME_NAMES: readonly ["block", "capsule", "creative", "professional", "standard", "future"];
export type FrameThemeName = (typeof FRAME_THEME_NAMES)[number];
/**
 * The render-ready frame treatments — universal frame-system concepts each
 * theme's showcase annotates with data-treatment="<id>". EVERY live theme ships
 * the SAME named set (a tripwire test asserts this list and each showcase's
 * data-treatment ids stay in sync, both directions). `chart` and `bar-ranking`
 * are siblings over the same spec data (chart.series): `chart` is the vertical
 * bar chart, `bar-ranking` the horizontal ranked list — the builder fills both
 * from the same code; orientation is chosen per theme in its showcase markup
 * (data-bar vs data-bar="horizontal"). Likewise `timeline` and `agenda` are
 * siblings over the same spec data (steps): `timeline` is the stepped cards,
 * `agenda` a sparse numbered index list — same builder code, different skin.
 */
export declare const FRAME_TREATMENTS: readonly ["cover", "feature-cards", "stat-grid", "closing-plate", "quote", "timeline", "comparison", "chart", "bar-ranking", "agenda"];
export type FrameTreatment = (typeof FRAME_TREATMENTS)[number];
/**
 * The five candy pastels (+ structural offwhite/white/black) that cycle as
 * full-bleed grounds across frames. FRAME.md: the cycle is the rhythm. The
 * builder applies the ground as an inline background on the frame so a single
 * shared frame.css restyles every scene.
 */
export declare const FRAME_GROUNDS: readonly ["offwhite", "cream", "blue", "pink", "green", "yellow", "black"];
export type FrameGround = (typeof FRAME_GROUNDS)[number];
/**
 * The standardized, theme-agnostic slot vocabulary. Treatments mark injectable
 * elements with data-slot="<name>" drawn from this set; the builder's resolver
 * maps each name (plus the slide kind) to a spec field. A tripwire test asserts
 * every data-slot in the showcase is in this set.
 */
export declare const SLOT_NAMES: readonly ["eyebrow", "headline", "subtitle", "counter", "cta", "attribution", "quote-text", "card-icon", "card-title", "card-body", "stat-number", "stat-label", "step-num", "step-title", "step-body", "col-a", "col-b", "row-label", "cell-a", "cell-b", "bar-value", "bar-label", "caption", "caption-text", "brand-name", "tagline", "hud-title"];
export type SlotName = (typeof SLOT_NAMES)[number];
/**
 * The data-repeat list names — a container wrapping exactly ONE item template
 * the builder clones per content item. A tripwire asserts the showcase's
 * data-repeat values are in this set.
 */
export declare const REPEAT_LISTS: readonly ["cards", "stats", "steps", "rows", "bars"];
export type RepeatList = (typeof REPEAT_LISTS)[number];
declare const SceneStoryboardSchema: z.ZodObject<{
    sceneId: z.ZodString;
    treatment: z.ZodEnum<{
        cover: "cover";
        "feature-cards": "feature-cards";
        "stat-grid": "stat-grid";
        "closing-plate": "closing-plate";
        quote: "quote";
        timeline: "timeline";
        comparison: "comparison";
        chart: "chart";
        "bar-ranking": "bar-ranking";
        agenda: "agenda";
    }>;
    options: z.ZodOptional<z.ZodObject<{
        ground: z.ZodOptional<z.ZodEnum<{
            offwhite: "offwhite";
            cream: "cream";
            blue: "blue";
            pink: "pink";
            green: "green";
            yellow: "yellow";
            black: "black";
        }>>;
        transition: z.ZodOptional<z.ZodObject<{
            animIn: z.ZodOptional<z.ZodEnum<{
                pop: "pop";
                none: "none";
                fade: "fade";
                rise: "rise";
                fall: "fall";
                scale: "scale";
                "slide-left": "slide-left";
                "slide-right": "slide-right";
                "slide-up": "slide-up";
                "slide-down": "slide-down";
                wipe: "wipe";
            }>>;
            animOut: z.ZodOptional<z.ZodEnum<{
                pop: "pop";
                none: "none";
                fade: "fade";
                rise: "rise";
                fall: "fall";
                scale: "scale";
                "slide-left": "slide-left";
                "slide-right": "slide-right";
                "slide-up": "slide-up";
                "slide-down": "slide-down";
                wipe: "wipe";
            }>>;
            timeIn: z.ZodOptional<z.ZodEnum<{
                short: "short";
                medium: "medium";
                long: "long";
            }>>;
            timeOut: z.ZodOptional<z.ZodEnum<{
                short: "short";
                medium: "medium";
                long: "long";
            }>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type SceneStoryboard = z.infer<typeof SceneStoryboardSchema>;
export declare const StoryboardSchema: z.ZodObject<{
    theme: z.ZodEnum<{
        block: "block";
        capsule: "capsule";
        creative: "creative";
        professional: "professional";
        standard: "standard";
        future: "future";
    }>;
    scenes: z.ZodArray<z.ZodObject<{
        sceneId: z.ZodString;
        treatment: z.ZodEnum<{
            cover: "cover";
            "feature-cards": "feature-cards";
            "stat-grid": "stat-grid";
            "closing-plate": "closing-plate";
            quote: "quote";
            timeline: "timeline";
            comparison: "comparison";
            chart: "chart";
            "bar-ranking": "bar-ranking";
            agenda: "agenda";
        }>;
        options: z.ZodOptional<z.ZodObject<{
            ground: z.ZodOptional<z.ZodEnum<{
                offwhite: "offwhite";
                cream: "cream";
                blue: "blue";
                pink: "pink";
                green: "green";
                yellow: "yellow";
                black: "black";
            }>>;
            transition: z.ZodOptional<z.ZodObject<{
                animIn: z.ZodOptional<z.ZodEnum<{
                    pop: "pop";
                    none: "none";
                    fade: "fade";
                    rise: "rise";
                    fall: "fall";
                    scale: "scale";
                    "slide-left": "slide-left";
                    "slide-right": "slide-right";
                    "slide-up": "slide-up";
                    "slide-down": "slide-down";
                    wipe: "wipe";
                }>>;
                animOut: z.ZodOptional<z.ZodEnum<{
                    pop: "pop";
                    none: "none";
                    fade: "fade";
                    rise: "rise";
                    fall: "fall";
                    scale: "scale";
                    "slide-left": "slide-left";
                    "slide-right": "slide-right";
                    "slide-up": "slide-up";
                    "slide-down": "slide-down";
                    wipe: "wipe";
                }>>;
                timeIn: z.ZodOptional<z.ZodEnum<{
                    short: "short";
                    medium: "medium";
                    long: "long";
                }>>;
                timeOut: z.ZodOptional<z.ZodEnum<{
                    short: "short";
                    medium: "medium";
                    long: "long";
                }>>;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type Storyboard = z.infer<typeof StoryboardSchema>;
export {};
