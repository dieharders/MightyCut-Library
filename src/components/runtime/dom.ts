// Small DOM helpers over mini-dom for the component runtime: fill data-slot text,
// stamp data-anim markers, apply layout custom properties, prune removed nodes,
// and strip build-time annotations. These mirror the frame-builder's setSlot /
// stampComponent primitives but operate on a component's authored template.
import {
  type DomNode,
  type ElementNode,
  attrEq,
  find,
  findAll,
  hasAttr,
  isElement,
  parseFragment,
  removeWhere,
  setText,
} from "../../pipeline/mini-dom";

/** Escape text content for safe insertion (serialize does NOT escape text nodes). */
export const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Parse a template fragment and return its single root element. */
export const rootElement = (html: string): ElementNode => {
  const root = parseFragment(html).find(isElement);
  if (!root || !isElement(root)) throw new Error("template has no root element");
  return root as ElementNode;
};

export const addClass = (el: ElementNode, cls: string): void => {
  const cur = el.attrs.class ?? "";
  el.attrs.class = cur ? `${cur} ${cls}` : cls;
};

export const mergeStyle = (el: ElementNode, style: string): void => {
  if (!style) return;
  const cur = (el.attrs.style ?? "").trim().replace(/;\s*$/, "");
  el.attrs.style = cur ? `${cur}; ${style}` : style;
};

/** Turn a layout map into an inline style string (deterministic key order). */
export const styleProps = (props: Record<string, string>): string =>
  Object.entries(props)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");

/**
 * Read a declaration out of an element's inline style AND remove it, returning its value
 * (or null if absent). Used to lift a custom property a child set on itself up to its
 * container — see the sibling-uniform reservation in treatment.ts.
 *
 * Deliberately literal: the styles it parses are the ones `styleProps` wrote, `"k: v"`
 * joined by `"; "`, so a split on `;` is exact. It is not a general CSS parser and must
 * not be pointed at authored style attributes.
 */
export const takeStyleProp = (el: ElementNode, prop: string): string | null => {
  const raw = el.attrs.style;
  if (!raw) return null;
  const kept: string[] = [];
  let found: string | null = null;
  for (const decl of raw.split(";")) {
    const i = decl.indexOf(":");
    if (i > -1 && decl.slice(0, i).trim() === prop) found = decl.slice(i + 1).trim();
    else if (decl.trim()) kept.push(decl.trim());
  }
  if (found === null) return null;
  if (kept.length) el.attrs.style = kept.join("; ");
  else delete el.attrs.style;
  return found;
};

/** Split a headline into [head-with-trailing-space, final word]. Requires a non-space
 *  BEFORE the whitespace, so a single-word value never matches — accenting a whole
 *  one-word line is not the effect. Trailing punctuation rides with the last word
 *  ("capsule." keeps its period), which is what the theme mockups draw. */
const LAST_WORD = /^([\s\S]*\S\s+)(\S+)$/;

/**
 * `data-accent` modes: each maps a raw slot value to [plain head, accented tail], or
 * null when that value has no valid split for the mode (the slot then fills as plain
 * text). Add a mode here — the fill path and `ANNOTATION_ATTRS` need no changes.
 *
 * A Map, not an object literal: the mode is read off a template attribute, and plain
 * property lookup reaches Object.prototype — `data-accent="toString"` would resolve to
 * a real function, return "[object Object]", and get indexed as a [head, tail] tuple,
 * silently rendering a garbage headline instead of falling back to plain text.
 */
const ACCENT_SPLITS = new Map<string, (raw: string) => [string, string] | null>([
  [
    "last-word",
    (raw) => {
      // Trim first — the `$` anchor means one trailing space (which generated and pasted
      // deck copy carries all the time) would otherwise fail the match and drop the accent
      // with no visible sign that anything went wrong.
      const m = LAST_WORD.exec(raw.trim());
      return m ? [m[1]!, m[2]!] : null;
    },
  ],
]);

/** The class wrapped around an accented tail. Named for the thing rather than a theme: it is a
 *  shared page-level class every theme styles from `frame.css` (like `block-frame`, whose prefix
 *  is only historical), and a bare `.accent` would silently capture any component that ever
 *  styles its own — `accent` is already the name of the palette-role param on stats, icons and
 *  decorations. */
