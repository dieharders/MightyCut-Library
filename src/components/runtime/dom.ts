// Small DOM helpers over mini-dom for the component runtime: fill data-slot text,
// stamp data-anim markers, apply layout custom properties, prune removed nodes,
// and strip build-time annotations. These mirror the frame-builder's setSlot /
// stampComponent primitives but operate on a component's authored template.
import {
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
 * Fill every data-slot element from a slot→text map. A null/empty value marks the
 * element for removal (optional slots self-remove — subtitle, counter, cta, …).
 * Non-null values are HTML-escaped, set as text, and the data-slot attr dropped.
 */
export const fillSlots = (root: ElementNode, fills: Record<string, string | null | undefined>): void => {
  for (const [slot, value] of Object.entries(fills)) {
    const el = find(root, attrEq("data-slot", slot));
    if (!el) continue;
    if (value == null || value === "") {
      el.attrs["data-remove"] = "";
      continue;
    }
    setText(el, esc(String(value)));
    delete el.attrs["data-slot"];
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

const ANNOTATION_ATTRS = ["data-slot", "data-html", "data-anim", "data-children", "data-remove", "data-deco", "data-deco-dot"];

/** Strip every build-time annotation from the subtree (no leftover data-* leaks). */
export const stripAnnotations = (root: ElementNode): void => {
  for (const el of findAll(root, () => true)) {
    for (const a of ANNOTATION_ATTRS) delete el.attrs[a];
  }
};

/** Locate the single data-children container (a treatment's child region). */
export const childrenContainer = (root: ElementNode): ElementNode | null =>
  find(root, hasAttr("data-children"));
