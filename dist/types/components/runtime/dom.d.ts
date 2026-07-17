import { type ElementNode } from "../../pipeline/mini-dom";
/** Escape text content for safe insertion (serialize does NOT escape text nodes). */
export declare const esc: (s: string) => string;
/** Parse a template fragment and return its single root element. */
export declare const rootElement: (html: string) => ElementNode;
export declare const addClass: (el: ElementNode, cls: string) => void;
export declare const mergeStyle: (el: ElementNode, style: string) => void;
/** Turn a layout map into an inline style string (deterministic key order). */
export declare const styleProps: (props: Record<string, string>) => string;
/**
 * Fill every data-slot element from a slot→text map. A null/empty value marks the
 * element for removal (optional slots self-remove — subtitle, counter, cta, …).
 * Non-null values are HTML-escaped, set as text, and the data-slot attr dropped.
 */
export declare const fillSlots: (root: ElementNode, fills: Record<string, string | null | undefined>) => void;
/**
 * Fill every data-html="X" element from a slot→raw-HTML map by setting its single
 * child to an UNESCAPED text node — serialize() emits text nodes verbatim, so the
 * raw markup (e.g. an inline <svg>) survives to the output. A null/empty value
 * marks the element for removal (same as fillSlots). Deterministic: no parsing,
 * no browser dependency. Used by the `icon` component for inline-SVG injection.
 */
export declare const fillRaw: (root: ElementNode, fills: Record<string, string | null | undefined>) => void;
/**
 * Stamp each data-anim="X" element with a scoped marker class `${prefix}-X` so the
 * anim interpreter can target it without cross-scene leaks. Returns the set of
 * local anim ids found (used by a tripwire to verify every declared anim target
 * exists in the template).
 */
export declare const stampAnims: (root: ElementNode, prefix: string) => Set<string>;
/** Remove any element marked data-remove (an unfilled optional slot). */
export declare const pruneRemoved: (root: ElementNode) => void;
/** Strip every build-time annotation from the subtree (no leftover data-* leaks). */
export declare const stripAnnotations: (root: ElementNode) => void;
/** Locate the single data-children container (a treatment's child region). */
export declare const childrenContainer: (root: ElementNode) => ElementNode | null;
