import type { ComponentInstance, ThemeTokens, TreatmentInstance } from "../components/runtime/types";
export type PreviewHandle = {
    /** The rendered subtree root (scoped `.<compId>-root`). */
    root: HTMLElement;
    /** Restart the entrance animation. */
    replay: () => void;
    /** Remove the preview + its scoped style from the DOM. */
    destroy: () => void;
};
export type MountOptions = {
    /** Scene id → CSS scope + marker prefix (default `mc-preview`). */
    compId?: string;
};
/** Mount a built instance into `container`, returning a replay/destroy handle. */
export declare const mountPreview: (container: HTMLElement, instance: ComponentInstance | TreatmentInstance, theme: ThemeTokens, opts?: MountOptions) => PreviewHandle;
