// component(def) — the standard build function for a reusable leaf element.
// A component is authored as a "trio": template.html (flat, viewable) + a scoped
// .css + a Zod schema, plus an optional fill (params → slot text), default anim,
// and layout (params → CSS custom properties for responsiveness). build(ctx) is
// PURE and deterministic: it clones the template, fills slots, stamps anim
// markers, applies layout, and returns { html, css, anims }. The SAME function
// renders the slide at build time and the card in the interactive showcase.
import { z } from "zod";
import { serialize } from "../../pipeline/mini-dom";
import { TIMING_SECONDS, type ComponentTransition, type TimingPreset, type TransitionName } from "../../types/transitions";
import { type AnimDescriptor, qualifyAnim } from "./anim";
import { elementIn } from "./transitions";
import {
  fillRaw,
  fillSlots,
  mergeStyle,
  pruneRemoved,
  rootElement,
  stampAnims,
  stripAnnotations,
  styleProps,
} from "./dom";
import type { BuildContext, BuildNode, BuildResult, ComponentFactory, ComponentInstance } from "./types";

export type ComponentDef<S extends z.ZodTypeAny> = {
  name: string;
  schema: S;
  /** Flat HTML; root carries `.${name}`; data-slot / data-anim annotations. */
  template: string;
  /** CSS authored under `.${name}` (rem units on the fixed 16px root, flat rules).
   *  Optional: a theme may instead OWN this component's skin via `theme.skins[name]`,
   *  which `buildNode` prefers. Components whose look is theme-specific (hud, caption)
   *  omit this and let each theme style the standard class names from its own folder. */
  css?: string;
  /** Example params — drives the showcase card + `defaults()` + tests. */
  example: z.input<S>;
  /** Map validated params → slot text (null/"" drops the optional slot). */
  fill?: (p: z.infer<S>) => Record<string, string | null | undefined>;
  /** Map validated params → RAW HTML injected UNESCAPED into a data-html element
   *  (null/"" drops it). For inline-SVG / markup slots the escaped fill can't carry. */
  rawFill?: (p: z.infer<S>) => Record<string, string | null | undefined>;
  /** Internal-reveal animations (targets are the template's data-anim ids). The
   *  whole-element ENTRANCE is separate — see `animIn` below. */
  anim?: (p: z.infer<S>) => AnimDescriptor[];
  /** Whole-element entrance transition (catalog name); unset ⇒ no entrance prepended. */
  animIn?: TransitionName;
  /** Opts baked into the default entrance (e.g. `{ dist: 26 }`) so it reproduces the
   *  element's pre-transition descriptor byte-for-byte. Applied only to the DEFAULT animIn. */
  animInOpts?: Record<string, number | string | boolean>;
  /** The root data-anim id the entrance targets (default "item"). */
  animTarget?: string;
  /** Default entrance duration preset (short/medium/long). Unset ⇒ the MC factory default. */
  timeIn?: TimingPreset;
  /** CSS custom properties set on the root for responsive layout. */
  layout?: (p: z.infer<S>) => Record<string, string>;
  /** Full-frame composite (e.g. `hud`): the showcase renders it in a 1920×1080
   *  frame slot rather than the natural-size component slot. Purely presentational. */
  frame?: boolean;
};

export function component<S extends z.ZodTypeAny>(def: ComponentDef<S>): ComponentFactory<S> {
  let cachedJson: object | null = null;
  const jsonSchema = (): object => (cachedJson ??= z.toJSONSchema(def.schema, { io: "input" }) as object);
  // Explicit params are validated EXACTLY (fail-loud on a missing required field);
  // only a no-arg call falls back to the example. This keeps a tool/agent build
  // from silently inheriting example content for an omitted field.
  const parse = (raw?: Partial<z.input<S>>): z.infer<S> =>
    def.schema.parse(raw === undefined ? def.example : raw);

  const factory = ((raw?: Partial<z.input<S>>): ComponentInstance => {
    let animOverride: AnimDescriptor[] | null = null;
    let transitionOverride: ComponentTransition | null = null;

    const instance: ComponentInstance = {
      name: def.name,
      kind: "component",
      jsonSchema,
      defaults: () => def.schema.parse(def.example),
      withAnim(anims) {
        animOverride = anims;
        return this;
      },
      withTransition(t) {
        transitionOverride = t;
        return this;
      },
      buildNode(ctx: BuildContext): BuildNode {
        const p = parse(raw); // fail loud on bad params
        const root = rootElement(def.template);
        if (def.fill) fillSlots(root, def.fill(p));
        if (def.rawFill) fillRaw(root, def.rawFill(p));
        pruneRemoved(root);
        stampAnims(root, ctx.idPrefix);
        if (def.layout) mergeStyle(root, styleProps(def.layout(p)));
        stripAnnotations(root);
        // The whole-element entrance is the named transition, PREPENDED before the
        // element's internal reveals. Unset ⇒ nothing prepended (default = today's bytes).
        const internals = animOverride ?? (def.anim ? def.anim(p) : []);
        const useDefault = !transitionOverride?.animIn;
        const inName = transitionOverride?.animIn ?? def.animIn;
        const inTime = transitionOverride?.timeIn ?? def.timeIn;
        const entrance =
          inName && inName !== "none"
            ? elementIn(
                inName,
                def.animTarget ?? "item",
                inTime ? TIMING_SECONDS[inTime] : undefined,
                useDefault ? def.animInOpts : undefined,
              )
            : null;
        const local = entrance ? [entrance, ...internals] : internals;
        const anims = local.map((a) => qualifyAnim(a, ctx.idPrefix));
        // The skin is theme-owned when the active theme supplies one for this
        // component name (theme.skins[name]); else the component's own css; else none.
        const css = ctx.theme.skins?.[def.name] ?? def.css ?? "";
        return { node: root, css, anims };
      },
      build(ctx): BuildResult {
        const bn = this.buildNode(ctx);
        return { html: serialize(bn.node), css: bn.css, anims: bn.anims };
      },
    };
    return instance;
  }) as ComponentFactory<S>;

  return Object.assign(factory, {
    componentName: def.name,
    kind: "component" as const,
    schema: def.schema,
    frame: def.frame,
    jsonSchema,
    defaults: () => def.schema.parse(def.example),
  });
}
