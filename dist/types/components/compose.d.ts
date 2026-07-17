import type { FrameGround } from "../types/storyboard";
import type { TimingPreset, TransitionName, TransitionSpec } from "../types/transitions";
import { type AnimDescriptor } from "./runtime/anim";
import type { ComponentInstance, ThemeTokens, TreatmentInstance } from "./runtime/types";
export type ChildSpec = {
    name: string;
    params?: Record<string, unknown>;
    /** Per-child whole-element entrance transition (catalog name). */
    animIn?: TransitionName;
    /** Per-child entrance duration preset. */
    timeIn?: TimingPreset;
};
export type SceneSpec = {
    treatment: string;
    params?: Record<string, unknown>;
    /** Override the treatment's default children with explicit component instances. */
    children?: ChildSpec[];
    /** Override the treatment's default decorations with explicit component instances
     *  (empty/absent ⇒ the treatment's canonical defaults). */
    decorations?: ChildSpec[];
    /** Override the treatment's default animations. */
    anim?: AnimDescriptor[];
    /** Whole-scene page transition (animIn/animOut + timing). */
    transition?: TransitionSpec;
};
export type ComposeOpts = {
    theme?: ThemeTokens;
    voIds?: string[];
    /** Storyboard ground override (else the treatment's canonical ground). */
    ground?: FrameGround;
};
/** Construct a validated component instance (throws on unknown name / bad params). */
export declare const composeComponent: (name: string, params?: Record<string, unknown>) => ComponentInstance;
/** Construct a validated treatment instance with children + optional anim override. */
export declare const composeTreatment: (spec: SceneSpec) => TreatmentInstance;
/** Build a full scene sub-composition HTML from params (fail-loud). */
export declare const composeScene: (spec: SceneSpec, compId: string, opts?: ComposeOpts) => string;
/** Build a standalone component fragment HTML (for preview / inspection). */
export declare const composeComponentHtml: (name: string, params?: Record<string, unknown>, opts?: ComposeOpts) => string;
