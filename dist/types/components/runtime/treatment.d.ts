import { z } from "zod";
import type { FrameGround } from "../../types/storyboard";
import type { TimingPreset, TransitionName } from "../../types/transitions";
import { type AnimDescriptor } from "./anim";
import type { ComponentInstance, TreatmentFactory } from "./types";
export type TreatmentDef<S extends z.ZodTypeAny> = {
    name: string;
    schema: S;
    /** Frame markup: own data-slots + one data-children container + own data-anim. */
    template: string;
    css: string;
    /** Canonical full-bleed ground (a storyboard override can replace it at scene time). */
    ground: FrameGround;
    example: z.input<S>;
    /** The leaf component this treatment repeats as its children (stat-grid→stat, …).
     *  Formalizes the CLI/agent/spec-map child relationship + drives the showcase child editor. */
    childComponent?: string;
    /** Children used when the caller adds none (default deck build + showcase). */
    defaultChildren: (p: z.infer<S>) => ComponentInstance[];
    /** Decoration components rendered when the caller adds none (e.g. cover's star
     *  + tilt-rect). A caller's addDecorations() overrides these entirely. */
    defaultDecorations?: (p: z.infer<S>) => ComponentInstance[];
    /** Own slot fills (headline, caption, …). */
    fill?: (p: z.infer<S>) => Record<string, string | null | undefined>;
    /** Responsive layout: CSS custom properties from the child count. */
    layout?: (childCount: number, p: z.infer<S>) => Record<string, string>;
    /** Own animations (e.g. the headline reveal). */
    anim?: (p: z.infer<S>, childCount: number) => AnimDescriptor[];
    /** First child keys to this VO line (headline is line 0). Default 1. */
    childLineBase?: number;
    /** Per-child stagger fallback (seconds). Default 0.16. */
    childStagger?: number;
    /** Whole-scene page IN transition (catalog name). Unset ⇒ the legacy DEFAULT_ENTRANCE. */
    animIn?: TransitionName;
    /** Whole-scene page OUT transition (catalog name). Unset/`none` ⇒ no exit (hard cut). */
    animOut?: TransitionName;
    /** IN duration preset (short/medium/long). Default short when animIn is set. */
    timeIn?: TimingPreset;
    /** OUT duration preset (short/medium/long). Default short when animOut is set. */
    timeOut?: TimingPreset;
    /** Page entrance tween statement; `page` is in scope. Default: a soft fade. */
    entrance?: string;
};
export declare function treatment<S extends z.ZodTypeAny>(def: TreatmentDef<S>): TreatmentFactory<S>;
