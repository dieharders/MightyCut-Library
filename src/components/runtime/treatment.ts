// treatment(def) — a whole-slide archetype composed from child components.
// A treatment is a container "trio": template.html with a data-children region +
// its own data-slots (headline, caption, …), a scoped .css, a Zod schema, a
// canonical ground, defaultChildren (used when none are added), a responsive
// layout (childCount → CSS custom properties), and a default anim.
//
//   StatGrid().addChildren(Stat(), Stat(), Stat())   // literal composition
//   StatGrid()                                        // defaultChildren(params)
//
// buildScene(ctx) turns the composed frame into SubComposition parts for
// wrapSubComposition: the treatment root becomes the page wrapper (its classes +
// the ground background), its inner markup becomes bodyHtml, all collected CSS is
// scoped under the scene root, and all anims serialize to one MC.applyAnims call.
import { z } from "zod";
import { serialize } from "../../pipeline/mini-dom";
import { buildBackdrop } from "../primitives/backdrops";
import type { FrameGround } from "../../types/storyboard";
import type { TimingPreset, TransitionName, TransitionSpec } from "../../types/transitions";
import { type AnimDescriptor, qualifyAnim, serializeAnims, toSlot } from "./anim";
import { collectCss, scopeCss } from "./css";
import { scrubDeterminism } from "./determinism";
import { DEFAULT_ENTRANCE, sceneEntranceJs, sceneExitJs } from "./transitions";
import {
  childrenContainer,
  fillSlots,
  mergeStyle,
  pruneRemoved,
  rootElement,
  stampAnims,
  stripAnnotations,
  styleProps,
} from "./dom";
import type {
  BuildContext,
  BuildNode,
  BuildResult,
  ComponentInstance,
  SubComposition,
  TreatmentFactory,
  TreatmentInstance,
} from "./types";

export type TreatmentDef<S extends z.ZodTypeAny> = {
  name: string;
  schema: S;
  /** Frame markup: own data-slots + one data-children container + own data-anim. */
  template: string;
  css: string;
  /** Canonical full-bleed ground (a storyboard override can replace it at scene time). */
  ground: FrameGround;
  example: z.input<S>;
  /** The leaf component this treatment repeats as its children (stat-grid→stat, …).
   *  Formalizes the CLI/agent/spec-map child relationship + drives the showcase child editor. */
  childComponent?: string;
  /** Children used when the caller adds none (default deck build + showcase). */
  defaultChildren: (p: z.infer<S>) => ComponentInstance[];
  /** Decoration components rendered when the caller adds none (e.g. cover's star
   *  + tilt-rect). A caller's addDecorations() overrides these entirely. */
  defaultDecorations?: (p: z.infer<S>) => ComponentInstance[];
  /** Own slot fills (headline, caption, …). */
  fill?: (p: z.infer<S>) => Record<string, string | null | undefined>;
  /** Responsive layout: CSS custom properties from the child count. */
  layout?: (childCount: number, p: z.infer<S>) => Record<string, string>;
  /** Own animations (e.g. the headline reveal). */
  anim?: (p: z.infer<S>, childCount: number) => AnimDescriptor[];
  /** Seconds between consecutive cascade slots (decorations → title → child → child …).
   *  Default 0.5. The runtime tightens it by the slide's caption count; a UI knob may
   *  override it later. Each element still performs its own entrance + internal timing. */
  revealDelay?: number;
  /** Whole-scene page IN transition (catalog name). Unset ⇒ the legacy DEFAULT_ENTRANCE. */
  animIn?: TransitionName;
  /** Whole-scene page OUT transition (catalog name). Unset/`none` ⇒ no exit (hard cut). */
  animOut?: TransitionName;
  /** IN duration preset (short/medium/long). Default short when animIn is set. */
  timeIn?: TimingPreset;
  /** OUT duration preset (short/medium/long). Default short when animOut is set. */
  timeOut?: TimingPreset;
  /** Page entrance tween statement; `page` is in scope. Default: a soft fade. */
  entrance?: string;
};

