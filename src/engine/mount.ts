// mountPreview — render ONE component/treatment instance's vanilla preview into a
// container (a React card's ref), driving its animation on a paused GSAP timeline
// via the SAME MC.applyAnims interpreter the render pipeline uses (so the preview is
// WYSIWYG with the final MP4). This is the ONLY thing the library draws in the web
// UI — all surrounding chrome (cards, param forms, toolbar) is native React/Tailwind.
//
// Isolation: each preview mounts in its own Shadow DOM so the host app's CSS reset
// (Tailwind Preflight) can't bleed into the vanilla render, and the theme `:root`
// tokens are re-scoped to `:host`. Fonts are injected document-level by loadTheme.
import { buildPreview } from "../components/runtime/emit";
import { rootContext } from "../components/runtime";
import {
  pageInFor,
  pageOutFor,
  type PageSpec,
} from "../components/runtime/transitions";
import type {
  ComponentInstance,
  ThemeTokens,
  TreatmentInstance,
} from "../components/runtime/types";
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
  /** Render inside a scaled 1920×1080 frame stage (treatments + full-frame components like the HUD).
   *  Defaults to true for treatments, false for natural-size components. */
  frame?: boolean;
  /** Ground colour token override (deck scene ground) — swaps the treatment's canonical
   *  ground background the same way the renderer's buildScene does. */
  ground?: string;
};

// Base + stage styles injected into every preview shadow. `:host` pins the color /
// color-scheme / font so the vanilla render never inherits the host app's theme.
const previewCss = (frame: boolean): string => `
:host { display: block; overflow: hidden; border-radius: inherit; color-scheme: light; font-family: var(--disp, "Inter", system-ui, sans-serif); color: var(--black, #000); }
/* The host app's global border-box reset (Tailwind Preflight) does NOT cross the shadow
   boundary, so the shadow defaults to content-box. Scope border-box to the SCAFFOLD only
   (stage / inner / preview-root) — exactly like the render border-boxes its padded
   containers (.mc-page) and NOT components — so a content-box component still matches the
   MP4 while the padded scaffold sizes predictably. */
.mc-stage, .mc-stage-inner, .mc-preview-root { box-sizing: border-box; }
.mc-stage { width: 100%; overflow: hidden; background: #fafafa; }
.mc-stage--frame { position: relative; aspect-ratio: 16 / 9; }
/* Stays literal 1920x1080 + transform:scale (below), NOT the render document's
   viewport-derived root font-size: this mounts into the HOST (WebUI) document, and rem
   resolves against document.documentElement even across a shadow boundary — so a global
   html font-size rule here would leak into the WebUI's own rem layout. We rely on the
   host's 16px root instead. Do NOT set document.documentElement.style.fontSize here. */
.mc-stage--frame .mc-stage-inner { position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; transform-origin: top left; }
.mc-stage--frame .mc-stage-inner > * { position: absolute; inset: 0; }
/* Component/decoration previews render at their natural rem size inside a wide canvas
   (64rem — wider than any component, so text like the card body stays one line), then
   scale() FITS each element to its own box: scaled down to fill ~85% when it's bigger than
   the box, but never enlarged past natural size — so every component sits comfortably in its
   frame (small ones near natural, big ones scaled to fit), the way they did before. The
   canvas is centred in the (square) box; scale() transforms the preview-root around center. */
.mc-stage--comp { position: relative; overflow: hidden; aspect-ratio: 1 / 1; }
.mc-stage--comp .mc-stage-inner { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 64rem; height: 42rem; }
/* One gap spaces the cells of a display:contents fragment (the ledger Row) that flow straight
   into this centred flex; a single-box component has one child, so the gap is a no-op there. */
${frame ? "" : ".mc-stage--comp .mc-stage-inner > * { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 1.75rem; transform-origin: center; }"}
`;

