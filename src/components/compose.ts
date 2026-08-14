// Shared compose core — the single build-from-params entry used by BOTH the CLI
// (bun cli build …) and the Pi agent tools (build_slide / build_component /
// build_treatment). Validation is fail-loud: a bad param throws a formatted Zod
// issue summary (the same "- path: message" shape generate-content feeds back to
// the model), so the agent self-corrects and the CLI prints a clear error.
import { z } from "zod";
import { issuesSummary } from "../util/issues";
import type { CanvasSize } from "../types/canvas";
import type { FrameGround } from "../types/storyboard";
import type { TimingPreset, TransitionName, TransitionSpec } from "../types/transitions";
import { AnimDescriptorSchema, type AnimDescriptor } from "./runtime/anim";
import { rootContext } from "./runtime";
import { renderScene } from "./runtime/emit";
import { getComponent, getTreatment } from "./runtime/registry";
import type { ComponentInstance, ThemeTokens, TreatmentInstance } from "./runtime/types";

export type ChildSpec = {
  name: string;
  params?: Record<string, unknown>;
  /** Per-child whole-element entrance transition (catalog name). */
  animIn?: TransitionName;
  /** Per-child entrance duration preset. */
  timeIn?: TimingPreset;
};
export type SceneSpec = {
  treatment: string;
  params?: Record<string, unknown>;
  /** Override the treatment's default children with explicit component instances. */
  children?: ChildSpec[];
  /** Override the theme's default decorations for this treatment with explicit component
   *  instances. ABSENT ⇒ the theme's defaults; an EMPTY array ⇒ deliberately bare (the two
   *  are NOT the same — that distinction is how the showcase/editor expresses "no decos"). */
  decorations?: ChildSpec[];
  /** Override the treatment's default animations. */
  anim?: AnimDescriptor[];
  /** Whole-scene page transition (animIn/animOut + timing). */
  transition?: TransitionSpec;
};
export type ComposeOpts = {
  /**
   * REQUIRED, and it used to default to block. That default was one `import { blockTheme }` at
   * module scope, which is enough to put the whole theme in whatever chunk imports this file —
   * and `engine/index.ts` re-exports these composers statically, so block's ~50 CSS text imports
   * landed in the browser engine's BASE chunk. Measured in dist before the change:
   * `register-block.js` was 230 bytes (a re-export of something already loaded) while the shared
   * chunk carried block's entire skin set, so a web session that only ever opened `future`
   * downloaded and parsed block anyway. The other five themes were correctly lazy — the default
   * was the only thing defeating the code-splitting `load-theme.ts` exists for.
   *
   * Required rather than lazily resolved because there is no such thing as a themeless
   * composition: every skin, ground and token in the emitted scene comes from here, and "block
   * unless you say otherwise" was never a meaningful answer for a caller rendering some other
   * theme's deck — it just failed quietly by painting the wrong one.
   */
  theme: ThemeTokens;
  voIds?: string[];
  /** Storyboard ground override (else the treatment's canonical ground). */
  ground?: FrameGround;
  /** Storyboard backdrop-mask override (else the theme's canonical backdrop). */
  backdrop?: string;
  /** The canvas the scene is composed at (sizes its host). Unset ⇒ DESIGN_CANVAS. */
  canvas?: CanvasSize;
};

/** Validate `data` against `schema`, throwing a formatted Zod-issue summary on failure. */
const validate = <T>(schema: z.ZodType<T>, data: unknown, label: string): T => {
  const r = schema.safeParse(data);
  if (!r.success) throw new Error(`${label} params invalid:\n${issuesSummary(r.error)}`);
  return r.data;
};

/** Construct a validated component instance (throws on unknown name / bad params). */
export const composeComponent = (name: string, params: Record<string, unknown> = {}): ComponentInstance => {
  const factory = getComponent(name); // throws "unknown component 'x'"
  validate(factory.schema, params, `component '${name}'`);
  return factory(params);
};

/** Construct a validated treatment instance with children + optional anim override. */
export const composeTreatment = (spec: SceneSpec): TreatmentInstance => {
  const factory = getTreatment(spec.treatment); // throws "unknown treatment 'x'"
  validate(factory.schema, spec.params ?? {}, `treatment '${spec.treatment}'`);
  const inst = factory(spec.params ?? {});
  if (spec.children?.length) {
    inst.addChildren(
      ...spec.children.map((c) => {
        const comp = composeComponent(c.name, c.params ?? {});
        if (c.animIn || c.timeIn) comp.withTransition({ animIn: c.animIn, timeIn: c.timeIn });
        return comp;
      }),
    );
    // …then the cross-child check, AFTER each child has passed its own schema — a hook reading
    // `cells.length` must not be handed a `cells` that isn't an array. It is the only validation
    // that can see the treatment's params and its children together (see TreatmentDef's
    // `childrenIssue`), and it is deliberately not run for `defaultChildren`: those come from the
    // library itself, and an instance no longer carries the params to check.
    const issue = factory.childrenIssue?.(spec.params ?? {}, spec.children);
    if (issue) throw new Error(`treatment '${spec.treatment}' children invalid:\n- ${issue}`);
  }
  // `?.length` would be wrong: an empty array MUST reach addDecorations() so it registers
  // an explicit (empty) override and the frame renders bare, rather than falling back.
  if (spec.decorations)
    inst.addDecorations(
      ...spec.decorations.map((d) => {
        const deco = composeComponent(d.name, d.params ?? {});
        if (d.animIn || d.timeIn) deco.withTransition({ animIn: d.animIn, timeIn: d.timeIn });
        return deco;
      }),
    );
  if (spec.anim) inst.withAnim(validate(z.array(AnimDescriptorSchema), spec.anim, "anim"));
  if (spec.transition) inst.withTransition(spec.transition);
  return inst;
};

/** Build a full scene sub-composition HTML from params (fail-loud). */
export const composeScene = (spec: SceneSpec, compId: string, opts: ComposeOpts): string => {
  const inst = composeTreatment(spec);
  const overrides =
    opts.ground || opts.backdrop ? { ground: opts.ground, backdrop: opts.backdrop } : undefined;
  return renderScene(
    inst,
    rootContext(compId, opts.theme, { voIds: opts.voIds, canvas: opts.canvas }),
    overrides,
  );
};

/** Build a standalone component fragment HTML (for preview / inspection). */
export const composeComponentHtml = (name: string, params: Record<string, unknown>, opts: ComposeOpts): string => {
  const inst = composeComponent(name, params);
  return inst.build(rootContext(`c-${name}`, opts.theme, { mode: "showcase" })).html;
};
