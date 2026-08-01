// The preview shadow's STYLESHEET contract — the one thing the WebUI preview depends on
// that none of the render-path tripwires can see.
//
// A scene's built CSS no longer carries its backdrop mask's rules: they are staged as a
// project's read-only assets/backdrops.css (see primitives/backdrops.ts for the incident
// that moved them), so the render document links them and the preview shadow — which links
// nothing — has to inject BACKDROPS_CSS itself. Drop that one interpolation from mount.ts
// and every other test in this repo stays green while the showcase and the deck editor
// mount an unstyled mask: the element is there, full-bleed, painting nothing.
//
// mount.ts is browser code and this runner has no DOM, so it gets the smallest fake that
// mountPreview actually touches — the same sandbox approach boxless-reveal.test.ts takes
// with mc.js. requestAnimationFrame is a no-op: the settle/scale pass needs real layout and
// a real gsap, and nothing here is about animation.
import { describe, expect, test } from "bun:test";
import { BACKDROPS, BACKDROPS_CSS } from "../components/primitives/backdrops";
import "../components/registry"; // populate the registry
import { getTreatment } from "../components/runtime/registry";
import { blockTheme } from "../components/themes/block/theme";
import { mountPreview, type MountPreviewOptions } from "./mount";

/* ------------------------------------------------------------- fake DOM --- */

type FakeEl = {
  tagName: string;
  className: string;
  textContent: string;
  innerHTML: string;
  style: Record<string, string>;
  childNodes: FakeEl[];
  shadowRoot: FakeEl | null;
  firstElementChild: FakeEl | null;
  clientWidth: number;
  clientHeight: number;
  appendChild: (child: FakeEl) => FakeEl;
  replaceChildren: () => void;
  attachShadow: (init: { mode: string }) => FakeEl;
  querySelector: () => null;
};

const el = (tagName: string): FakeEl => {
  const node: FakeEl = {
    tagName,
    className: "",
    textContent: "",
    innerHTML: "",
    style: {},
    childNodes: [],
    shadowRoot: null,
    firstElementChild: null,
    clientWidth: 0,
    clientHeight: 0,
    appendChild: (child) => {
      node.childNodes.push(child);
      node.firstElementChild ??= child;
      return child;
    },
    replaceChildren: () => {
      node.childNodes.length = 0;
      node.firstElementChild = null;
    },
    attachShadow: () => (node.shadowRoot = el("#shadow-root")),
    querySelector: () => null,
  };
  return node;
};

// bootstrapFx appends gsap + mc.js as <script> textContent — with no eval here, that just
// parks two strings on a detached head, and `window.gsap` / `window.MC` stay undefined, so
// the animation pass no-ops. ResizeObserver is left undefined on purpose (mount.ts guards
// on `typeof`), as is document.fonts.
const g = globalThis as unknown as Record<string, unknown>;
g.document = { createElement: (tag: string) => el(tag), head: el("head") };
g.window = globalThis;
g.requestAnimationFrame = () => 0;

/** Mount block's `cover` treatment and hand back the shadow's stylesheet + scene markup. */
const mount = (opts: MountPreviewOptions = {}): { css: string; html: string } => {
  const container = el("div");
  mountPreview(container as unknown as HTMLElement, getTreatment("cover")(), blockTheme, opts);
  const shadow = container.shadowRoot!;
  const style = shadow.childNodes.find((n) => n.tagName === "style")!;
  const stage = shadow.childNodes.find((n) => n.tagName === "div")!;
  return { css: style.textContent, html: stage.childNodes[0].innerHTML };
};

/* ---------------------------------------------------------------- tests --- */

describe("preview shadow stylesheet (tripwire)", () => {
  test("the whole backdrop sheet rides into every preview shadow", () => {
    const { css } = mount();
    expect(css, "the preview shadow must inject BACKDROPS_CSS — nothing else styles the mask").toContain(
      BACKDROPS_CSS,
    );
  });

  test.each(Object.keys(BACKDROPS))("an overridden '%s' mask is mounted AND styled", (name) => {
    const { css, html } = mount({ backdrop: name });
    expect(html, `the preview must mount the '${name}' mask element`).toContain(`mc-backdrop--${name}`);
    expect(css, `the preview shadow carries no rules for the '${name}' mask`).toContain(
      `.mc-backdrop--${name}`,
    );
    // The overlay base is what makes the mask full-bleed behind the content; without it the
    // element mounts at auto size and the mask is effectively absent.
    expect(css, "the shared overlay base is missing from the preview shadow").toContain(".mc-backdrop {");
  });
});
