import { z } from "zod";
import type { ChildSpec } from "../components/compose";
import { type FrameGround } from "./storyboard";
import { type TransitionSpec } from "./transitions";
/** A resolved child (or decoration) instance: a registered component name + its
 *  params. Structurally identical to compose.ts's `ChildSpec` (all variation lives
 *  in `params`), so no `.loose()` is needed here. */
export declare const ChildSpecSchema: z.ZodObject<{
    name: z.ZodString;
    params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
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
    timeIn: z.ZodOptional<z.ZodEnum<{
        short: "short";
        medium: "medium";
        long: "long";
    }>>;
}, z.core.$strip>;
/** One editable caption line: the id ties it back to a `spec.voiceover[]` line (and
 *  its audio clip / manifest entry); `text` is the on-screen caption. `max(220)`
 *  mirrors `VOLineSchema.text` so the editor's edit is rejected at the deck layer if
 *  it overflows. The spoken `say` override is intentionally NOT carried — editing a
 *  caption's text does not re-synthesize audio (see the deck POST write-back). */
export declare const DeckVoLineSchema: z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
}, z.core.$strip>;
/** One slide's composition — `treatment` + own-slot `params` + resolved `children`,
 *  with optional `decorations` / `ground` / `anim` overrides and the slide's VO ids. */
export declare const DeckSceneSchema: z.ZodObject<{
    id: z.ZodString;
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
    params: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    children: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
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
        timeIn: z.ZodOptional<z.ZodEnum<{
            short: "short";
            medium: "medium";
            long: "long";
        }>>;
    }, z.core.$strip>>;
    decorations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
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
        timeIn: z.ZodOptional<z.ZodEnum<{
            short: "short";
            medium: "medium";
            long: "long";
        }>>;
    }, z.core.$strip>>>;
    ground: z.ZodOptional<z.ZodEnum<{
        offwhite: "offwhite";
        cream: "cream";
        blue: "blue";
        pink: "pink";
        green: "green";
        yellow: "yellow";
        black: "black";
    }>>;
    anim: z.ZodOptional<z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<{
            riseIn: "riseIn";
            fadeIn: "fadeIn";
            staggerIn: "staggerIn";
            rule: "rule";
            float: "float";
            countUp: "countUp";
            growBar: "growBar";
            scaleIn: "scaleIn";
            from: "from";
        }>;
        target: z.ZodString;
        time: z.ZodUnion<readonly [z.ZodObject<{
            at: z.ZodLiteral<"line">;
            n: z.ZodNumber;
            plus: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            at: z.ZodLiteral<"index">;
            n: z.ZodNumber;
            plus: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            at: z.ZodLiteral<"leadIn">;
            plus: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            at: z.ZodLiteral<"seconds">;
            t: z.ZodNumber;
        }, z.core.$strip>]>;
        opts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodString, z.ZodBoolean]>>>;
    }, z.core.$strip>>>;
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
    voIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    vo: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$loose>;
export declare const DeckMetaSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    requester: z.ZodOptional<z.ZodString>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    fps: z.ZodOptional<z.ZodNumber>;
}, z.core.$loose>;
export declare const DeckDocumentSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    theme: z.ZodEnum<{
        block: "block";
        capsule: "capsule";
        creative: "creative";
        professional: "professional";
        standard: "standard";
        future: "future";
    }>;
    meta: z.ZodOptional<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        requester: z.ZodOptional<z.ZodString>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        fps: z.ZodOptional<z.ZodNumber>;
    }, z.core.$loose>>;
    scenes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
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
        params: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        children: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
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
            timeIn: z.ZodOptional<z.ZodEnum<{
                short: "short";
                medium: "medium";
                long: "long";
            }>>;
        }, z.core.$strip>>;
        decorations: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
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
            timeIn: z.ZodOptional<z.ZodEnum<{
                short: "short";
                medium: "medium";
                long: "long";
            }>>;
        }, z.core.$strip>>>;
        ground: z.ZodOptional<z.ZodEnum<{
            offwhite: "offwhite";
            cream: "cream";
            blue: "blue";
            pink: "pink";
            green: "green";
            yellow: "yellow";
            black: "black";
        }>>;
        anim: z.ZodOptional<z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<{
                riseIn: "riseIn";
                fadeIn: "fadeIn";
                staggerIn: "staggerIn";
                rule: "rule";
                float: "float";
                countUp: "countUp";
                growBar: "growBar";
                scaleIn: "scaleIn";
                from: "from";
            }>;
            target: z.ZodString;
            time: z.ZodUnion<readonly [z.ZodObject<{
                at: z.ZodLiteral<"line">;
                n: z.ZodNumber;
                plus: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>, z.ZodObject<{
                at: z.ZodLiteral<"index">;
                n: z.ZodNumber;
                plus: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>, z.ZodObject<{
                at: z.ZodLiteral<"leadIn">;
                plus: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>, z.ZodObject<{
                at: z.ZodLiteral<"seconds">;
                t: z.ZodNumber;
            }, z.core.$strip>]>;
            opts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodString, z.ZodBoolean]>>>;
        }, z.core.$strip>>>;
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
        voIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        vo: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
        }, z.core.$strip>>>;
    }, z.core.$loose>>;
}, z.core.$loose>;
export type DeckScene = z.infer<typeof DeckSceneSchema>;
export type DeckMeta = z.infer<typeof DeckMetaSchema>;
export type DeckDocument = z.infer<typeof DeckDocumentSchema>;
export type DeckVoLine = z.infer<typeof DeckVoLineSchema>;
/** The subset of a scene the editor owns and overwrites on save. */
export type SceneEdit = {
    params: Record<string, unknown>;
    children: ChildSpec[];
    decorations?: ChildSpec[];
    ground?: FrameGround;
    transition?: TransitionSpec;
    vo?: DeckVoLine[];
};
/**
 * Merge an editor edit over the originally-loaded scene: overwrite ONLY the fields
 * the editor owns (`params`/`children`/`decorations`/`ground`) and carry everything
 * else through untouched — `id`, `treatment`, `anim`, `voIds`, and any field not
 * surfaced in the editor. Empty decorations / unset ground mirror "absent", so a
 * scene that inherited treatment defaults stays identical on an unedited round-trip.
 */
export declare const applySceneEdit: (original: DeckScene, edit: SceneEdit) => DeckScene;
