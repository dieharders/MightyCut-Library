// mountPreview — render ONE component/treatment instance's vanilla preview into a
// container (a React card's ref), driving its animation on a paused GSAP timeline
// via the SAME MC.applyAnims interpreter the render pipeline uses (so the preview is
// WYSIWYG with the final MP4). This is the ONLY thing the library draws in the web
// UI — all surrounding chrome (cards, param forms, toolbar) is native React/Tailwind.
//
// Isolation: each preview mounts in its own Shadow DOM so the host app's CSS reset
// (Tailwind Preflight) can't bleed into the vanilla render, and the theme `:root`
// tokens are re-scoped to `:host`. Fonts are injected document-level by loadTheme.
import { BACKDROPS_CSS } from "../components/primitives/backdrops";
import { swapGround } from "../components/runtime/css";
import { buildPreview } from "../components/runtime/emit";
import { rootContext } from "../components/runtime";
import { groundFor } from "../components/runtime/treatment";
import { pageInFor, pageOutFor, type PageSpec } from "../components/runtime/transitions";
import type {
  ComponentInstance,
  ThemeTokens,
  TreatmentInstance,
} from "../components/runtime/types";
import { DESIGN_CANVAS, remScaleFor, type CanvasSize } from "../types/canvas";
import type { FrameGround } from "../types/storyboard";
import { TIMING_SECONDS } from "../types/transitions";
import { bootstrapFx } from "./fx";

type Timeline = {
  restart: () => void;
  progress: (p: number) => Timeline;
  pause: () => Timeline;
  kill: () => void;
  duration: () => number;
  time: (t: number) => Timeline;
  eventCallback: (name: string, cb: () => void) => Timeline;
};
type McGlobal = {
  applyAnims: (tl: unknown, anims: unknown, ctx: unknown) => void;
  showcaseCtx: (root: Element) => unknown;
};
type GsapGlobal = { timeline: (o?: { paused?: boolean }) => Timeline };
/** A whole-page transition factory on window.MC (fadeIn/slideOut/…), called to preview the page IN/OUT. */
type PageFactory = (
  tl: unknown,
  target: Element,
  at: number,
  opts: Record<string, unknown>,
) => void;

export type PreviewHandle = {
  /** Restart the entrance animation from the top. */
  replay: () => void;
  /** Remove the preview + its resize observer from the DOM. */
  destroy: () => void;
};

export type MountPreviewOptions = {
  /** CSS scope id (default `mc-preview`). Unique-ish per card avoids selector clashes if reused. */
  compId?: string;
  /** Render inside a scaled canvas-sized frame stage (treatments + full-frame components like
   *  the HUD). Defaults to true for treatments, false for natural-size components. */
  frame?: boolean;
  /** Ground colour token override (deck scene ground) — swaps the treatment's canonical
   *  ground background the same way the renderer's buildScene does. */
  ground?: string;
  /** Backdrop-mask override (deck scene backdrop) — selects the full-bleed mask design;
   *  unset falls back to the theme's canonical backdrop (built into the node, like render). */
  backdrop?: string;
  /** The canvas the framed stage represents. Defaults to DESIGN_CANVAS (types/canvas.ts) —
   *  the same fallback the renderer's scene hosts use, so preview and MP4 agree. */
  canvas?: CanvasSize;
};

// Base + stage styles injected into every preview shadow. `:host` pins the color /
// color-scheme / font so the vanilla render never inherits the host app's theme.
// `fg`/`scheme` are theme-derived (see the call site): the safety-net text colour must
// match the theme's surface — a light default (`var(--dark)`) reads on block's light
// preview but is near-invisible on future's dark one, so a dark theme flips to
// `var(--light)`. Every element skin sets its own colour; this only backstops one that
// forgets, so it must not be a fixed light-background assumption.
/** The canvas expressed in design units — what the preview actually lays out in (see below). */
const designBoxFor = (canvas: CanvasSize): CanvasSize => {
  const s = remScaleFor(canvas);
  return { width: canvas.width / s, height: canvas.height / s };
};