// Fraction of the preview box a fitted component fills (when it's larger than the box).
const COMP_FILL = 0.85;

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
  const ctx = rootContext(compId, theme, { mode: "showcase" });
  const built = buildPreview(instance, ctx);
  const css = built.css;
  const anims = built.anims;
  const html = opts.ground
    ? built.html.replace(
        /background:\s*var\(--[a-z]+\)/,
        `background: var(--${opts.ground})`,
      )
    : built.html;

  const shadow =
    container.shadowRoot ?? container.attachShadow({ mode: "open" });
  shadow.replaceChildren();
  const style = document.createElement("style");
  // theme `:root` tokens → `:host` (isolated, inherited by shadow content) + preview CSS.
  style.textContent = `${theme.css.replace(/:root/g, ":host")}\n${previewCss(frame)}\n${css}`;
  shadow.appendChild(style);

  const stage = document.createElement("div");
  stage.className = frame
    ? "mc-stage mc-stage--frame"
    : "mc-stage mc-stage--comp";
  const inner = document.createElement("div");
  inner.className = "mc-stage-inner";
  inner.innerHTML = html;
  stage.appendChild(inner);
  shadow.appendChild(stage);

  const gsap = (window as unknown as { gsap?: GsapGlobal }).gsap;
  const MC = (window as unknown as { MC?: McGlobal }).MC;
  const scale = (): void => {
    if (frame) {
      // Frame: scale the 1920px scene to the stage width (unchanged).
      inner.style.transform = `scale(${stage.clientWidth / 1920})`;
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
  const HOLD = 0.5; // preview beat between the last reveal and the page exit
  // The resolved whole-scene page transition (treatments only) — replayed live below.
  const pageTx =
    instance.kind === "treatment"
      ? (instance as TreatmentInstance).pageTransition()
      : null;
  const settle = (): void => {
    if (!gsap || !MC) return;
    const timeline = (tl = gsap.timeline({ paused: true }));
    MC.applyAnims(timeline, anims, MC.showcaseCtx(inner));
    // Replay the whole-PAGE transition the render emits (buildScene's entranceJs /
    // exitJs): page IN over the reveals at t=0, page OUT after a hold. buildNode omits
    // these (the render adds them separately), so the preview reconstructs them here
    // from the pageInFor / pageOutFor data — otherwise the OUT is never visible.
    let holdAt = timeline.duration();
    if (pageTx && (pageTx.animIn || pageTx.animOut)) {
      const pageEl =
        (inner.querySelector(`.${compId}-root`) as Element | null) ?? inner;
      const play = (
        spec: PageSpec | null,
        at: number,
        durSec: number,
      ): void => {
        if (!spec) return;
        const fn = (MC as unknown as Record<string, PageFactory>)[spec.fn];
        if (fn) fn(timeline, pageEl, at, { dur: durSec, ...spec.opts });
      };
      if (pageTx.animIn && pageTx.animIn !== "none")
        play(
          pageInFor(pageTx.animIn),
          0,
          TIMING_SECONDS[pageTx.timeIn ?? "short"],
        );
      holdAt = timeline.duration(); // the composed frame: after reveals + page-in settle
      if (pageTx.animOut && pageTx.animOut !== "none") {
        play(
          pageOutFor(pageTx.animOut),
          holdAt + HOLD,
          TIMING_SECONDS[pageTx.timeOut ?? "short"],
        );
        timeline.eventCallback("onComplete", () => tl?.time(holdAt).pause()); // rest revealed, not faded-out
      }
    }
    timeline.time(holdAt).pause(); // settle to the composed frame so content is visible at rest
  };

  // Settle + scale after the shadow is attached + laid out (gsap needs real layout).
  // Settle FIRST so any count-up text is at its final (widest) value before we measure
  // the content to fit-scale it — otherwise a stat sized on "0" would over-scale.
  requestAnimationFrame(() => {
    settle();
    scale();
  });
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
    replay: () => tl?.restart(),
    destroy: () => {
      ro?.disconnect();
      tl?.kill();
      shadow.replaceChildren();
    },
  };
};
