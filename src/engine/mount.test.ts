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
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { BACKDROPS, BACKDROPS_CSS } from "../components/primitives/backdrops";
import "../components/registry"; // populate the registry
import { getComponent, getTreatment } from "../components/runtime/registry";
import { blockTheme } from "../components/themes/block/theme";
import { mountPreview, resetPreviewSheetCache, type MountPreviewOptions } from "./mount";

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

/** The shadow's CSS on either path: adopted sheets where the window has them, else the one <style>. */
const shadowCss = (shadow: FakeEl & { adoptedStyleSheets?: { text: string }[] }): string =>
  shadow.adoptedStyleSheets?.length
    ? shadow.adoptedStyleSheets.map((s) => s.text).join("\n")
    : shadow.childNodes.find((n) => n.tagName === "style")!.textContent;

/** Mount a block treatment (default `cover`) and hand back the shadow's stylesheet + markup. */
const mount = (opts: MountPreviewOptions = {}, treatment = "cover"): { css: string; html: string } => {
  const container = el("div");
  mountPreview(container as unknown as HTMLElement, getTreatment(treatment)(), blockTheme, opts);
  const shadow = container.shadowRoot!;
  const stage = shadow.childNodes.find((n) => n.tagName === "div")!;
  return { css: shadowCss(shadow), html: stage.childNodes[0].innerHTML };
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

// The surface UNDER a scene is the only thing a page-transition replay plays over — both page
// factories tween the scene root, and the ground travels with it. Painting the theme's neutral
// stage colour there faded every scene up from a near-white plate (block pins no previewBg, so
// `#fafafa`), which is both the washed-out look the preview exists to let you judge AND a
// disagreement with the render, where the root's ground rail holds the scene's own colour.
describe("preview stage surface (tripwire)", () => {
  const stageRule = (css: string): string =>
    css.split("\n").find((l) => l.startsWith(".mc-preview-stage {"))!;

  test("a scene's stage is grounded on the SCENE, not the theme's preview colour", () => {
    // cover's canonical ground is muted-1; block pins no groundDefault, so it survives.
    expect(stageRule(mount().css)).toContain("background: var(--muted-1)");
    // …and it tracks the treatment, which is the whole point — a per-theme constant could not.
    expect(stageRule(mount({}, "outro").css)).toContain("background: var(--primary)");
    expect(stageRule(mount({}, "stats").css)).toContain("background: var(--accent-2)");
    expect(stageRule(mount().css)).not.toContain("#fafafa");
  });

  test("a scene ground override moves the surface with the scene", () => {
    const { css, html } = mount({ ground: "secondary" });
    expect(stageRule(css)).toContain("background: var(--secondary)");
    // The pair IS the contract: a surface naming a different role than the scene it sits under
    // is the same mismatch, just one layer down.
    expect(html).toContain("background: var(--secondary)");
  });

  test("a bare COMPONENT keeps the theme's preview surface (it has no ground)", () => {
    const container = el("div");
    mountPreview(container as unknown as HTMLElement, getComponent("stat")(), blockTheme, {});
    expect(stageRule(shadowCss(container.shadowRoot!))).toContain("#fafafa"); // block pins no previewBg
  });
});

// Every preview is its own shadow root, and a <style> there is parsed for that root alone — so a
// page of previews parsed the same ~9 KB of theme tokens, stage rules and backdrop masks once per
// card. That was the lag when stepping through themes in the showcase. Where the webview has
// constructable sheets, each distinct text is parsed ONCE and adopted by every shadow that needs it.
describe("preview sheets are parsed once and shared", () => {
  class FakeSheet {
    text = "";
    replaceSync(text: string): void {
      parses.push(text);
      this.text = text;
    }
  }
  const parses: string[] = [];
  type AdoptingShadow = FakeEl & { adoptedStyleSheets: FakeSheet[] };

  // The sheet cache is module state: reset on both sides so no other suite's sheets answer here,
  // and none of these FakeSheets answer a later suite's lookups.
  beforeAll(() => {
    resetPreviewSheetCache();
    g.CSSStyleSheet = FakeSheet;
  });
  afterAll(() => {
    delete g.CSSStyleSheet;
    resetPreviewSheetCache();
  });

  const adoptingShadow = (extra: Partial<AdoptingShadow> = {}): AdoptingShadow =>
    Object.assign(el("#shadow-root"), { adoptedStyleSheets: [] as FakeSheet[] }, extra);

  /** Mount into a container whose shadow root supports adoptedStyleSheets (or into `shadow`, reused). */
  const mountAdopting = (treatment = "cover", shadow?: AdoptingShadow) => {
    const container = el("div");
    if (shadow) container.shadowRoot = shadow;
    container.attachShadow = () => (container.shadowRoot = adoptingShadow());
    const handle = mountPreview(container as unknown as HTMLElement, getTreatment(treatment)(), blockTheme, {});
    return { shadow: container.shadowRoot as AdoptingShadow, handle };
  };

  test("the theme sheet is parsed once however many previews mount", () => {
    const themeText = blockTheme.css.replace(/:root/g, ":host");
    const mounted = ["cover", "outro", "stats"].map((t) => mountAdopting(t).shadow);

    expect(parses.filter((t) => t === themeText)).toHaveLength(1);
    // Shared by identity, not merely equal: that is what spares the parse.
    for (const shadow of mounted) expect(shadow.adoptedStyleSheets[0]).toBe(mounted[0].adoptedStyleSheets[0]);

    // A second preview of the same thing shares EVERY layer by identity and parses nothing new.
    const before = parses.length;
    const again = mountAdopting("cover").shadow;
    expect(parses.length).toBe(before);
    again.adoptedStyleSheets.forEach((s, i) => expect(s).toBe(mounted[0].adoptedStyleSheets[i]));
  });

  test("a container in another document gets sheets built by THAT window", () => {
    // Adopting a sheet built by another document's constructor throws NotAllowedError.
    class FrameSheet extends FakeSheet {}
    const frameDoc = { defaultView: { CSSStyleSheet: FrameSheet } };
    const { shadow } = mountAdopting("cover", adoptingShadow({ ownerDocument: frameDoc } as never));

    expect(shadow.adoptedStyleSheets).toHaveLength(4);
    for (const s of shadow.adoptedStyleSheets) expect(s).toBeInstanceOf(FrameSheet);
    // …and the host document's cache is not handed the frame's sheets either.
    expect(mountAdopting().shadow.adoptedStyleSheets[0]).not.toBeInstanceOf(FrameSheet);
  });

  test("sheets the host adopted survive mount and destroy, ahead of the preview's", () => {
    const hostSheet = new FakeSheet();
    const { shadow, handle } = mountAdopting("cover", adoptingShadow({ adoptedStyleSheets: [hostSheet] }));

    expect(shadow.adoptedStyleSheets).toHaveLength(5);
    expect(shadow.adoptedStyleSheets[0]).toBe(hostSheet);
    handle.destroy();
    expect(shadow.adoptedStyleSheets).toEqual([hostSheet]);
  });

  test("a remount into the same shadow replaces the old preview's sheets", () => {
    const { shadow } = mountAdopting("cover");
    mountAdopting("outro", shadow);
    expect(shadow.adoptedStyleSheets).toHaveLength(4);
  });

  test("a stale handle destroyed after a remount leaves the live preview alone", () => {
    const { shadow, handle: stale } = mountAdopting("cover");
    const { handle: live } = mountAdopting("outro", shadow); // new mount first, then the old destroy
    const sheets = [...shadow.adoptedStyleSheets];
    const children = [...shadow.childNodes];

    stale.destroy();
    expect(shadow.adoptedStyleSheets).toEqual(sheets);
    expect(shadow.childNodes).toEqual(children);

    live.destroy();
    expect(shadow.adoptedStyleSheets).toHaveLength(0);
    expect(shadow.childNodes).toHaveLength(0);
  });

  test("layers keep the cascade order, the element's own CSS last", () => {
    const { shadow } = mountAdopting();
    const [theme, stage, backdrops, element] = shadow.adoptedStyleSheets.map((s) => s.text);

    expect(shadow.adoptedStyleSheets).toHaveLength(4);
    expect(theme).toContain(":host");
    expect(stage).toContain(".mc-preview-stage {");
    expect(backdrops).toBe(BACKDROPS_CSS);
    expect(element.length).toBeGreaterThan(0);
    // Adopted sheets cascade AFTER a shadow's own <style>, so a leftover <style> would sit
    // behind every layer above instead of in its place.
    expect(shadow.childNodes.some((n) => n.tagName === "style")).toBe(false);
  });

  test("destroy releases the adopted sheets", () => {
    const { shadow, handle } = mountAdopting();
    handle.destroy();
    expect(shadow.adoptedStyleSheets).toHaveLength(0);
  });
});

// The timeline is built in the first animation frame after the mount (gsap needs real layout), so
// a replay asked for before then has nothing to restart. A preview mounted on demand and replayed
// straight away (the editor's Replay on a slide that has only just been mounted) must still play.
describe("replay before the first settle", () => {
  let frames: (() => void)[] = [];
  let restarts = 0;
  let timelines = 0;

  beforeAll(() => {
    const tl = {
      restart: () => void restarts++,
      progress: () => tl,
      pause: () => tl,
      kill: () => {},
      duration: () => 0,
      time: () => tl,
      eventCallback: () => tl,
    };
    g.gsap = { timeline: () => (timelines++, tl) };
    g.MC = { applyAnims: () => {}, showcaseCtx: () => ({}) };
    g.requestAnimationFrame = (cb: () => void) => frames.push(cb);
  });
  afterAll(() => {
    delete g.gsap;
    delete g.MC;
    g.requestAnimationFrame = () => 0;
  });

  const mountFresh = () => {
    frames = [];
    restarts = 0;
    timelines = 0;
    return mountPreview(el("div") as unknown as HTMLElement, getTreatment("cover")(), blockTheme, {});
  };

  test("is held and played once the timeline exists", () => {
    const handle = mountFresh();
    handle.replay();
    expect(restarts).toBe(0);

    frames.forEach((f) => f());
    expect(restarts).toBe(1);
  });

  test("a preview destroyed before its first frame never builds a timeline", () => {
    const handle = mountFresh();
    handle.destroy();
    frames.forEach((f) => f());
    expect(timelines).toBe(0);
  });

  /** Run the frames queued so far (not ones they queue in turn). */
  const tick = () => {
    const now = frames;
    frames = [];
    now.forEach((f) => f());
  };

  // bootstrapFx injects gsap + mc.js as <script>s, which may not have evaluated by the first frame.
  test("a queued replay survives gsap arriving after the first frame", () => {
    const gsap = g.gsap;
    delete g.gsap;
    const handle = mountFresh();
    handle.replay();
    tick(); // no gsap yet: nothing to settle, and the settle is retried next frame
    expect(timelines).toBe(0);

    g.gsap = gsap;
    tick();
    expect(timelines).toBe(1);
    expect(restarts).toBe(1);
  });

  test("a replay after the first frame builds the timeline gsap was missing for", () => {
    const gsap = g.gsap;
    delete g.gsap;
    const handle = mountFresh();
    tick();
    g.gsap = gsap;

    handle.replay();
    expect(timelines).toBe(1);
    expect(restarts).toBe(1);
    tick(); // the pending retry must not build a second timeline
    expect(timelines).toBe(1);
  });
});

// Webfonts re-fit the preview once they load, which can be long after the card is gone.
describe("a destroyed preview is never re-fit", () => {
  const doc = g.document as Record<string, unknown>;
  const created: FakeEl[] = [];
  let loadFonts = () => {};

  beforeAll(() => {
    doc.createElement = (tag: string) => {
      const node = el(tag);
      created.push(node);
      return node;
    };
    doc.fonts = { ready: new Promise<void>((resolve) => (loadFonts = resolve)) };
  });
  afterAll(() => {
    doc.createElement = (tag: string) => el(tag);
    delete doc.fonts;
  });

  test("fonts.ready resolving after destroy leaves the stage untouched", async () => {
    const handle = mountPreview(el("div") as unknown as HTMLElement, getTreatment("cover")(), blockTheme, {});
    const inner = created.find((n) => n.className === "mc-preview-stage-inner")!;
    handle.destroy();

    loadFonts();
    await Promise.resolve();
    await Promise.resolve();
    expect(inner.style.transform).toBeUndefined();
  });
});
