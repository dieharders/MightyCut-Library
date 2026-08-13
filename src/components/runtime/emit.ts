// Emit bridge: turn a treatment instance into a finished sub-composition HTML
// document via the shared wrapSubComposition contract. This is the single seam
// where the component system meets the render pipeline; the storyboard ground
// override is applied here (falling back to the treatment's canonical ground).
import { serialize } from "../../pipeline/mini-dom";
import { wrapSubComposition } from "../../pipeline/sub-composition";
import type { FrameGround } from "../../types/storyboard";
import { groundStyle, scopeCss, swapGround } from "./css";
import { mergeStyle } from "./dom";
import { groundFor, previewGround } from "./treatment";
import type { AnimDescriptor, BuildContext, ComponentInstance, SubComposition, TreatmentInstance } from "./types";

export type SceneOverrides = {
  /** Storyboard ground override (else the treatment's canonical ground). */
  ground?: FrameGround;
  /** Storyboard backdrop-mask override (else the theme's canonical backdrop). */
  backdrop?: string;
};

/** Build a scene's SubComposition parts, applying optional ground / backdrop overrides. */
export const buildScene = (
  treatment: TreatmentInstance,
  ctx: BuildContext,
  overrides?: SceneOverrides,
): SubComposition => {
  // The backdrop + ground overrides ride the ctx so treatment.buildNode resolves them
  // (the mask's input needs the RESOLVED ground). The ground ALSO gets a post-build
  // pageStyle swap below, since the visible background is stamped as inline style.
  const sceneCtx: BuildContext =
    overrides?.backdrop || overrides?.ground
      ? {
          ...ctx,
          ...(overrides.backdrop ? { backdrop: overrides.backdrop } : {}),
          ...(overrides.ground ? { ground: overrides.ground } : {}),
        }
      : ctx;
  const parts = treatment.buildScene(sceneCtx);
  if (overrides?.ground) {
    // buildScene stamps `background: var(--<canonicalGround>)` last; re-point it. The
    // swap itself lives in runtime/css.ts because engine/mount.ts runs the same one over
    // the browser-preview html — one definition, both sides of the seam.
    parts.pageStyle = swapGround(parts.pageStyle ?? "", overrides.ground);
  }
  return parts;
};

/**
 * Render a scene to a complete sub-composition HTML document.
 *
 * The ctx's canvas is stamped onto the parts here rather than inside `buildScene`: a
 * treatment builds CONTENT and has no business knowing the frame it lands in, while this
 * is already the single seam where the component system meets the render pipeline. An
 * unset ctx.canvas leaves `parts.canvas` undefined, so wrapSubComposition falls back to
 * DESIGN_CANVAS and the emitted bytes are unchanged.
 */
export const renderScene = (
  treatment: TreatmentInstance,
  ctx: BuildContext,
  overrides?: SceneOverrides,
): string => wrapSubComposition({ ...buildScene(treatment, ctx, overrides), canvas: ctx.canvas });

export type Preview = { html: string; css: string; anims: AnimDescriptor[] };

/**
 * Build a self-contained preview of a component or treatment for the interactive
 * showcase: scoped HTML wrapped in a `.<compId>-root` (matching the sub-comp
 * envelope), the scoped CSS, and the anim descriptors to drive on hover. A
 * treatment carries its ground background; a component renders bare.
 */
export const buildPreview = (inst: ComponentInstance | TreatmentInstance, ctx: BuildContext): Preview => {
  const bn = inst.buildNode(ctx);
  // A treatment carries its ground as a visible BACKGROUND plus the `--ground` property that
  // exposes it to skins. A bare component gets the property ALONE: it has no frame to paint and
  // no canonical ground, but the skins that occlude (the cluster hub and its pucks) still have
  // to mix into something, and reading `--ground` off a page root that does not exist left them
  // on a per-theme fallback while the editor's ground picker appeared to do nothing.
  // `mergeStyle` rather than a hand-rolled concat — the trailing-semicolon and empty-style cases
  // are stated once, in runtime/dom.ts.
  mergeStyle(
    bn.node,
    inst.kind === "treatment"
      ? groundStyle(groundFor(ctx, (inst as TreatmentInstance).ground))
      : `--ground: var(--${previewGround(ctx)})`,
  );
  return {
    html: `<div class="${ctx.compId}-root">${serialize(bn.node)}</div>`,
    css: scopeCss(bn.css, ctx.compId),
    anims: bn.anims,
  };
};
