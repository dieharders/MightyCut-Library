import type { ComponentFactory, ThemeTokens, TreatmentFactory } from "../components/runtime/types";
import type { DeckVoLine } from "../types/deck";
import { type FrameGround } from "../types/storyboard";
import { type TimingPreset, type TransitionName, type TransitionSpec } from "../types/transitions";
export type Factory = ComponentFactory | TreatmentFactory;
export declare const nameOf: (f: Factory) => string;
export declare const isTreatment: (f: Factory) => f is TreatmentFactory;
export declare const isFrameComp: (f: Factory) => boolean;
export declare const el: (tag: string, cls?: string, text?: string) => HTMLElement;
export declare const refreshers: (() => void)[];
export type Schema = {
    properties?: Record<string, SchemaField>;
    required?: string[];
};
export type SchemaField = {
    type?: string;
    description?: string;
    default?: unknown;
    enum?: string[];
    maxLength?: number;
    /** z.array item schema (JSON Schema `items`). */
    items?: {
        type?: string;
    };
    /** z.tuple positional item schemas (JSON Schema `prefixItems`). */
    prefixItems?: {
        type?: string;
    }[];
};
export declare const coerce: (field: SchemaField, raw: string, checked?: boolean) => unknown;
export declare const inputFor: (field: SchemaField, value: unknown, onChange: () => void) => HTMLElement;
export declare const issues: (e: {
    issues: readonly {
        readonly path: readonly PropertyKey[];
        message: string;
    }[];
}) => string;
export type Instance = {
    name: string;
    params: Record<string, unknown>;
    animIn?: TransitionName;
    timeIn?: TimingPreset;
};
/** A seed instance from a loaded deck — params optional (mirrors the deck's ChildSpec). */
export type ChildInit = {
    name: string;
    params?: Record<string, unknown>;
    animIn?: TransitionName;
    timeIn?: TimingPreset;
};
export declare const buildInstanceEditor: (componentNames: string[], title: string, onChange: () => void, initialRows?: ChildInit[], showTransition?: boolean) => {
    el: HTMLElement;
    snapshot: () => Instance[] | null;
};
export declare const buildTransitionControls: (isT: boolean, initial: TransitionSpec | undefined, onChange: () => void) => {
    el: HTMLElement;
    snapshot: () => TransitionSpec | undefined;
};
export declare const buildVoEditor: (initialVo: DeckVoLine[], onChange: () => void) => {
    el: HTMLElement;
    snapshot: () => DeckVoLine[];
};
/** What a card reports back on snapshot — the fields the editor owns for a scene. */
export type CardSnapshot = {
    name: string;
    params: Record<string, unknown>;
    children: Instance[];
    decorations: Instance[];
    ground?: FrameGround;
    transition?: TransitionSpec;
    /** Present only for deck-scene cards (seeded with `initialVo`); the edited caption lines. */
    vo?: DeckVoLine[];
};
export type CardOpts = {
    compId?: string;
    label?: string;
    initial?: Record<string, unknown>;
    /** Seed the treatment's child list from a loaded deck. */
    initialChildren?: ChildInit[];
    /** Seed the treatment's decoration list from a loaded deck. */
    initialDecorations?: ChildInit[];
    /** Seed the ground override select (shown on every treatment; undefined ⇒ inherit). */
    initialGround?: FrameGround;
    /** Seed the transition controls (from a loaded deck scene). */
    initialTransition?: TransitionSpec;
    /** Seed the per-slide Captions section (a deck scene's VO lines). Absent/empty ⇒ no
     *  Captions section (e.g. the component showcase gallery, which has no VO). */
    initialVo?: DeckVoLine[];
    /** Theme tokens (palette/decorations/`:root` css) — threaded into the render context
     *  and the decoration-family list, so the card is theme-agnostic. Required. */
    theme?: ThemeTokens;
    /** Per-mount re-settle queue (isolates concurrent mounts, e.g. React StrictMode's
     *  double-invoke). Falls back to the module singleton for standalone use. */
    refreshers?: Array<() => void>;
};
export declare const buildCard: (factory: Factory, opts?: CardOpts) => {
    el: HTMLElement;
    snapshot: () => CardSnapshot | null;
};
export declare const scaleFrames: (root?: ParentNode) => void;
export declare const settleAfterAttach: (root?: ParentNode, queue?: Array<() => void>) => (() => void);
