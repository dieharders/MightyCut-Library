// treatment(def) — a whole-slide archetype composed from child components.
// A treatment is a container "trio": template.html with a data-children region +
// its own data-slots (headline, caption, …), a scoped .css, a Zod schema, a
// canonical ground, defaultChildren (used when none are added), a responsive
// layout (childCount → CSS custom properties), and a default anim.
//
//   Stats().addChildren(Stat(), Stat(), Stat())   // literal composition
//   Stats()                                        // defaultChildren(params)
//
// buildScene(ctx) turns the composed frame into SubComposition parts for
// wrapSubComposition: the treatment root becomes the page wrapper (its classes +
// the ground background), its inner markup becomes bodyHtml, all collected CSS is
// scoped under the scene root, and all anims serialize to one MC.applyAnims call.
import { z } from "zod";
import safeAreaCss from "../themes/safe-area.css" with { type: "text" };
import { serialize } from "../../pipeline/mini-dom";
import { buildBackdrop } from "../primitives/backdrops";
import type { FrameGround, FrameTreatment } from "../../types/storyboard";
import type { TimingPreset, TransitionName, TransitionSpec } from "../../types/transitions";
import { type AnimDescriptor, qualifyAnim, serializeAnims, toSlot } from "./anim";
import { collectCss, groundStyle, scopeCss } from "./css";
import { scrubDeterminism } from "./determinism";
import { getComponent } from "./registry";
import { DEFAULT_ENTRANCE, sceneEntranceJs } from "./transitions";
import {
  childrenContainer,
  fillRaw,
  fillSlots,
  mergeStyle,
  pruneRemoved,
  rootElement,
  stampAnims,
  stripAnnotations,
  styleProps,
  takeStyleProp,
} from "./dom";
import type {
  BuildContext,
  BuildNode,
  BuildResult,
  ChildParams,
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
  /** Optional default CSS. A theme normally OWNS a treatment's skin via
   *  `theme.skins[name]` (which buildNode prefers); an unskinned treatment falls back
   *  to this, else renders unstyled. */
  css?: string;
  /** Canonical full-bleed ground (a storyboard override can replace it at scene time). */
  ground: FrameGround;
  example: z.input<S>;
  /** The leaf component this treatment repeats as its children (stat-grid→stat, …).
   *  Formalizes the CLI/agent/spec-map child relationship + drives the showcase child editor. */
  childComponent?: string;
  /** Children used when the caller adds none (default deck build + showcase). */
  defaultChildren: (p: z.infer<S>) => ComponentInstance[];
  /**
   * The whole-element entrance forced onto EVERY child, whatever supplied it.
   *
   * Exists for the treatment that reveals its children ITSELF — `pill-wall` aims one
   * `staggerIn` at the container, which the interpreter expands to `.wall > *`, so a pill
   * carrying its own entrance is revealed twice. That invariant used to be bought per child in
   * `defaultChildren` (`Pill({…}).withTransition({ animIn: "none" })`), which is the one path
   * that supplies children the treatment already controls — and left every OTHER path on the
   * component's default: `compose.ts` forwards a transition only `if (c.animIn || c.timeIn)`,
   * and a theme's `examples[*].children` are plain param objects with nowhere to express one.
   *
   * The visible cost was NOT the double reveal (the container's wave claims each box first and
   * `MC.applyAnims` drops the child's own entrance) — it was the TIMING. mc.js's cascade `fit`
   * pass runs over the raw descriptor array before any DOM lookup or reveal guard, so twelve
   * dropped entrances still counted as twelve slots and collapsed the whole scene's slot delay
   * to its 0.15s floor: the headline, the wave and the caption all arrived early, on a scene
   * nobody had asked to speed up.
   *
   * A property of the TREATMENT, so it holds on every path into it rather than on the one that
   * remembered. It overwrites rather than merges — a treatment that owns its children's reveal
   * owns it outright, and `"none"` makes any accompanying `timeIn` moot.
   */
  childAnimIn?: TransitionName;
  /**
   * Cross-CHILD validation: one message describing an incoherent SET, or null.
   *
   * The per-element schemas structurally cannot do this. A treatment's schema never sees its
   * children (`composeTreatment` validates `spec.params`, then each child alone), and a child's
   * schema never sees its siblings or the treatment's params — so two counts that have to agree
   * are each validated against their own bounds and never against each other. `matrix` is the
   * clearest case: `criteria` is `.min(2).max(5)` and a row's `cells` is independently
   * `.min(2).max(5)`, so four criteria against three cells validates cleanly and renders a
   * header and a body on DIFFERENT track counts.
   *
   * Run on EVERY path, not just the spec one. `composeTreatment` runs it early, while it still
   * has the children as the caller WROTE them, so the deck editor, the CLI and the agent's
   * `build_treatment` get the message before anything is built (the agent's error text is fed
   * back to the model so it self-corrects). `buildNode` runs it again over the resolved child
   * instances, which is what covers `addChildren(instance…)` and `defaultChildren` — the paths
   * that used to skip it entirely.
   *
   * That gap was not theoretical: `trend-line` refuses series of different lengths because the
   * overlay draws them all against the FIRST series' category row, and
   * `TrendLine().addChildren(Plot(4 points), Plot(3 points))` sailed straight past the check
   * and rendered the two series' second vertices at different x under one shared row of four
   * labels. Nothing looks broken; the chart just quietly means nothing — the exact failure the
   * hook exists to refuse, reached by the path it did not cover.
   *
   * The instances are asked for their RESOLVED params (`ComponentInstance.params`), so a hook
   * reading a field with a schema default sees the default rather than `undefined` on this
   * path. Read a field's presence as "the author omitted it" only where the schema has no
   * default to supply.
   */
  childrenIssue?: (p: z.infer<S>, children: readonly ChildParams[]) => string | null;
  /**
   * Make the child SET agree on something no child can decide alone — the treatment's one
   * chance to reach across its children before any of them is built.
   *
   * `childrenIssue` is the same blind spot seen as VALIDATION, and validation is not always the
   * answer. `trend-line` overlays its plots on one graph, so the series share a y-axis: two
   * children each declaring their own `max` are not incoherent, they are two halves of a scale
   * nobody has resolved yet, and refusing them would make the ordinary act of adding a second
   * line an error to fix by hand. So this hook resolves it instead — union the scales, patch
   * both children (`ComponentInstance.withParams`), and the axis they now share is true of both.
   *
   * Runs on EVERY path into the treatment, `defaultChildren` included, and that is the whole
   * difference from `childrenIssue`: an unvalidated set merely might be wrong, while an
   * unreconciled one IS wrong, and the library's own defaults have no more claim to being
   * pre-reconciled than the editor's children do.
   *
   * It patches the instances in place rather than returning a new list, because an instance
   * carries more than its params — a per-child `withTransition` from `compose.ts`, a `withAnim`
   * override — and rebuilding one from its params alone would silently drop them. The
   * instances it is handed are the runtime's own COPIES of the caller's (see `buildNode`), so
   * patching them in place is local to this build.
   */
  reconcileChildren?: (children: readonly ComponentInstance[], p: z.infer<S>) => void;
  /** Own slot fills (headline, caption, …). */
  fill?: (p: z.infer<S>) => Record<string, string | null | undefined>;
  /**
   * Own RAW-HTML fills (`data-html="X"`), injected unescaped — the treatment's half of the
   * component seam (`ComponentDef.rawFill`), for markup an escaped slot cannot carry.
   *
   * It is handed the RECONCILED CHILDREN as well as the params, which is the point of it: what
   * a treatment has to say in its own frame and cannot say from `p` alone is something about
   * the SET. `trend-line`'s key is the case — N overlaid lines identify themselves by colour,
   * and the colours are only decided once `reconcileChildren` has walked the set, so the key
   * cannot be written from the treatment's params and cannot be written by any one child.
   *
   * Escaping is the caller's, exactly as it is for a component's `rawFill`: build the markup
   * with `esc()` around every authored string.
   */
  rawFill?: (p: z.infer<S>, children: readonly ComponentInstance[]) => Record<string, string | null | undefined>;
  /** Responsive layout: CSS custom properties from the child count. */
  layout?: (childCount: number, p: z.infer<S>) => Record<string, string>;
  /** Own animations (e.g. the headline reveal). */
  anim?: (p: z.infer<S>, childCount: number) => AnimDescriptor[];
  /** Seconds between consecutive cascade slots (decorations → title → child → child …).
   *  Default 0.6. The runtime tightens it by the slide's caption count (base − 0.1×captions,
   *  floored at 0.15), so a typical 1-caption scene lands ~0.5s between rows/cards. A UI knob
   *  may override it later. Each element still performs its own entrance + internal timing. */
  revealDelay?: number;
  /** Whole-scene page IN transition (catalog name). Unset ⇒ the legacy DEFAULT_ENTRANCE. */
  animIn?: TransitionName;
  /** Whole-scene page OUT transition (catalog name). Unset/`none` ⇒ no exit (hard cut).
   *  NOT emitted into this sub-composition (see buildScene) — it is resolved via `pageOutFor`
   *  and played on the ROOT/master timeline at the clip level by the render pipeline. */
  animOut?: TransitionName;
  /** IN duration preset (short/medium/long). Default short when animIn is set. */
  timeIn?: TimingPreset;
  /** OUT duration preset (short/medium/long). Default short when animOut is set. */
  timeOut?: TimingPreset;
  /** Page entrance tween statement; `page` is in scope. Default: a soft fade. */
  entrance?: string;
};