export const ACCENT_CLASS = "headline-accent";

/**
 * Build the children for an accented slot value: a plain text node followed by a
 * `<span class="headline-accent">` around the accented tail. Returns null when the slot declares
 * no (or an unknown) accent mode, or the value has no valid split — callers fall back
 * to plain text. Both halves are escaped independently and the span is a FIXED literal
 * — a typographic split, never a raw-HTML escape hatch (that is `fillRaw`/`data-html`).
 */
export const accentChildren = (raw: string, mode: string | undefined): DomNode[] | null => {
  const split = mode ? ACCENT_SPLITS.get(mode)?.(raw) ?? null : null;
  if (!split) return null;
  return [
    { type: "text", text: esc(split[0]) },
    { type: "element", tag: "span", attrs: { class: ACCENT_CLASS }, children: [{ type: "text", text: esc(split[1]) }] },
  ];
};

/**
 * Fill every data-slot element from a slot→text map. A null/empty value marks the
 * element for removal (optional slots self-remove — subtitle, counter, cta, …).
 * Non-null values are HTML-escaped, set as text, and the data-slot attr dropped.
 *
 * `data-accent="X"` on the slot additionally splits the value per `accentChildren`
 * (e.g. `last-word` wraps the final word in `<span class="headline-accent">` so a theme can
 * emphasise it — cover + closing headlines).
 */
export const fillSlots = (root: ElementNode, fills: Record<string, string | null | undefined>): void => {
  for (const [slot, value] of Object.entries(fills)) {
    const el = find(root, attrEq("data-slot", slot));
    if (!el) continue;
    if (value == null || value === "") {
      el.attrs["data-remove"] = "";
      continue;
    }
    const raw = String(value);
    const accented = accentChildren(raw, el.attrs["data-accent"]);
    if (accented) el.children = accented;
    else setText(el, esc(raw));
    delete el.attrs["data-slot"];
    delete el.attrs["data-accent"];
  }
};

/**
 * Fill every data-html="X" element from a slot→raw-HTML map by setting its single
 * child to an UNESCAPED text node — serialize() emits text nodes verbatim, so the
 * raw markup (e.g. an inline <svg>) survives to the output. A null/empty value
 * marks the element for removal (same as fillSlots). Deterministic: no parsing,
 * no browser dependency. Used by the `icon` component for inline-SVG injection.
 */
export const fillRaw = (root: ElementNode, fills: Record<string, string | null | undefined>): void => {
  for (const [slot, value] of Object.entries(fills)) {
    const el = find(root, attrEq("data-html", slot));
    if (!el) continue;
    if (value == null || value === "") {
      el.attrs["data-remove"] = "";
      continue;
    }
    el.children = [{ type: "text", text: value }];
    delete el.attrs["data-html"];
  }
};

/**
 * Stamp each data-anim="X" element with a scoped marker class `${prefix}-X` so the
 * anim interpreter can target it without cross-scene leaks. Returns the set of
 * local anim ids found (used by a tripwire to verify every declared anim target
 * exists in the template).
 */
export const stampAnims = (root: ElementNode, prefix: string): Set<string> => {
  const ids = new Set<string>();
  for (const el of findAll(root, hasAttr("data-anim"))) {
    const id = el.attrs["data-anim"]!;
    ids.add(id);
    addClass(el, `${prefix}-${id}`);
    delete el.attrs["data-anim"];
  }
  return ids;
};

/** Remove any element marked data-remove (an unfilled optional slot). */
export const pruneRemoved = (root: ElementNode): void => {
  removeWhere(root.children, hasAttr("data-remove"));
};

const ANNOTATION_ATTRS = ["data-slot", "data-html", "data-anim", "data-accent", "data-children", "data-remove", "data-deco", "data-deco-dot"];

/** Strip every build-time annotation from the subtree (no leftover data-* leaks). */
export const stripAnnotations = (root: ElementNode): void => {
  for (const el of findAll(root, () => true)) {
    for (const a of ANNOTATION_ATTRS) delete el.attrs[a];
  }
};

/** Locate the single data-children container (a treatment's child region). */
export const childrenContainer = (root: ElementNode): ElementNode | null =>
  find(root, hasAttr("data-children"));
