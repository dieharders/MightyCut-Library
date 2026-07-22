// Build-time inline-SVG icon set for the component library — the same 21-path set
// as window.MC.icon in the library's assets/fx/mc.js, but usable WITHOUT a browser
// MC dependency (the component runtime is pure/deterministic and runs under Bun +
// the esbuild showcase bundle). The `icon` component injects iconSvg() into a
// data-html slot. TODO: dedupe this against mc.js's ICON_PATHS once the render
// pipeline consumes the component `icon` (a shared source both sides import).

/** The icon names, in mc.js source order — the `icon` component's `name` enum. */
export const ICON_NAMES = [
  "doc",
  "image",
  "email",
  "word",
  "database",
  "graph",
  "shield",
  "cloud",
  "cube",
  "search",
  "sparkles",
  "chip",
  "check",
  "cross",
  "lock",
  "layers",
  "sync",
  "arrowRight",
  "users",
  "gauge",
  "filter",
] as const;
export type IconName = (typeof ICON_NAMES)[number];

// Inner path markup (stroke style: round caps/joins, 24×24 viewBox, strokeWidth 1.8).
// Verbatim from mc.js ICON_PATHS.
const ICON_PATHS: Record<IconName, string> = {
  doc: '<path d="M6 3h7l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M13 3v5h5"/><path d="M8.5 13h7M8.5 16.5h7"/>',
  image:
    '<rect x="4" y="5" width="16" height="14" rx="1.5"/><circle cx="9" cy="10" r="1.6"/><path d="M5 17l4.5-4.5L13 16l3-3 3 3.5"/>',
  email: '<rect x="3.5" y="6" width="17" height="12" rx="1.5"/><path d="M4 7l8 6 8-6"/>',
  word: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M5.5 9.5l1.3 5L8.2 11l1.4 3.5L11 9.5"/><path d="M13.5 10h4.5M13.5 12.5h4.5M13.5 15h4.5"/>',
  database:
    '<ellipse cx="12" cy="5.5" rx="7" ry="2.8"/><path d="M5 5.5v6c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8v-6"/><path d="M5 11.5v6c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8v-6"/>',
  graph:
    '<circle cx="6" cy="7" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="17" cy="17.5" r="2.4"/><circle cx="7" cy="17" r="2.4"/><path d="M8 7.5l8-1M7.5 9l8.5 7M8.8 16.4l6-1M7.2 15l0-6"/>',
  shield:
    '<path d="M12 3l7 2.5v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10v-5L12 3Z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  cloud: '<path d="M7.5 18a4 4 0 0 1-.4-7.98A5 5 0 0 1 17 9.5a3.5 3.5 0 0 1 .2 8.5H7.5Z"/>',
  cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  sparkles:
    '<path d="M12 4l1.6 4.2L18 10l-4.4 1.8L12 16l-1.6-4.2L6 10l4.4-1.8L12 4Z"/><path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z"/>',
  chip: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  cross: '<path d="M6 6l12 12M18 6L6 18"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5Z"/><path d="M3 13l9 5 9-5M3 17l9 5 9-5"/>',
  sync: '<path d="M4 11a8 8 0 0 1 13.5-5.3L20 8"/><path d="M20 4v4h-4"/><path d="M20 13a8 8 0 0 1-13.5 5.3L4 16"/><path d="M4 20v-4h4"/>',
  arrowRight: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  users:
    '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 6.2a3 3 0 0 1 0 5.6M16.5 19a5.5 5.5 0 0 0-2.2-4.4"/>',
  gauge: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-5"/>',
  filter: '<path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z"/>',
};

/** Narrow an untrusted icon name to a known one, or null (mirrors MC.asIconName). */
export const asIconName = (name: string): IconName | null =>
  Object.prototype.hasOwnProperty.call(ICON_PATHS, name) ? (name as IconName) : null;

/**
 * Inline SVG markup for a named icon (unknown → sparkles fallback, like MC.icon).
 * `stroke` defaults to currentColor so the `.icon` component can drive color via
 * CSS `color`; width/height are OMITTED so CSS sizes the svg (the component sets
 * `.icon svg { width/height }` in rem). Deterministic — no browser dependency.
 */
export const iconSvg = (name: string): string => {
  const body = ICON_PATHS[name as IconName] ?? ICON_PATHS.sparkles;
  return (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    body +
    "</svg>"
  );
};