const previewCss = (
  frame: boolean,
  surface: string,
  fg: string,
  scheme: string,
  compId: string,
  canvas: CanvasSize,
  designBox: CanvasSize,
): string => `
:host { display: block; overflow: hidden; border-radius: inherit; color-scheme: ${scheme}; font-family: var(--disp, "Inter", system-ui, sans-serif); color: ${fg}; }
/* The host app's global border-box reset (Tailwind Preflight) does NOT cross the shadow
   boundary, so the shadow defaults to content-box. Scope border-box to the SCAFFOLD only
   (stage / inner / the scene root) — exactly like the render border-boxes its padded
   containers (.mc-page) and NOT components — so a content-box component still matches the
   MP4 while the padded scaffold sizes predictably. */
/* NAMES. The scaffold keeps the shared mc- prefix: no external CSS can reach into a shadow
   root, but the root is open (attachShadow below), so host code CAN querySelector through
   it, and the render document has scaffold of its own — the harness's slide-templates emits
   a DIFFERENT .mc-stage (the composed-slide slot region) inline. mc-preview-stage* is the
   prefix kept AND the collision with that name dropped. (The library's own copy of that
   class lived in assets/base.css, which is deleted — nothing linked it.)
   The third selector is built from compId, not hard-coded: the scene root is emitted as
   .<compId>-root (runtime/emit.ts), so a caller passing its own compId — the option exists
   right above — must still get border-box. Spelling it .mc-preview-root only ever matched
   the DEFAULT compId, and silently matched nothing once one was passed. */
.mc-preview-stage, .mc-preview-stage-inner, .${compId}-root { box-sizing: border-box; }
/* The stage surface. For a SCENE (treatment in a frame) it is that scene's own resolved ground,
   so the page-transition replay resolves out of the scene's colour exactly as the render does —
   the caller decides it, see the surface note in mountPreview. For a bare component it is
   theme-driven (theme.previewBg): a dark theme paints a dark ground so its glass / light-on-dark
   components read; unset ⇒ a neutral light default for block. This is the surface the user
   actually sees (it fills the preview box, above the host card). */
.mc-preview-stage { width: 100%; overflow: hidden; background: ${surface}; }
.mc-preview-stage--frame { position: relative; aspect-ratio: ${canvas.width} / ${canvas.height}; }
/* THE PREVIEW LAYS OUT IN DESIGN UNITS, NOT CANVAS PIXELS — and that is what lets it match a
   render whose rem is canvas-scaled.

   The render document stamps a canvas-derived root font-size (rootFontSizePx in
   types/canvas.ts) so 1rem is a fixed fraction of the frame. This preview CANNOT do that:
   it mounts into the HOST (WebUI)
   document and rem resolves against document.documentElement even across a shadow boundary,
   so the rule would leak into the WebUI's own rem layout. Do NOT set
   document.documentElement.style.fontSize here.

   So instead of scaling the UNIT to the box, it scales the BOX to the unit: the inner stage
   is sized in design units (canvas ÷ remScale, i.e. always DESIGN_CANVAS.width wide) where
   the host's 16px root is already correct by construction, and transform:scale() maps that
   onto the visible stage. Same aspect ratio, same layout, no leak. At DESIGN_CANVAS the
   divisor is 1 and this is byte-identical to sizing by the canvas directly.

   The dimensions below and the scale() divisor both derive from designBox, so they cannot
   drift apart the way the two hardcoded 1920s they replaced could. */
.mc-preview-stage--frame .mc-preview-stage-inner { position: absolute; top: 0; left: 0; width: ${designBox.width}px; height: ${designBox.height}px; transform-origin: top left; }
.mc-preview-stage--frame .mc-preview-stage-inner > * { position: absolute; inset: 0; }
/* Component/decoration previews render at their natural rem size inside a wide canvas
   (64rem — wider than any component, so text like the card body stays one line), then
   scale() FITS each element to its own box: scaled down to fill ~85% when it's bigger than
   the box, but never enlarged past natural size — so every component sits comfortably in its
   frame (small ones near natural, big ones scaled to fit), the way they did before. The
   canvas is centred in the (square) box; scale() transforms the scene root around center. */
.mc-preview-stage--comp { position: relative; overflow: hidden; aspect-ratio: 1 / 1; }
.mc-preview-stage--comp .mc-preview-stage-inner { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 64rem; height: 42rem; }
/* One gap spaces the cells of a display:contents fragment (the ledger Row) that flow straight
   into this centred flex; a single-box component has one child, so the gap is a no-op there. */
${frame ? "" : ".mc-preview-stage--comp .mc-preview-stage-inner > * { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 1.75rem; transform-origin: center; }"}
`;

// Fraction of the preview box a fitted component fills (when it's larger than the box).
const COMP_FILL = 0.85;

