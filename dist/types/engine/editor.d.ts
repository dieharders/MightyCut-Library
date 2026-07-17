import { type DeckDocument } from "../types/deck";
export type EditorHandle = {
    /** Replace the loaded deck (validates; renders from the raw object for lossless round-trip). */
    load: (raw: unknown) => void;
    /** Remove the resize listener + clear the shadow. */
    destroy: () => void;
};
export type MountEditorOptions = {
    /** The working deck to edit (host-provided; e.g. the WebUI's localStorage copy or baseline). */
    deck?: unknown;
    /** Fallback deck when `deck` is absent (e.g. a bundled sample). */
    sample?: unknown;
    /** Save handler — receives the edited DeckDocument. When provided, a Save button is shown
     *  (the caller owns persistence, e.g. saveDeck + a preview rebuild). Absent ⇒ Export only. */
    onSave?: (doc: DeckDocument) => void;
    /** Theme value to load (default 'block'; falls back if a deck names an unloadable theme). */
    themeName?: string;
};
export declare const mountEditor: (container: HTMLElement, opts?: MountEditorOptions) => Promise<EditorHandle>;
