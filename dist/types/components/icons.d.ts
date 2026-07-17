/** The icon names, in mc.js source order — the `icon` component's `name` enum. */
export declare const ICON_NAMES: readonly ["doc", "image", "email", "word", "database", "graph", "shield", "cloud", "cube", "search", "sparkles", "chip", "check", "cross", "lock", "layers", "sync", "arrowRight", "users", "gauge", "filter"];
export type IconName = (typeof ICON_NAMES)[number];
/** Narrow an untrusted icon name to a known one, or null (mirrors MC.asIconName). */
export declare const asIconName: (name: string) => IconName | null;
/**
 * Inline SVG markup for a named icon (unknown → sparkles fallback, like MC.icon).
 * `stroke` defaults to currentColor so the `.icon` component can drive color via
 * CSS `color`; width/height are OMITTED so CSS sizes the svg (the component sets
 * `.icon svg { width/height }` in cqw). Deterministic — no browser dependency.
 */
export declare const iconSvg: (name: string) => string;