/**
 * PARSED SHEETS ARE SHARED ACROSS PREVIEWS, keyed by their text.
 *
 * Every preview is its own shadow root, and a `<style>` there is parsed for that root alone. Each
 * one carried ~11–15 KB, ~9 KB of it identical in every card (theme tokens, stage rules, backdrop
 * masks), so a page of previews parsed the same text once per card: a theme switch in the showcase
 * remounts ~37 cards, ~400 KB of CSS in one task, and the editor reel paid it per slide. A
 * constructable sheet is parsed once and adopted by every shadow that needs it, so only the first
 * mount of each distinct text pays.
 *
 * ALL FOUR layers are adopted, element CSS included, because adopted sheets cascade AFTER a
 * shadow's own `<style>` elements: leaving the element's sheet as a `<style>` would quietly put it
 * BEHIND the stage and backdrop rules it is meant to override.
 *
 * Bounded (least-recently-used out) because element CSS varies with what is mounted. Dropping a
 * sheet from here never unstyles a mounted preview, whose shadow still holds it.
 *
 * ONE CACHE PER DOCUMENT. A constructed sheet can only be adopted in the document whose
 * CSSStyleSheet built it, so a container in an iframe or pop-out window gets sheets built by that
 * window's constructor, never the host's (adopting a host sheet there throws NotAllowedError).
 *
 * THE SHARED SHEETS ARE READ-ONLY. One sheet object styles every preview of the same text, so an
 * in-place edit (`insertRule`, `replaceSync`, devtools) on one card's sheet restyles all of them and
 * every later mount that hits the cache. Restyle a single card by adopting an extra sheet of your
 * own into its shadow (mount and destroy leave sheets they did not build alone), never by mutating
 * one of these.
 */
const SHEET_CACHE_MAX = 128;
type SheetCache = Map<string, CSSStyleSheet>;
let sheetCaches = new WeakMap<Document, SheetCache>();
/** Every sheet this module built — how mount/destroy tell their own sheets from the host's. */
let ownSheets = new WeakSet<CSSStyleSheet>();

/** Test hook: forget every cached sheet so one suite's fakes can't answer another's lookups. */
export const resetPreviewSheetCache = (): void => {
  sheetCaches = new WeakMap();
  ownSheets = new WeakSet();
};

const sheetFor = (doc: Document, Sheet: typeof CSSStyleSheet, text: string): CSSStyleSheet => {
  let sheets = sheetCaches.get(doc);
  if (!sheets) sheetCaches.set(doc, (sheets = new Map()));
  const hit = sheets.get(text);
  if (hit) {
    sheets.delete(text); // re-insert: Map order is the recency order
    sheets.set(text, hit);
    return hit;
  }
  const sheet = new Sheet();
  sheet.replaceSync(text);
  ownSheets.add(sheet);
  sheets.set(text, sheet);
  if (sheets.size > SHEET_CACHE_MAX) sheets.delete(sheets.keys().next().value!);
  return sheet;
};

/**
 * The CSSStyleSheet constructor of the window that owns `shadow`, or null when that window can't
 * build constructable sheets (WebKit before 16.4, Chromium before 73), which falls back to one `<style>`.
 */
const sheetCtorFor = (shadow: ShadowRoot): typeof CSSStyleSheet | null => {
  if (!("adoptedStyleSheets" in shadow)) return null;
  const doc = shadow.ownerDocument ?? document;
  const view = (doc === document ? globalThis : doc.defaultView) as
    | { CSSStyleSheet?: typeof CSSStyleSheet }
    | null;
  const Sheet = view?.CSSStyleSheet;
  return typeof Sheet === "function" && typeof Sheet.prototype.replaceSync === "function"
    ? Sheet
    : null;
};

/**
 * The theme's `:root` tokens re-scoped to `:host`, memoised per theme. Without it every mount
 * re-ran the regex over ~9 KB and handed the sheet cache a NEW string, which it then hashed and
 * compared in full. The same string instance keeps its cached hash and compares by pointer.
 */
const hostCssMemo = new WeakMap<ThemeTokens, { src: string; out: string }>();
const hostCssFor = (theme: ThemeTokens): string => {
  const memo = hostCssMemo.get(theme);
  if (memo && memo.src === theme.css) return memo.out;
  const out = theme.css.replace(/:root/g, ":host");
  hostCssMemo.set(theme, { src: theme.css, out });
  return out;
};

/** Which mount currently owns each shadow root, so a superseded handle's destroy leaves it alone. */
const currentMount = new WeakMap<ShadowRoot, object>();

