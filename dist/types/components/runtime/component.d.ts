import { z } from "zod";
import { type TimingPreset, type TransitionName } from "../../types/transitions";
import { type AnimDescriptor } from "./anim";
import type { ComponentFactory } from "./types";
export type ComponentDef<S extends z.ZodTypeAny> = {
    name: string;
    schema: S;
    /** Flat HTML; root carries `.${name}`; data-slot / data-anim annotations. */
    template: string;
    /** CSS authored under `.${name}` (cqw/cqh units, flat rules). */
    css: string;
    /** Example params — drives the showcase card + `defaults()` + tests. */
    example: z.input<S>;
    /** Map validated params → slot text (null/"" drops the optional slot). */
    fill?: (p: z.infer<S>) => Record<string, string | null | undefined>;
    /** Map validated params → RAW HTML injected UNESCAPED into a data-html element
     *  (null/"" drops it). For inline-SVG / markup slots the escaped fill can't carry. */
    rawFill?: (p: z.infer<S>) => Record<string, string | null | undefined>;
    /** Internal-reveal animations (targets are the template's data-anim ids). The
     *  whole-element ENTRANCE is separate — see `animIn` below. */
    anim?: (p: z.infer<S>) => AnimDescriptor[];
    /** Whole-element entrance transition (catalog name); unset ⇒ no entrance prepended. */
    animIn?: TransitionName;
    /** Opts baked into the default entrance (e.g. `{ dist: 26 }`) so it reproduces the
     *  element's pre-transition descriptor byte-for-byte. Applied only to the DEFAULT animIn. */
    animInOpts?: Record<string, number | string | boolean>;
    /** The root data-anim id the entrance targets (default "item"). */
    animTarget?: string;
    /** Default entrance duration preset (short/medium/long). Unset ⇒ the MC factory default. */
    timeIn?: TimingPreset;
    /** CSS custom properties set on the root for responsive layout. */
    layout?: (p: z.infer<S>) => Record<string, string>;
    /** Full-frame composite (e.g. `hud`): the showcase renders it in a 1920×1080
     *  frame slot rather than the natural-size component slot. Purely presentational. */
    frame?: boolean;
};
export declare function component<S extends z.ZodTypeAny>(def: ComponentDef<S>): ComponentFactory<S>;