export function treatment<S extends z.ZodTypeAny>(def: TreatmentDef<S>): TreatmentFactory<S> {
  const delay = def.revealDelay ?? 0.5;
  let cachedJson: object | null = null;
  const jsonSchema = (): object => (cachedJson ??= z.toJSONSchema(def.schema, { io: "input" }) as object);
  // Explicit params validated exactly (fail-loud); no-arg falls back to the example.
  const parse = (raw?: Partial<z.input<S>>): z.infer<S> =>
    def.schema.parse(raw === undefined ? def.example : raw);

  const factory = ((raw?: Partial<z.input<S>>): TreatmentInstance => {
    let added: ComponentInstance[] | null = null;
    let addedDecorations: ComponentInstance[] | null = null;
    let animOverride: AnimDescriptor[] | null = null;
    let transitionOverride: TransitionSpec | null = null;

    const instance: TreatmentInstance = {
      name: def.name,
      kind: "treatment",
      ground: def.ground,
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
      addChildren(...children: ComponentInstance[]) {
        added = [...(added ?? []), ...children];
        return this;
      },
      addDecorations(...decorations: ComponentInstance[]) {
        addedDecorations = [...(addedDecorations ?? []), ...decorations];
        return this;
      },
      buildNode(ctx: BuildContext): BuildNode {
        const p = parse(raw);
        const root = rootElement(def.template);
        if (def.fill) fillSlots(root, def.fill(p));
        pruneRemoved(root);
        stampAnims(root, ctx.idPrefix); // own data-anim (headline, …)

        const children = added ?? def.defaultChildren(p);
        const container = childrenContainer(root);
        if (!container && children.length > 0) {
          throw new Error(`treatment '${def.name}': template has no data-children container`);
        }

        const cssParts: { name: string; css: string }[] = [];
        if (ctx.theme.frameCss) cssParts.push({ name: `@frame:${ctx.theme.name}`, css: ctx.theme.frameCss });
        cssParts.push({ name: def.name, css: def.css });

        // Ordered cascade slots: decorations first, then the title, then each child in turn.
        // Decorations can be added to ANY treatment, so their count shifts the title/child slots.
        // The per-slot delay is resolved at runtime (MC.applyAnims) from the slide's caption
        // count — NOT from VO-line keying — so the cascade is identical in the showcase, the
        // preview, and the render, and never collapses onto a single narration line.
        const decorations = addedDecorations ?? (def.defaultDecorations ? def.defaultDecorations(p) : []);
        const titleSlot = decorations.length; // decos own slots 0..titleSlot-1
        // Framing own-anims keyed to `leadIn` (an eyebrow pill, a backing card) take the title
        // slot; the title itself (a `line-0` reveal) then falls to the NEXT beat, so it doesn't
        // pop simultaneously with its own frame. Only childless treatments (quote/cover/closing)
        // carry leadIn own-anims, so child-bearing treatments are unaffected (titleOffset 0).
        const ownAnimsRaw = animOverride ?? (def.anim ? def.anim(p, children.length) : []);
        const titleOffset = ownAnimsRaw.some((a) => a.time.at === "leadIn") ? 1 : 0;
        const childBase = titleSlot + titleOffset + 1; // children follow the frame + title

        // Children — each child occupies ONE cascade slot; all of its anims ride that slot,
        // each keeping its own internal `plus` so the child owns its entrance + internal timing.
        const childAnims: AnimDescriptor[] = [];
        if (container) {
          container.children = [];
          children.forEach((child, i) => {
            const childCtx: BuildContext = { ...ctx, idPrefix: `${ctx.compId}__c${i}` };
            const bn = child.buildNode(childCtx);
            container.children.push(bn.node);
            cssParts.push({ name: child.name, css: bn.css });
            for (const a of bn.anims) childAnims.push(toSlot(a, childBase + i, delay));
          });
        }

        // Decorations: positioned shapes appended as siblings of .body on the page root; their
        // own z-index (from `layer`) puts each behind or over the content. Revealed FIRST
        // (slots 0..N-1) so they stagger in before the title. addDecorations() overrides.
        const decoAnims: AnimDescriptor[] = [];
        decorations.forEach((deco, i) => {
          const decoCtx: BuildContext = { ...ctx, idPrefix: `${ctx.compId}__d${i}` };
          const bn = deco.buildNode(decoCtx);
          root.children.push(bn.node);
          cssParts.push({ name: deco.name, css: bn.css });
          for (const a of bn.anims) decoAnims.push(toSlot(a, i, delay));
        });

        // Backdrop: the theme's canonical mask (scene override → theme default → "plain"),
        // a full-bleed overlay unshifted to the FRONT of the page root so it paints first;
        // its own z-index 0 layers it above the ground colour and below back-decorations.
        // Its anims (empty for static masks) are absolute-timed — NOT run through toSlot.
        // Resolve the effective ground (scene override → treatment canonical) so a
        // ground-tinted mask recolours against what the scene actually paints.
        const backdropName = ctx.backdrop ?? ctx.theme.backdrop ?? "plain";
        const backdrop = buildBackdrop(backdropName, { ground: ctx.ground ?? def.ground, theme: ctx.theme, ctx });
        const backdropAnims: AnimDescriptor[] = [];
        if (backdrop) {
          root.children.unshift(backdrop.node);
          cssParts.push({ name: `backdrop:${backdropName}`, css: backdrop.css });
          for (const a of backdrop.anims) backdropAnims.push(a);
        }

        if (def.layout) mergeStyle(root, styleProps(def.layout(children.length, p)));
        stripAnnotations(root);

        // Own anims → cascade slots by their declared time: a `leadIn` frame rides the title slot;
        // the title (`line-0`) and its `index-n` secondaries fall AFTER that frame (titleOffset);
        // a `line-n≥1` caption lands just after the last child. Each keeps its internal offset.
        const captionSlot = childBase + children.length;
        const ownAnims = ownAnimsRaw.map((a) => {
          const slot =
            a.time.at === "leadIn"
              ? titleSlot
              : a.time.at === "line" && a.time.n >= 1
                ? captionSlot
                : a.time.at === "index"
                  ? titleSlot + titleOffset + a.time.n
                  : titleSlot + titleOffset;
          return toSlot(qualifyAnim(a, ctx.idPrefix), slot, delay);
        });
        return {
          node: root,
          css: collectCss(cssParts),
          anims: [...backdropAnims, ...ownAnims, ...childAnims, ...decoAnims],
        };
      },
      build(ctx): BuildResult {
        const bn = this.buildNode(ctx);
        return { html: serialize(bn.node), css: bn.css, anims: bn.anims };
      },
      pageTransition(): TransitionSpec {
        // Caller override wins over the treatment's own defaults, field by field.
        const t = transitionOverride ?? {};
        return {
          animIn: t.animIn ?? def.animIn,
          animOut: t.animOut ?? def.animOut,
          timeIn: t.timeIn ?? def.timeIn,
          timeOut: t.timeOut ?? def.timeOut,
        };
      },
      buildScene(ctx: BuildContext): SubComposition {
        const bn = this.buildNode(ctx);
        const root = bn.node;
        const pageClasses = root.attrs.class ?? def.name;
        const ownStyle = (root.attrs.style ?? "").trim().replace(/;\s*$/, "");
        const ground = `background: var(--${def.ground})`;
        const pageStyle = ownStyle ? `${ownStyle}; ${ground}` : ground;
        const bodyJs = serializeAnims(bn.anims);
        // Whole-page transition: an assigned animIn/animOut wins over the legacy
        // def.entrance; unset ⇒ the byte-identical DEFAULT_ENTRANCE + no exit.
        const { animIn, animOut, timeIn, timeOut } = this.pageTransition();
        const entranceJs =
          animIn && animIn !== "none" ? sceneEntranceJs(animIn, timeIn) : (def.entrance ?? DEFAULT_ENTRANCE);
        const exitJs = animOut && animOut !== "none" ? sceneExitJs(animOut, timeIn, timeOut) : "";
        scrubDeterminism(`${entranceJs}\n${bodyJs}\n${exitJs}`, def.name);
        return {
          compId: ctx.compId,
          voIds: ctx.voIds ?? [],
          pageClasses,
          pageStyle,
          bodyHtml: `\n          ${serialize(root.children)}`,
          bodyCss: `\n${scopeCss(bn.css, ctx.compId)}`,
          entranceJs,
          exitJs,
          bodyJs,
        };
      },
    };
    return instance;
  }) as TreatmentFactory<S>;

  return Object.assign(factory, {
    treatmentName: def.name,
    kind: "treatment" as const,
    schema: def.schema,
    childComponent: def.childComponent,
    jsonSchema,
    defaults: () => def.schema.parse(def.example),
  });
}
