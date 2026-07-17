import type { ComponentInstance, ThemeTokens, TreatmentInstance } from "../components/runtime/types";
export type PreviewHandle = {
    /** Restart the entrance animation from the top. */
    replay: () => void;
    /** Remove the preview + its resize observer from the DOM. */
    destroy: () => void;
};
export type MountPreviewOptions = {
    /** CSS scope id (default `mc-preview`). Unique-ish per card avoids selector clashes if reused. */
    compId?: string;
    /** Render inside a scaled 1920×1080 frame stage (treatments + full-frame components like the HUD).
     *  Defaults to true for treatments, false for natural-size components. */
    frame?: boolean;
    /** Ground colour token override (deck scene ground) — swaps the treatment's canonical
     *  ground background the same way the renderer's buildScene does. */
    ground?: string;
};
/** Mount `instance`'s vanilla preview into `container`; returns a replay/destroy handle. */
export declare const mountPreview: (container: HTMLElement, instance: ComponentInstance | TreatmentInstance, theme: ThemeTokens, opts?: MountPreviewOptions) => PreviewHandle;
