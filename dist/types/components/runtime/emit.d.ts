import type { FrameGround } from "../../types/storyboard";
import type { AnimDescriptor, BuildContext, ComponentInstance, SubComposition, TreatmentInstance } from "./types";
export type SceneOverrides = {
    /** Storyboard ground override (else the treatment's canonical ground). */
    ground?: FrameGround;
};
/** Build a scene's SubComposition parts, applying an optional ground override. */
export declare const buildScene: (treatment: TreatmentInstance, ctx: BuildContext, overrides?: SceneOverrides) => SubComposition;
/** Render a scene to a complete sub-composition HTML document. */
export declare const renderScene: (treatment: TreatmentInstance, ctx: BuildContext, overrides?: SceneOverrides) => string;
export type Preview = {
    html: string;
    css: string;
    anims: AnimDescriptor[];
};
/**
 * Build a self-contained preview of a component or treatment for the interactive
 * showcase: scoped HTML wrapped in a `.<compId>-root` (matching the sub-comp
 * envelope), the scoped CSS, and the anim descriptors to drive on hover. A
 * treatment carries its ground background; a component renders bare.
 */
export declare const buildPreview: (inst: ComponentInstance | TreatmentInstance, ctx: BuildContext) => Preview;