/** The ground a scene actually paints: an explicit scene override wins, else the THEME's
 *  default (a monochrome theme pins every frame), else the treatment's canonical ground. */
export const groundFor = (ctx: BuildContext, canonical: FrameGround): FrameGround =>
  ctx.ground ?? (ctx.theme.groundDefault as FrameGround | undefined) ?? canonical;

/**
 * The ground for an element rendered OUTSIDE a treatment — a bare component in the showcase or
 * the editor's component preview, which has no frame and therefore no canonical ground.
 *
 * This exists so a skin can read `var(--ground)` with NO FALLBACK. The five that read it used to
 * spell one out per theme (`var(--ground, var(--muted-1))`, `…var(--muted-2)`), hand-matched to
 * each theme's `groundDefault` — data the library already holds — so changing a theme's default
 * silently disagreed with the skins on exactly the surface the fallback existed for. One
 * expression, in the same file as `groundFor`, replaces five guesses; `muted-1` is the last
 * resort for a theme that pins no default at all (creative, deliberately).
 */
export const previewGround = (ctx: BuildContext): FrameGround =>
  ctx.ground ?? (ctx.theme.groundDefault as FrameGround | undefined) ?? ("muted-1" as FrameGround);

export function treatment<S extends z.ZodTypeAny>(def: TreatmentDef<S>): TreatmentFactory<S> {
  const delay = def.revealDelay ?? 0.6;
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
      params: () => parse(raw),
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
      addChildren(...children: ComponentInstance[]) {
        added = [...(added ?? []), ...children];
        return this;
      },
      addDecorations(...decorations: ComponentInstance[]) {
        addedDecorations = [...(addedDecorations ?? []), ...decorations];
        return this;
      },
      // `if (added)` / `if (addedDecorations)` rather than `?.length`: an EMPTY list is an
      // override in its own right here (a deliberately bare frame — see the decoration note in
      // buildNode), so a copy that dropped it would silently get the theme's defaults back.
      clone(): TreatmentInstance {
        const copy = factory(raw);
        if (added) copy.addChildren(...added);
        if (addedDecorations) copy.addDecorations(...addedDecorations);
        if (animOverride) copy.withAnim(animOverride);
        if (transitionOverride) copy.withTransition(transitionOverride);
        return copy;
      },
      buildNode(ctx: BuildContext): BuildNode {
        const p = parse(raw);
        // THE CHILDREN ARE RESOLVED BEFORE THE FRAME'S OWN MARKUP, because the frame may have
        // something to say about them: `rawFill` is handed the reconciled set so a treatment
        // can describe its children in its own template (trend-line's key), and that has to be
        // the set as it will actually be drawn.
        const supplied = added ?? def.defaultChildren(p);
        // A BUILD DOES NOT WRITE TO ITS CALLER'S INSTANCES. Two hooks below PATCH children — a
        // shared scale and colour (`reconcileChildren`), a forced entrance (`childAnimIn`) —
        // and the instances handed to `addChildren` belong to whoever built them: an editor
        // holds them across rebuilds, and `build` is documented pure and deterministic. Patched
        // in place, a plot overlaid once carried the overlay's `max`, `decimals` and accent for
        // the rest of its life, including in its own standalone build, and a second render of
        // the same treatment reconciled an already-reconciled set. So the patching hooks are
        // pointed at COPIES (`ComponentInstance.clone`), taken only when there IS such a hook —
        // nothing else here writes to a child, and a copy nothing writes to buys nothing.
        const children =
          def.reconcileChildren || def.childAnimIn ? supplied.map((c) => c.clone()) : supplied;
        // Cross-child VALIDATION, on this path as well as `composeTreatment`'s — the resolved
        // instances are asked for their params, which is exactly what an instance-built or
        // defaulted child set could not be checked from before (see `childrenIssue`). Ahead of
        // reconciliation, because reconciliation resolves the disagreements that are resolvable
        // and this refuses the ones that are not.
        const issue = def.childrenIssue?.(
          p,
          children.map((c) => ({ name: c.name, params: c.params() as Record<string, unknown> })),
        );
        if (issue) throw new Error(`treatment '${def.name}' children invalid:\n- ${issue}`);
        // Cross-child reconciliation BEFORE anything is built, so a child that has to know
        // about its siblings (a shared scale, a shared colour cycle) is patched while its params
        // are still patchable. See `reconcileChildren`.
        def.reconcileChildren?.(children, p);
        // A treatment that reveals its own children forces their entrance here rather than
        // trusting whoever built them to have known (see `childAnimIn`). Applied to the
        // defaults too, so there is ONE statement of the rule instead of one per path.
        if (def.childAnimIn) for (const c of children) c.withTransition({ animIn: def.childAnimIn });

        // A theme may override this treatment's structure (theme.templates[name]); the
        // override must keep the shared markers so fill/anim/children still resolve.
        const root = rootElement(ctx.theme.templates?.[def.name] ?? def.template);
        if (def.fill) fillSlots(root, def.fill(p));
        if (def.rawFill) fillRaw(root, def.rawFill(p, children));
        pruneRemoved(root);
        stampAnims(root, ctx.idPrefix); // own data-anim (headline, …)

        const container = childrenContainer(root);
        if (!container && children.length > 0) {
          throw new Error(`treatment '${def.name}': template has no data-children container`);
        }

        const cssParts: { name: string; css: string }[] = [];
        // THE SAFE AREA IS THE RUNTIME'S, NOT A THEME'S — see themes/safe-area.css. It is the
        // one rule no frame may argue with, so it is pushed here for every treatment in every
        // theme rather than concatenated onto `frameCss` in each theme.ts, which is what it was:
        // six copies of `safeAreaCss + frameCss` and six of the import, where dropping one term
        // silently loses `position: absolute`, `inset: 0`, `z-index: 3` and the flex column and
        // collapses every frame in that theme to a static top-left block.
        //
        // Its own named part, ahead of the theme's, for two reasons beyond that. It gets its own
        // collectCss de-dupe key rather than riding on `@frame:<theme>`, so it is emitted once
        // per document independently of whether the theme has a frame base at all. And being
        // FIRST at equal specificity is the cascade position the file's "NOTHING OVERRIDES ANY
        // OF THIS" claim depends on — pinned by theme-parity.test.ts, which asserts the order in
        // a composed scene rather than here. (The `/* @safe-area */` label collectCss writes is
        // a build-time affordance only: scopeCss strips comments before a scene is emitted.)
        cssParts.push({ name: "@safe-area", css: safeAreaCss });
        if (ctx.theme.frameCss) cssParts.push({ name: `@frame:${ctx.theme.name}`, css: ctx.theme.frameCss });
        // The skin is theme-owned when the active theme supplies one for this treatment
        // name (theme.skins[name]); else the treatment's own css; else none — mirrors the
        // component skin seam (component.ts) so treatments are themeable the same way.
        cssParts.push({ name: def.name, css: ctx.theme.skins?.[def.name] ?? def.css ?? "" });

        // Ordered cascade slots: decorations first, then the title, then each child in turn.
        // Decorations can be added to ANY treatment, so their count shifts the title/child slots.
        // The per-slot delay is resolved at runtime (MC.applyAnims) from the slide's caption
        // count — NOT from VO-line keying — so the cascade is identical in the showcase, the
        // preview, and the render, and never collapses onto a single narration line.
        // Defaults are THEME-owned (theme.decorationDefaults[treatment]) — decoration
        // families are theme-exclusive, so only the active theme can name shapes that are
        // on-look here. An explicit addDecorations() replaces them, including an empty
        // list (the showcase's "delete every row" ⇒ a deliberately bare frame).
        // `def.name` is a plain string — a treatment may be one the deck schema calls
        // CUSTOM, outside FRAME_TREATMENTS — while the map is keyed by FrameTreatment so a
        // theme can't misspell a frame. The widening is safe in this direction: an
        // off-union name simply misses and the frame gets no defaults.
        const defaultDecos = (ctx.theme.decorationDefaults?.[def.name as FrameTreatment] ?? []).map(
          (d) => getComponent(d.name)(d.params ?? {}),
        );
        const decorations = addedDecorations ?? defaultDecos;
        const titleSlot = decorations.length; // decos own slots 0..titleSlot-1
        // Framing own-anims keyed to `leadIn` (an eyebrow pill, a backing card) take the title
        // slot; the title itself (a `line-0` reveal) then falls to the NEXT beat, so it doesn't
        // pop simultaneously with its own frame. Only QUOTE and CLOSING-PLATE carry leadIn
        // own-anims now — cover deliberately does not (its eyebrow pill was removed with the
        // schema field; see treatments/cover/anim.ts), so cover is titleOffset 0 like every
        // child-bearing treatment, and its headline takes the title slot itself.
        const ownAnimsRaw = animOverride ?? (def.anim ? def.anim(p, children.length) : []);
        const titleOffset = ownAnimsRaw.some((a) => a.time.at === "leadIn") ? 1 : 0;
        const childBase = titleSlot + titleOffset + 1; // children follow the frame + title

        // Children — each child occupies ONE cascade slot; all of its anims ride that slot,
        // each keeping its own internal `plus` so the child owns its entrance + internal timing.
        const childAnims: AnimDescriptor[] = [];
        // SIBLING-UNIFORM WIDTH RESERVATION. `bar` and `rank` each set `--vlen` — the room
        // their finished figure needs, in `ch` — on THEMSELVES. The skins turn it into the
        // value box's min-width, and in a rank row the label + box are fixed while the track
        // takes the remainder, so children reserving DIFFERENT widths get tracks of different
        // LENGTHS; since each fill is a percentage OF ITS OWN TRACK, a lower row can then
        // paint a longer bar than the leader and the ranking reads inverted. In a chart the
        // same divergence just makes the columns unequal.
        //
        // The children already avoid this themselves by sizing off the series `max` rather
        // than their own value (runtime/value.ts, seriesReserveCh), which is uniform by
        // construction. This is the BACKSTOP for the case that defeats it: nothing forces
        // siblings to share a max — the deck editor can set one row's scale independently —
        // and the alignment must not depend on that. So take each child's --vlen, drop it,
        // and re-declare the MAX on the container root, where it inherits into every child's
        // skin. Generic rather than per-treatment: it is a property of ANY repeated child
        // that reserves width, and it costs nothing when the children already agree.
        const reserved: number[] = [];
        if (container) {
          container.children = [];
          children.forEach((child, i) => {
            const childCtx: BuildContext = { ...ctx, idPrefix: `${ctx.compId}__c${i}` };
            const bn = child.buildNode(childCtx);
            const own = takeStyleProp(bn.node, "--vlen");
            if (own !== null && Number.isFinite(Number(own))) reserved.push(Number(own));
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
        //
        // ONLY the node and its anims come from the design: a backdrop contributes NO CSS to
        // the scene. Every design's rules live in the shared BACKDROPS_CSS sheet, staged as a
        // project's read-only assets/backdrops.css (see backdrops.ts for why that sheet exists
        // and what edit it prevents). A scene sub-composition is agent-writable; this keeps the
        // mask's geometry out of it.
        const backdropName = ctx.backdrop ?? ctx.theme.backdrop ?? "plain";
        const backdrop = buildBackdrop(backdropName, { ground: groundFor(ctx, def.ground), theme: ctx.theme, ctx });
        const backdropAnims: AnimDescriptor[] = [];
        if (backdrop) {
          root.children.unshift(backdrop.node);
          for (const a of backdrop.anims) backdropAnims.push(a);
        }

        // The hoisted reservation rides with the layout props so it lands in ONE style
        // string (a treatment's own layout never names --vlen; if one ever does, the
        // sibling max wins, because the children are the thing being sized).
        mergeStyle(
          root,
          styleProps({
            ...(def.layout ? def.layout(children.length, p) : {}),
            ...(reserved.length ? { "--vlen": String(Math.max(...reserved)) } : {}),
          }),
        );
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
        // The visible background AND the `--ground` custom property that exposes it to skins
        // (runtime/css.ts owns the pair, so the ground swap re-points both halves).
        const ground = groundStyle(groundFor(ctx, def.ground));
        const pageStyle = ownStyle ? `${ownStyle}; ${ground}` : ground;
        const bodyJs = serializeAnims(bn.anims);
        // Whole-page ENTRANCE: an assigned animIn wins over the legacy def.entrance;
        // unset ⇒ the byte-identical DEFAULT_ENTRANCE.
        const { animIn, timeIn } = this.pageTransition();
        const entranceJs =
          animIn && animIn !== "none" ? sceneEntranceJs(animIn, timeIn) : (def.entrance ?? DEFAULT_ENTRANCE);
        // Whole-page EXIT is deliberately NOT emitted into the sub-composition. Under
        // HyperFrames' seek-based render, a tween INSIDE a nested sub-composition that drives
        // an element toward a HIDDEN end-state (opacity 0 / off-canvas) leaks that end-state
        // BACKWARD across the scene: the content blanks partway through while the scene's
        // narration and caption are still on screen (the "transitioned too early" bug). An
        // entrance ends VISIBLE, so the identical leak is invisible — only exits show it,
        // which is why only slides carrying an animOut broke. Verified by rendering a scene
        // with vs without the exit: without it the content holds for the whole scene; with it
        // the content vanishes ~mid-scene regardless of the exit's shape (opacity, transform)
        // or which element it targets (page root or an inner wrapper). The correct home for a
        // scene exit is the ROOT/master timeline, tweening the CLIP element — root-level
        // tweens do NOT leak (captions, HUD and the progress bar animate there cleanly), and a
        // clip-level `tl.to(#clip, {autoAlpha:0, …})` was verified to hold the content for the
        // whole scene and slide out only in its own window. That IS where the animated exit now
        // lives: the harness's components/root-scenes.ts resolves each scene's animOut through
        // `pageOutFor` AT ROOT-WRITE TIME — reading the persisted deck, else spec + storyboard,
        // with no sidecar in between — and pipeline/root-html.ts emits `MC.<fn>(tl, "#<clip>",
        // …)`, clamped so the exit never begins before the scene's narration ends. A scene with
        // no animOut (or a consumer that resolves none) hard-cuts via the root's autoAlpha set.
        scrubDeterminism(`${entranceJs}\n${bodyJs}`, def.name);
        return {
          compId: ctx.compId,
          voIds: ctx.voIds ?? [],
          pageClasses,
          pageStyle,
          bodyHtml: `\n          ${serialize(root.children)}`,
          bodyCss: `\n${scopeCss(bn.css, ctx.compId)}`,
          entranceJs,
          // no `exitJs` — the optional field is left unset (sub-composition defaults it to "")
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
    // The canonical ground, readable without building an instance (see TreatmentFactory.ground).
    // `def.ground` is a required static literal, so this is the same value every instance of this
    // treatment reports — there is nothing per-instance for the two to drift over.
    ground: def.ground,
    // Parses `params` through the treatment's own schema first: the hook is written against
    // resolved params (defaults applied), and composeTreatment has already validated them.
    childrenIssue: def.childrenIssue
      ? (params: unknown, children: readonly ChildParams[]): string | null =>
          def.childrenIssue!(def.schema.parse(params ?? {}), children)
      : undefined,
    jsonSchema,
    defaults: () => def.schema.parse(def.example),
  });
}
