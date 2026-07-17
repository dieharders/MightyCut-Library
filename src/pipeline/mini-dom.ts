// A tiny, dependency-free HTML fragment parser/serializer used by the BLOCK
// frame builder to clone annotated treatment blocks out of the showcase and
// fill their data-slot elements. It is deliberately minimal: it handles the
// controlled markup the showcase authors (elements, attributes, text, comments)
// and NOT arbitrary HTML. Invariants the showcase must honor:
//   - attribute values never contain a raw '>' (so the open-tag scan is simple);
//   - elements have explicit closing tags (no void/self-closing reliance, though
//     "<tag/>" is tolerated);
//   - no <script>/<style>/<svg> inside a treatment block (those are lifted/handled
//     separately — treatments use CSS shapes + letters only).
// Output formatting need not match the input byte-for-byte; the consumer is the
// HyperFrames runtime, which only cares about valid structure.

export type ElementNode = {
  type: "element";
  tag: string;
  /** Attributes in source order. */
  attrs: Record<string, string>;
  children: DomNode[];
};
export type TextNode = { type: "text"; text: string };
export type CommentNode = { type: "comment"; text: string };
export type DomNode = ElementNode | TextNode | CommentNode;

const VOID_TAGS = new Set(["br", "hr", "img", "input", "meta", "link", "source"]);

/** Parse an HTML fragment into a flat list of top-level nodes. */
export const parseFragment = (html: string): DomNode[] => {
  const roots: DomNode[] = [];
  const stack: ElementNode[] = [];
  const push = (n: DomNode): void => {
    if (stack.length) stack[stack.length - 1]!.children.push(n);
    else roots.push(n);
  };
  let i = 0;
  const len = html.length;
  while (i < len) {
    if (html[i] === "<") {
      if (html.startsWith("<!--", i)) {
        // Search from i+2 so the abrupt-closing empty comments <!--> / <!---> are
        // handled (their '>' reuses the opening dashes), per the HTML spec.
        const end = html.indexOf("-->", i + 2);
        const stop = end === -1 ? len : Math.max(i + 4, end);
        push({ type: "comment", text: html.slice(i + 4, stop) });
        i = end === -1 ? len : end + 3;
        continue;
      }
      if (html[i + 1] === "/") {
        // Close tag — pop the matching element off the stack.
        const end = html.indexOf(">", i);
        const stop = end === -1 ? len : end;
        const name = html.slice(i + 2, stop).trim().toLowerCase();
        for (let s = stack.length - 1; s >= 0; s--) {
          if (stack[s]!.tag === name) {
            stack.length = s; // close this and any unclosed descendants
            break;
          }
        }
        i = end === -1 ? len : end + 1; // advance past '>'
        continue;
      }
      // Open tag — scan to the matching '>' respecting quotes.
      let j = i + 1;
      let quote = "";
      while (j < len) {
        const c = html[j]!;
        if (quote) {
          if (c === quote) quote = "";
        } else if (c === '"' || c === "'") {
          quote = c;
        } else if (c === ">") {
          break;
        }
        j++;
      }
      const rawTag = html.slice(i + 1, j);
      // Self-closing only when the '/' sits at a tag boundary (preceded by
      // whitespace or a quote), so an unquoted attribute value ending in '/'
      // (e.g. href=http://x/) is NOT mistaken for a self-close. parseOpenTag
      // also strips a '/' glued to the tag name (<br/>).
      const tagEnd = rawTag.replace(/\s+$/, "");
      const selfClose = tagEnd.endsWith("/") && /[\s"']/.test(tagEnd.charAt(tagEnd.length - 2) || " ");
      const el = parseOpenTag(selfClose ? tagEnd.slice(0, -1) : rawTag);
      push(el);
      if (!selfClose && !VOID_TAGS.has(el.tag)) stack.push(el);
      i = j + 1;
      continue;
    }
    // Text run up to the next '<'.
    const next = html.indexOf("<", i);
    const stop = next === -1 ? len : next;
    push({ type: "text", text: html.slice(i, stop) });
    i = stop;
  }
  return roots;
};

const parseOpenTag = (raw: string): ElementNode => {
  const trimmed = raw.trim();
  const sp = trimmed.search(/\s/);
  // A '/' glued to a name-only tag (<br/>) belongs to the close, not the name.
  const tag = (sp === -1 ? trimmed : trimmed.slice(0, sp)).toLowerCase().replace(/\/$/, "");
  const attrs: Record<string, string> = {};
  if (sp !== -1) {
    const rest = trimmed.slice(sp + 1);
    const re = /([^\s=/]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rest)) !== null) {
      const name = m[1]!;
      const value = m[3] ?? m[4] ?? m[5] ?? "";
      attrs[name] = value;
    }
  }
  return { type: "element", tag, attrs, children: [] };
};

const ATTR_ESCAPE = (s: string): string => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/** Serialize a node (or list) back to HTML. */
export const serialize = (node: DomNode | DomNode[]): string => {
  if (Array.isArray(node)) return node.map(serialize).join("");
  if (node.type === "text") return node.text;
  if (node.type === "comment") return `<!--${node.text}-->`;
  const attrs = Object.entries(node.attrs)
    .map(([k, v]) => (v === "" ? ` ${k}` : ` ${k}="${ATTR_ESCAPE(v)}"`))
    .join("");
  if (VOID_TAGS.has(node.tag)) return `<${node.tag}${attrs}>`;
  return `<${node.tag}${attrs}>${node.children.map(serialize).join("")}</${node.tag}>`;
};

export const isElement = (n: DomNode): n is ElementNode => n.type === "element";

/** Deep clone a node. */
export const cloneNode = <T extends DomNode>(n: T): T => structuredClone(n);

/** All descendant elements (and self) matching the predicate, depth-first. */
export const findAll = (
  node: DomNode | DomNode[],
  pred: (el: ElementNode) => boolean,
): ElementNode[] => {
  const out: ElementNode[] = [];
  const visit = (n: DomNode): void => {
    if (!isElement(n)) return;
    if (pred(n)) out.push(n);
    for (const c of n.children) visit(c);
  };
  (Array.isArray(node) ? node : [node]).forEach(visit);
  return out;
};

/** First descendant element (or self) matching the predicate. */
export const find = (
  node: DomNode | DomNode[],
  pred: (el: ElementNode) => boolean,
): ElementNode | null => findAll(node, pred)[0] ?? null;

/** Replace an element's children with a single text node. */
export const setText = (el: ElementNode, text: string): void => {
  el.children = [{ type: "text", text }];
};

/** Remove every element matching the predicate from the tree (in place). */
export const removeWhere = (nodes: DomNode[], pred: (el: ElementNode) => boolean): void => {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i]!;
    if (isElement(n)) {
      if (pred(n)) {
        nodes.splice(i, 1);
        continue;
      }
      removeWhere(n.children, pred);
    }
  }
};

/** Convenience: attribute-equality predicate. */
export const attrEq = (name: string, value: string) => (el: ElementNode): boolean =>
  el.attrs[name] === value;

/** Convenience: attribute-present predicate. */
export const hasAttr = (name: string) => (el: ElementNode): boolean => name in el.attrs;
