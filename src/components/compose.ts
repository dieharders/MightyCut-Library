// Shared compose core — the single build-from-params entry used by BOTH the CLI
// (bun cli build …) and the Pi agent tools (build_slide / build_component /
// build_treatment). Validation is fail-loud: a bad param throws a formatted Zod
// issue summary (the same "- path: message" shape generate-content feeds back to
// the model), so the agent self-corrects and the CLI prints a clear error.
import { z } from "zod";
import { issuesSummary } from "../util/issues";
import type { FrameGround } from "../types/storyboard";
import type { TimingPreset, TransitionName, TransitionSpec } from "../types/transitions";
import { AnimDescriptorSchema, type AnimDescriptor } from "./runtime/anim";
import { rootContext } from "./runtime";
import { renderScene } from "./runtime/emit";
import { getComponent, getTreatment } from "./runtime/registry";
import type { ComponentInstance, ThemeTokens, TreatmentInstance } from "./runtime/types";
import { blockTheme } from "./themes/block";

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
  /** Override the treatment's default decorations with explicit component instances
   *  (empty/absent ⇒ the treatment's canonical defaults). */
  decorations?: ChildSpec[];
  /** Override the treatment's default animations. */
  anim?: AnimDescriptor[];
  /** Whole-scene page transition (animIn/animOut + timing). */
  transition?: TransitionSpec;
};
export type ComposeOpts = {
  theme?: ThemeTokens;
  voIds?: string[];
  /** Storyboard ground override (else the treatment's canonical ground). */
  ground?: FrameGround;
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
  if (spec.children?.length)
    inst.addChildren(
      ...spec.children.map((c) => {
        const comp = composeComponent(c.name, c.params ?? {});
        if (c.animIn || c.timeIn) comp.withTransition({ animIn: c.animIn, timeIn: c.timeIn });
        return comp;
      }),
    );
  if (spec.decorations?.length)
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
export const composeScene = (spec: SceneSpec, compId: string, opts: ComposeOpts = {}): string => {
  const inst = composeTreatment(spec);
  return renderScene(
    inst,
    rootContext(compId, opts.theme ?? blockTheme, { voIds: opts.voIds }),
    opts.ground ? { ground: opts.ground } : undefined,
  );
};

/** Build a standalone component fragment HTML (for preview / inspection). */
export const composeComponentHtml = (name: string, params: Record<string, unknown> = {}, opts: ComposeOpts = {}): string => {
  const inst = composeComponent(name, params);
  return inst.build(rootContext(`c-${name}`, opts.theme ?? blockTheme, { mode: "showcase" })).html;
};
