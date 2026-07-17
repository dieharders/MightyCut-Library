// mountPreview — render one component/treatment instance into a container and
// drive its animation on a paused GSAP timeline via the SAME MC.applyAnims
// interpreter the render pipeline uses (so the preview is WYSIWYG with the final
// video). Settles to the end state at rest; `replay()` restarts the entrance.
import { buildPreview } from "../components/runtime/emit";
import { rootContext } from "../components/runtime";
import type { ComponentInstance, ThemeTokens, TreatmentInstance } from "../components/runtime/types";
import { bootstrapFx } from "./fx";

type Timeline = {
  restart: () => void;
  progress: (p: number) => Timeline;
  pause: () => Timeline;
  kill: () => void;
};
type McGlobal = {
  applyAnims: (tl: unknown, anims: unknown, ctx: unknown) => void;
  showcaseCtx: (root: Element) => unknown;
};
type GsapGlobal = { timeline: (o?: { paused?: boolean }) => Timeline };

export type PreviewHandle = {
  /** The rendered subtree root (scoped `.<compId>-root`). */
  root: HTMLElement;
  /** Restart the entrance animation. */
  replay: () => void;
  /** Remove the preview + its scoped style from the DOM. */
  destroy: () => void;
};

export type MountOptions = {
  /** Scene id → CSS scope + marker prefix (default `mc-preview`). */
  compId?: string;
};

/** Mount a built instance into `container`, returning a replay/destroy handle. */
export const mountPreview = (
  container: HTMLElement,
  instance: ComponentInstance | TreatmentInstance,
  theme: ThemeTokens,
  opts: MountOptions = {},
): PreviewHandle => {
  bootstrapFx();
  const compId = opts.compId ?? "mc-preview";
  const ctx = rootContext(compId, theme, { mode: "showcase" });
  const { html, css, anims } = buildPreview(instance, ctx);

  const style = document.createElement("style");
  style.textContent = css;
  const holder = document.createElement("div");
  holder.innerHTML = html;
  const root = (holder.firstElementChild as HTMLElement) ?? holder;
  container.append(style, root);

  const gsap = (window as unknown as { gsap?: GsapGlobal }).gsap;
  const MC = (window as unknown as { MC?: McGlobal }).MC;
  let tl: Timeline | null = null;
  if (gsap && MC) {
    const build = (): Timeline => {
      const t = gsap.timeline({ paused: true });
      MC.applyAnims(t, anims, MC.showcaseCtx(root));
      return t;
    };
    tl = build();
    tl.progress(1).pause(); // settle to the end state so content is visible at rest
  }

  return {
    root,
    replay: () => tl?.restart(),
    destroy: () => {
      tl?.kill();
      style.remove();
      root.remove();
    },
  };
};