/** How many frames the first settle waits for gsap + mc.js (injected by bootstrapFx) to evaluate. */
const SETTLE_RETRY_FRAMES = 120;

/** Visual bounding rect of a preview's content, used to fit-scale it. Normally the root's
 *  single child box; but a display:contents fragment (the ledger Row) has no box of its own
 *  (reports 0×0), so fall back to the union of its descendant boxes. Returns null when empty. */
const contentRect = (root: HTMLElement): DOMRect | null => {
  const el = root.firstElementChild as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width >= 1 && r.height >= 1) return r;
  let left = Infinity,
    top = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  el.querySelectorAll("*").forEach((d) => {
    const dr = d.getBoundingClientRect();
    if (dr.width < 1 || dr.height < 1) return;
    left = Math.min(left, dr.left);
    top = Math.min(top, dr.top);
    right = Math.max(right, dr.right);
    bottom = Math.max(bottom, dr.bottom);
  });
  if (right <= left || bottom <= top) return null;
  return new DOMRect(left, top, right - left, bottom - top);
};

/** Mount `instance`'s vanilla preview into `container`; returns a replay/destroy handle. */
export const mountPreview = (
  container: HTMLElement,
  instance: ComponentInstance | TreatmentInstance,
  theme: ThemeTokens,
  opts: MountPreviewOptions = {},
): PreviewHandle => {
  bootstrapFx();
  const compId = opts.compId ?? "mc-preview";
  const frame = opts.frame ?? instance.kind === "treatment";
  const canvas = opts.canvas ?? DESIGN_CANVAS;
  const designBox = designBoxFor(canvas);
  // opts.ground is a loosely-typed FrameGround from the WebUI deck; it rides the ctx so
  // the backdrop mask resolves against it, and still drives the visible-bg swap below.
  const ctx = rootContext(compId, theme, {
    mode: "showcase",
    backdrop: opts.backdrop,
    ground: opts.ground as FrameGround | undefined,
  });
  /**
   * THE STAGE SURFACE UNDER A SCENE IS THAT SCENE'S OWN GROUND — not `theme.previewBg`.
   *
   * This is what the whole-page transition replay below happens over, and it is the only time
   * the surface is visible at all: a frame preview's scene fills the stage exactly (same aspect
   * ratio, `inset: 0`), so nothing else ever shows it. Painting the theme's neutral stage colour
   * there made every assigned entrance fade or slide the scene — GROUND INCLUDED — up from a
   * near-white plate (`#fafafa` for block, which pins no `previewBg`), which is precisely the
   * washed-out look this preview exists to let you judge.
   *
   * It is also no longer what the render does. The root composition now switches its deck fill
   * to each scene's ground as the deck plays (the harness's ground rail, pipeline/root-html.ts),
   * so in the final video an entrance resolves out of the scene's OWN colour. Leaving the stage
   * on `previewBg` would make the hover preview disagree with the MP4 on exactly the frames it
   * claims to preview — see the WYSIWYG note on the replay below.
   *
   * Resolved through `groundFor` with the SAME arguments `buildPreview` uses, so the surface and
   * the scene it sits under cannot name different roles; `ctx.ground` carries the caller's
   * override, so the editor's ground picker moves both together.
   *
   * Only for a TREATMENT in a frame. A bare component has no ground (nor a frame to paint), and
   * a frame-flagged component (`hud`) has none either — both keep `previewBg`, which for them is
   * a deliberate stage colour rather than a stand-in for a scene.
   */
  const sceneGround =
    frame && instance.kind === "treatment"
      ? groundFor(ctx, (instance as TreatmentInstance).ground)
      : null;
  const surface = sceneGround ? `var(--${sceneGround})` : (theme.previewBg ?? "#fafafa");
  const built = buildPreview(instance, ctx);
  const css = built.css;
  const anims = built.anims;
  // Same ground swap the render path runs (runtime/css.ts owns it, so the role-safe
  // character class can't drift between the two sides of the seam).
  const html = opts.ground ? swapGround(built.html, opts.ground) : built.html;

  const shadow =
    container.shadowRoot ?? container.attachShadow({ mode: "open" });
  const token = {};
  currentMount.set(shadow, token); // any earlier handle on this shadow is now superseded
  shadow.replaceChildren();
  // theme `:root` tokens → `:host` (isolated, inherited by shadow content) + preview CSS
  // (the stage surface is the SCENE's ground for a treatment, else the theme's previewBg, else a
  // light default — see `surface` above; a `var(--role)` resolves because the tokens land on
  // `:host` on the line before, inside this same shadow root). The safety-net
  // foreground + color-scheme follow the theme's DECLARED previewScheme — never inferred
  // from `previewBg` being set, which would flip a light theme that merely wants a tinted
  // stage to white-on-light text.
  const dark = theme.previewScheme === "dark";
  const fg = dark ? "var(--light, #fff)" : "var(--dark, #000)";
  const scheme = dark ? "dark" : "light";
  // BACKDROPS_CSS rides along explicitly: a scene's built CSS no longer carries its mask's
  // rules (they are staged as assets/backdrops.css on the render side — see backdrops.ts), so
  // without this the showcase/editor preview would mount the mask element unstyled. Unscoped
  // is correct here — the shadow root already isolates it, and the rules are per-scene
  // invariant by construction.
  const layers = [
    hostCssFor(theme),
    previewCss(frame, surface, fg, scheme, compId, canvas, designBox),
    BACKDROPS_CSS,
    css,
  ];
  const Sheet = sheetCtorFor(shadow);
  const adopt = Sheet !== null;
  if (Sheet) {
    // See `sheetCaches` above. Sheets the host adopted into a shadow it provided stay, ahead of
    // ours so the preview's layers still win the cascade; a previous mount's sheets are replaced.
    // NOTE the shadow then holds NO <style> element: code that inspects a preview's CSS reads
    // `shadow.adoptedStyleSheets` here and the <style> only on the fallback path below.
    const doc = shadow.ownerDocument ?? document;
    shadow.adoptedStyleSheets = [
      ...shadow.adoptedStyleSheets.filter((s) => !ownSheets.has(s)),
      ...layers.map((text) => sheetFor(doc, Sheet, text)),
    ];
  } else {
    const style = document.createElement("style");
    style.textContent = layers.join("\n");
    shadow.appendChild(style);
  }

  const stage = document.createElement("div");
  stage.className = frame
    ? "mc-preview-stage mc-preview-stage--frame"
    : "mc-preview-stage mc-preview-stage--comp";
  const inner = document.createElement("div");
  inner.className = "mc-preview-stage-inner";
  inner.innerHTML = html;
  stage.appendChild(inner);
  shadow.appendChild(stage);

  let destroyed = false;
  const scale = (): void => {
    if (destroyed) return; // a late fonts.ready / queued resize must not touch a torn-down preview
    if (frame) {
      // Frame: scale the design-unit scene onto the visible stage. The divisor MUST be the
      // box previewCss actually sized the inner element with — hence one `designBox` for both.
      inner.style.transform = `scale(${stage.clientWidth / designBox.width})`;
      return;
    }
    // Component/decoration: measure the element at its natural rem size (it renders in the
    // wide canvas, so text doesn't wrap), then fit it to the box — scale DOWN to fill ~85%
    // when it's bigger than the box, but never UP past natural size (Math.min(1, …)), so each
    // component sits comfortably in its frame. `.<compId>-root` centres its content, so the
    // transform scales around center.
    const root = inner.firstElementChild as HTMLElement | null;
    if (!root) return;
    root.style.transform = "none"; // measure natural size (undo any prior scale)
    const cr = contentRect(root);
    const boxW = stage.clientWidth;
    const boxH = stage.clientHeight;
    if (!cr || cr.width < 1 || cr.height < 1 || boxW < 1 || boxH < 1) return;
    const k = Math.min(1, (boxW * COMP_FILL) / cr.width, (boxH * COMP_FILL) / cr.height);
    root.style.transform = `scale(${k})`;
  };
  let tl: Timeline | null = null;
  const HOLD = 0.5; // preview beat between the last reveal and the page exit replay
  // The resolved whole-scene page transition (treatments only) — replayed live below.
  const pageTx =
    instance.kind === "treatment"
      ? (instance as TreatmentInstance).pageTransition()
      : null;
  const settle = (): void => {
    if (tl) return; // one timeline per mount
    // Read at settle time, not mount time: bootstrapFx may have injected gsap + mc.js only now,
    // and they define these globals when they evaluate, which can be a frame or more later.
    const gsap = (window as unknown as { gsap?: GsapGlobal }).gsap;
    const MC = (window as unknown as { MC?: McGlobal }).MC;
    if (!gsap || !MC) return;
    const timeline = (tl = gsap.timeline({ paused: true }));
    MC.applyAnims(timeline, anims, MC.showcaseCtx(inner));
    // Replay the whole-PAGE transition so the hover preview is WYSIWYG with the render. The
    // render emits the ENTRANCE inside the sub-composition (buildScene's entranceJs) and the
    // EXIT on the ROOT/master timeline (a clip-level tween — root-level tweens don't leak like a
    // nested sub-comp exit, which is why buildScene no longer emits one; see runtime/treatment.ts
    // + the harness's root-html). buildNode omits BOTH (each pipeline adds its own), so the
    // preview reconstructs them here from pageInFor / pageOutFor. This preview is a SINGLE scene,
    // not nested, so replaying the exit on the scene root is safe and matches the final video —
    // otherwise the hover would show the entrance but never the exit.
    //
    // WHAT IT PLAYS OVER is half of that WYSIWYG claim, and the easier half to lose: both
    // factories tween the scene root, whose descendant carries the ground, so the ground travels
    // with the transition and whatever sits behind the stage IS the transition's backdrop. The
    // render answers that with the ground rail (the harness's root-html switches the deck fill to
    // each scene's ground); here it is the stage surface, resolved from the same `groundFor`.
    let holdAt = timeline.duration();
    if (pageTx && (pageTx.animIn || pageTx.animOut)) {
      const pageEl =
        (inner.querySelector(`.${compId}-root`) as Element | null) ?? inner;
      const play = (spec: PageSpec | null, at: number, durSec: number): void => {
        if (!spec) return;
        const fn = (MC as unknown as Record<string, PageFactory>)[spec.fn];
        if (fn) fn(timeline, pageEl, at, { dur: durSec, ...spec.opts });
      };
      if (pageTx.animIn && pageTx.animIn !== "none")
        play(pageInFor(pageTx.animIn), 0, TIMING_SECONDS[pageTx.timeIn ?? "short"]);
      holdAt = timeline.duration(); // the composed frame: after reveals + page-in settle
      if (pageTx.animOut && pageTx.animOut !== "none") {
        play(pageOutFor(pageTx.animOut), holdAt + HOLD, TIMING_SECONDS[pageTx.timeOut ?? "short"]);
        timeline.eventCallback("onComplete", () => tl?.time(holdAt).pause()); // rest revealed, not exited
      }
    }
    timeline.time(holdAt).pause(); // settle to the composed frame so content is visible at rest
  };

  // A replay asked for before the first settle has no timeline to restart yet. It is held and
  // played once there is one, rather than dropped: a caller that mounts and immediately replays
  // (a preview mounted on demand, then asked to replay) would otherwise get nothing.
  let replayQueued = false;
  let laidOut = false; // the first frame has run, so settle() has real layout to work with
  // Settle + scale after the shadow is attached + laid out (gsap needs real layout).
  // Settle FIRST so any count-up text is at its final (widest) value before we measure
  // the content to fit-scale it — otherwise a stat sized on "0" would over-scale.
  // If gsap/mc.js haven't evaluated yet, settle() leaves tl null; retry on later frames
  // (bounded) so the timeline, and any replay queued meanwhile, isn't lost for good.
  let tries = 0;
  const firstSettle = (): void => {
    if (destroyed) return; // destroyed before this frame: nothing to settle, and no tl to leak
    laidOut = true;
    settle();
    scale();
    if (tl) {
      if (replayQueued) tl.restart();
      replayQueued = false;
    } else if (++tries < SETTLE_RETRY_FRAMES) requestAnimationFrame(firstSettle);
  };
  requestAnimationFrame(firstSettle);
  const ro =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => scale())
      : null;
  ro?.observe(stage);
  // Content width depends on webfont metrics — re-fit once fonts finish loading.
  const fonts = (document as unknown as { fonts?: { ready?: Promise<unknown> } })
    .fonts;
  fonts?.ready?.then(() => scale()).catch(() => {});

  return {
    replay: () => {
      if (destroyed) return;
      // Past the first frame with no timeline yet (gsap/mc.js arrived late): build it now.
      if (!tl && laidOut) {
        settle();
        scale();
      }
      if (tl) tl.restart();
      else replayQueued = true;
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      ro?.disconnect();
      tl?.kill();
      // A later mount into the same shadow owns its children and sheets now; a stale handle
      // destroyed after that remount must not strip the live preview.
      if (currentMount.get(shadow) !== token) return;
      currentMount.delete(shadow);
      shadow.replaceChildren();
      // Only the sheets this module adopted go; a host's own sheets stay.
      if (adopt) shadow.adoptedStyleSheets = shadow.adoptedStyleSheets.filter((s) => !ownSheets.has(s));
    },
  };
};
