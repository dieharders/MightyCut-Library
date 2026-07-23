// CSS scoping + collection for the component runtime.
//
// Components author their CSS under a semantic root class (`.stat`, `.stat-grid`)
// using rem, quantized to a 0.125rem GRID (see `remGrid` below). Two reasons for that
// grid: at the 1920 design size 1rem = 16px, so every multiple of 0.125rem lands on an
// EVEN pixel — which minimizes sub-pixel jitter when an element is rotated or drawn off
// the device-pixel/DPI grid; and it keeps the authored scale legible.
//
// The render document (the harness-generated index.html) sets a viewport-derived root
// font-size, so authored numbers are CANVAS-relative, not pixel-absolute: the whole
// composition rescales if the canvas ever moves off 1920x1080. The even-pixel property
// therefore holds at the design size only — off it, jitter resistance comes from the
// uniform scale factor instead. (The old "1.2rem = 1% of 1920" convention is retired:
// 1.2rem rounds to 1.25rem on this grid, so the percentages no longer line up.)
//
// Because every sub-composition is imported into ONE shared
// DOM (importNode, not iframes), those semantic classes would cross-match between
// scenes. `scopeCss` prefixes every rule with the scene's `.<compId>-root`
// wrapper so each scene's CSS only styles its own subtree. `collectCss` gathers a
// treatment's own CSS plus each distinct child component's CSS, deduped by name,
// so a stat-grid with five stats inlines the `.stat` rules exactly once.
//
// Component CSS is intentionally FLAT — semantic selectors + declarations, no
// nested at-rules (rem needs no @container/@media), so the simple tokenizer below is
// sufficient (a test guards this).

/** The authoring grid, in rem. Every authored and computed size lands on a multiple. */
export const REM_GRID = 0.125;

/**
 * Quantize a rem length onto the 0.125rem grid, e.g. `remGrid(2.4) === "2.375rem"`.
 *
 * For sizes COMPUTED from user params (icon size, decoration dimensions) — authored CSS
 * is quantized at write time instead, and guarded by the grid-audit test. `min` floors
 * the result so a small param can't round a hairline to `0rem` and delete it.
 */
export const remGrid = (n: number, min = REM_GRID): string =>
  `${Math.max(min, Math.round(n / REM_GRID) * REM_GRID)}rem`;

/** Prefix every top-level rule's selector list with `.<root>-root `. */
export const scopeCss = (css: string, root: string): string => {
  const prefix = `.${root}-root`;
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "") // drop comments (avoid scoping text that looks like a selector)
    .replace(/(^|})\s*([^{}@]+)\{/g, (_m, close: string, selector: string) => {
      const scoped = selector
        .split(",")
        .map((s) => `${prefix} ${s.trim()}`)
        .join(",\n");
      return `${close ? `${close}\n` : ""}${scoped} {`;
    })
    .trim();
};

/**
 * The canonical `background: var(--<role>)` declaration a treatment stamps for its
 * ground, and the swap that re-points it at a scene's chosen ground.
 *
 * The character class MUST admit digits and hyphens: every palette role after the first
 * two has them (`accent-1`, `muted-2`, …), and an `[a-z]+`-only class matches nothing, so
 * the override is dropped with NO error and the ground picker just appears to do nothing.
 *
 * There are two callers on two sides of the same seam — the render path
 * (runtime/emit.ts, over a treatment's `pageStyle`) and the browser preview path
 * (engine/mount.ts, over the built html) — which is exactly why this lives here once
 * instead of as a regex literal duplicated in both.
 */
const GROUND_DECL = /background:\s*var\(--[a-z0-9-]+\)/;

/** Re-point the first canonical ground declaration in `css` at `ground`. Returns the
 *  input unchanged when there is none to swap (nothing to override). */
export const swapGround = (css: string, ground: string): string =>
  css.replace(GROUND_DECL, `background: var(--${ground})`);

/** Collect + dedupe component CSS by component name (each authored once). */
export const collectCss = (parts: { name: string; css: string }[]): string => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    if (seen.has(p.name)) continue;
    seen.add(p.name);
    const trimmed = p.css.trim();
    if (trimmed) out.push(`/* ${p.name} */\n${trimmed}`);
  }
  return out.join("\n\n");
};
