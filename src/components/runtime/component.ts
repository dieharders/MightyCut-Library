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
import { type AnimDescriptor, isRevealKind, qualifyAnim } from "./anim";
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
  /** SHARED CSS authored under `.${name}` (rem on the 0.125rem grid, flat rules — see css.ts),
   *  emitted BEFORE the active theme's skin (`theme.skins[name]`) rather than instead of it.
   *
   *  Most components omit it: their look is entirely theme-specific, every theme ships a skin
   *  for the standard class names, and an unskinned element renders unstyled. It exists for the
   *  case where part of an element is NOT the theme's to decide — the HUD's geometry, which is
   *  the band that `--safe-top` reserves for sight-unseen, so a skin may only paint inside it
   *  (primitives/hud/geometry.css).
   *
   *  This used to be an either/or (`skin ?? css`), which made "shared structure plus per-theme
   *  paint" inexpressible and is why the HUD geometry was hand-concatenated onto `skins.hud` in
   *  all six theme.ts files instead. Joining costs nothing for a component that declares none. */
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
  /** Positioned page-space decoration flourish (starburst, node, …). Intrinsic, not
   *  per-theme: a decoration is held out of the showcase Components grid under every
   *  theme, so one theme's decorations never leak into another's grid. Set by the
   *  decorationComponent / futureDecorationComponent helpers. */
  decoration?: boolean;
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
      params: () => parse(raw),
      // Merged over the params as WRITTEN rather than over `parse(raw)`, so a no-arg instance
      // keeps falling back to the example for everything the patch does not name and a written
      // one keeps its own omissions omitted. The result is re-parsed by buildNode like any other
      // params, so a patch the schema refuses throws there rather than rendering.
      withParams(patch) {
        raw = { ...((raw ?? def.example) as Partial<z.input<S>>), ...patch } as Partial<z.input<S>>;
        return this;
      },
      withAnim(anims) {
        animOverride = anims;
        return this;
      },
      withTransition(t) {
        transitionOverride = t;
        return this;
      },
      // The params AS WRITTEN, not `parse(raw)` — a no-arg instance must keep falling back to
      // the example and a written one keep its own omissions omitted, exactly as `withParams`
      // preserves them, so a copy and its original build byte-identically. See
      // `ComponentInstance.clone` for why the treatment runtime needs one.
      clone(): ComponentInstance {
        const copy = factory(raw);
        if (animOverride) copy.withAnim(animOverride);
        if (transitionOverride) copy.withTransition(transitionOverride);
        return copy;
      },
      buildNode(ctx: BuildContext): BuildNode {
        const p = parse(raw); // fail loud on bad params
        // A theme may override this element's structure (theme.templates[name]) — kept
        // in lockstep with the CSS skin seam below; the override must preserve the shared
        // marker vocabulary so fill/anim/layout still resolve. Else the element's template.
        const root = rootElement(ctx.theme.templates?.[def.name] ?? def.template);
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
        // ONE reveal per box. An internal REVEAL aimed at the SAME target as the
        // whole-element entrance is NOT additive: both compile to a `tl.from()` on the
        // same element, and GSAP's immediateRender makes the second tween sample the
        // first's from-state (opacity 0) as its END value — so the element reveals and
        // then vanishes for good (the ledger Row + any picked transition: the entrance
        // and rowAnim's staggerIn both drive `item`). The chosen entrance wins.
        //
        // Only a same-target REVEAL is dropped (see `REVEAL_KINDS`), matching the runtime
        // guard in mc.js exactly: a `rule`/`float`/`countUp` on the element's own root is a
        // to/fromTo tween and `growBar` a from on scale alone, so they stack on a reveal
        // legitimately and must survive an author picking a transition. Internal reveals on
        // SUB-parts (stat's number, bar's col/value) are a different target and untouched.
        const local = entrance
          ? [
              entrance,
              ...internals.filter((a) => !(a.target === entrance.target && isRevealKind(a.kind))),
            ]
          : internals;
        const anims = local.map((a) => qualifyAnim(a, ctx.idPrefix));
        // Shared css first, then the active theme's skin for this component name — a JOIN, not
        // an either/or, so an element can own the part that is not the theme's to decide and let
        // the theme paint the rest (see `ComponentDef.css`). Skin second means it wins on any
        // shared property at equal specificity, which is the direction a skin needs.
        const css = [def.css, ctx.theme.skins?.[def.name]].filter(Boolean).join("\n");
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
    decoration: def.decoration,
    jsonSchema,
    defaults: () => def.schema.parse(def.example),
  });
}
