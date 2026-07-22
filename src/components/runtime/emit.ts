// Emit bridge: turn a treatment instance into a finished sub-composition HTML
// document via the shared wrapSubComposition contract. This is the single seam
// where the component system meets the render pipeline; the storyboard ground
// override is applied here (falling back to the treatment's canonical ground).
import { serialize } from "../../pipeline/mini-dom";
import { wrapSubComposition } from "../../pipeline/sub-composition";
import type { FrameGround } from "../../types/storyboard";
import { scopeCss } from "./css";
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
    // buildScene stamps `background: var(--<canonicalGround>)` last; replace it.
    parts.pageStyle = (parts.pageStyle ?? "").replace(
      /background:\s*var\(--[a-z]+\)/,
      `background: var(--${overrides.ground})`,
    );
  }
  return parts;
};

/** Render a scene to a complete sub-composition HTML document. */
export const renderScene = (
  treatment: TreatmentInstance,
  ctx: BuildContext,
  overrides?: SceneOverrides,
): string => wrapSubComposition(buildScene(treatment, ctx, overrides));

export type Preview = { html: string; css: string; anims: AnimDescriptor[] };

/**
 * Build a self-contained preview of a component or treatment for the interactive
 * showcase: scoped HTML wrapped in a `.<compId>-root` (matching the sub-comp
 * envelope), the scoped CSS, and the anim descriptors to drive on hover. A
 * treatment carries its ground background; a component renders bare.
 */
export const buildPreview = (inst: ComponentInstance | TreatmentInstance, ctx: BuildContext): Preview => {
  const bn = inst.buildNode(ctx);
  if (inst.kind === "treatment") {
    const own = (bn.node.attrs.style ?? "").trim().replace(/;\s*$/, "");
    const ground = `background: var(--${(inst as TreatmentInstance).ground})`;
    bn.node.attrs.style = own ? `${own}; ${ground}` : ground;
  }
  return {
    html: `<div class="${ctx.compId}-root">${serialize(bn.node)}</div>`,
    css: scopeCss(bn.css, ctx.compId),
    anims: bn.anims,
  };
};
