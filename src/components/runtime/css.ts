// CSS scoping + collection for the component runtime.
//
// Components author their CSS under a semantic root class (`.stat`, `.stat-grid`)
// using rem on a fixed 16px root (so a size is the same in any container; 1.2rem = 1%
// of the 1920 design width). Because every sub-composition is imported into ONE shared
// DOM (importNode, not iframes), those semantic classes would cross-match between
// scenes. `scopeCss` prefixes every rule with the scene's `.<compId>-root`
// wrapper so each scene's CSS only styles its own subtree. `collectCss` gathers a
// treatment's own CSS plus each distinct child component's CSS, deduped by name,
// so a stat-grid with five stats inlines the `.stat` rules exactly once.
//
// Component CSS is intentionally FLAT — semantic selectors + declarations, no
// nested at-rules (rem needs no @container/@media), so the simple tokenizer below is
// sufficient (a test guards this).

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
