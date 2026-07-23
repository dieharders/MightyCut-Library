// Shared runtime types for the component/treatment system.
import type { z } from "zod";
import type { ElementNode } from "../../pipeline/mini-dom";
import type { SubComposition } from "../../pipeline/sub-composition";
import type { PaletteVar } from "../../types/palette";
import type { FrameGround } from "../../types/storyboard";
import type { ComponentTransition, TransitionSpec } from "../../types/transitions";
import type { AnimDescriptor } from "./anim";

export type BuildMode = "render" | "showcase";

/**
 * One palette entry — the colour a theme assigns to one of the 10 shared palette
 * ROLES (types/palette.ts). A theme's `palette` has exactly one entry per role, in
 * canonical role order, and is the single source of its colours: it generates the
 * `:root` custom properties AND drives every colour the UI displays or offers.
 *
 * The SAME colour may appear under several roles (block's Oat is both `muted-2` and
 * `muted-3`), which is why `name` is the human-facing label the UI de-dupes on —
 * see `uniquePaletteEntries`.
 */
export type PaletteSwatch = {
  /** Human/agent-facing colour label, e.g. "Pink", "Cyan", "Oat". Shared by every
   *  role this colour fills, which is what makes de-duping meaningful. */
  name: string;
  /** Hex value, e.g. "#FE90E8". The de-dupe key. */
  hex: string;
  /** Optional usage note shown after the hex, e.g. "CTA", "canvas". */
  note?: string;
  /** The palette ROLE this colour fills — also the CSS custom property name
   *  (no leading `--`), e.g. "primary", "accent-1", "muted-2". */
  varName: PaletteVar;
};

/** One typographic role — token name, human spec line, a live sample, and the
 *  inline CSS that styles the sample in the showcase Typography section. */
export type TypeSpec = {
  /** Token id, e.g. "heading-xl". */
  token: string;
  /** Human-readable spec line, e.g. "Inter 900 · uppercase · −0.03em". */
  spec: string;
  /** Sample text rendered at this role. */
  sample: string;
  /** Inline CSS applied to the sample element (self-contained; no external class). */
  style: string;
};

/** The theme's Do / Don't authoring rules (verbatim from its design showcase). */
export type ThemeRules = { do: string[]; dont: string[] };

/** Palette/font tokens for a theme — replaces a theme's frame.css `:root` block,
 *  plus the showcase-facing design data (palette/typography/rules/flares) the
 *  interactive gallery renders generically so other themes standardize for free. */
export type ThemeTokens = {
  /** Theme value, e.g. "block". */
  name: string;
  /** Human display name for the showcase header, e.g. "BlockFrame" (falls back to `name`). */
  title?: string;
  /** One-paragraph description of the theme's visual language, shown in the showcase header. */
  description?: string;
  /** `:root { --primary: …; --disp: … }` — emitted to a project's assets/tokens.css. */
  css: string;
  /** Shared frame-base CSS (the `.block-frame` structure, body wrapper, decorations,
   *  base type) inlined ONCE per scene (deduped by name). Theme-specific look. */
  frameCss?: string;
  /** Per-element skins, keyed by component OR treatment name (e.g. `{ hud, caption,
   *  stat, "stat-grid", … }`). The element owns the STRUCTURE (template) + BEHAVIOR
   *  (anim/schema) — the same across every theme — while each theme styles those
   *  standard class names its own way here. Both `component.buildNode` and
   *  `treatment.buildNode` prefer a theme skin over the element's own `css`, so a
   *  theme just adds its skin file. Elements carry no `css` of their own now; each
   *  theme supplies every skin it renders (an unskinned element renders unstyled). */
  skins?: Record<string, string>;
  /** Per-element HTML template overrides, keyed by component OR treatment name.
   *  A theme may restyle structure it can't reach with CSS (drop the stat dot, drop
   *  the cover eyebrow, add a quote mark). INVARIANT: an override MUST keep the shared
   *  marker vocabulary (data-slot / data-anim / data-children / data-repeat ids) so the
   *  element's shared schema/anim/fill/layout keep working — it may only re-wrap/rename/
   *  add decorative nodes or DROP an optional slot (whose anim then no-ops). */
  templates?: Record<string, string>;
  /** The ground this theme falls back to when a scene sets none, OVERRIDING the
   *  treatment's canonical `ground`. A monochrome theme (future: every frame on navy)
   *  sets it so the shared, block-flavoured per-treatment grounds don't leak through —
   *  the job future's `background: … !important` used to do, except an explicit scene
   *  ground still WINS here, which `!important` made impossible.
   *  Resolution order: scene override → theme.groundDefault → treatment canonical. */
  groundDefault?: PaletteVar;
  /** The theme's canonical backdrop MASK design (a BACKDROP_NAMES value) painted
   *  over every scene's ground colour. Unset ⇒ `"plain"` (no mask). A scene may
   *  override it (BuildContext.backdrop). See primitives/backdrops.ts. */
  backdrop?: string;
  /** Surface colour the showcase/editor paints BEHIND a natural-size element preview
   *  (a component shown outside a full frame). A dark theme sets a dark surface so its
   *  glass / light-on-dark elements read (block's neobrutalist tiles want a light one).
   *  Unset ⇒ a neutral light default. A CONCRETE CSS colour — it's applied in the host
   *  light DOM (not the preview Shadow DOM), so a `var(--token)` would not resolve. */
  previewBg?: string;
  /** Per-element SHOWCASE sample overrides, keyed by component/treatment name. Lets a theme
   *  show its OWN on-theme copy instead of the shared (block-flavored) def example. `params`
   *  seed the element's own slots; `children` (treatments) seed the child rows as an array of
   *  child PARAMS (the treatment's `childComponent`). SHOWCASE-ONLY — the render/deck path
   *  always uses real spec content + `defaultChildren`, never these. Unset ⇒ the def example. */
  examples?: Record<string, { params?: Record<string, unknown>; children?: Record<string, unknown>[] }>;
  /** Self-hosted content fonts to stage into the project (theme-fonts.css + files). */
  fonts?: { css: string; files: string[] };
  /** The theme's swatches — drives the showcase Palette section (data-driven). */
  palette?: PaletteSwatch[];
  /** The theme's type scale — drives the showcase Typography section. */
  typography?: TypeSpec[];
  /** The theme's authoring rules — drives the showcase Rules section. */
  rules?: ThemeRules;
  /** The decoration component families THIS theme offers (block: starburst/slab/…;
   *  future: node/reticle/…) — its own roster, listed in the showcase Decorations
   *  section and the treatment decoration editor. Themes do NOT share decorations:
   *  each lists only its own here, and every decoration-flagged component (see
   *  `ComponentFactory.decoration`) is held out of the Components grid globally, so
   *  another theme's decorations never appear under this one. */
  decorations?: string[];
  /** When true, a treatment's `defaultDecorations` are suppressed (no auto-injected
   *  cover star / closing slab). A theme whose look owns the backdrop instead of
   *  per-frame decorations (e.g. future's constellation) sets this so block's default
   *  shapes don't render off-theme or shift the reveal cascade. A caller's explicit
   *  `addDecorations()` is unaffected. */
  suppressDefaultDecorations?: boolean;
};

export type BuildContext = {
  /** Scene id — the CSS scope (`.<compId>-root`) and default marker prefix. */
  compId: string;
  /** Marker prefix for THIS instance's animatable elements (compId, or compId__cN for a child). */
  idPrefix: string;
  theme: ThemeTokens;
  mode: BuildMode;
  /** Per-scene backdrop MASK override (a BACKDROP_NAMES value). Falls back to
   *  `theme.backdrop`, then `"plain"`. See primitives/backdrops.ts. */
  backdrop?: string;
  /** Per-scene ground override (a FrameGround). Falls back to the treatment's
   *  canonical `def.ground`. Rides the ctx purely so the backdrop mask's input
   *  carries the RESOLVED ground (a ground-tinted design recolours correctly); the
   *  visible page background is swapped separately (emit.ts/mount.ts pageStyle). */
  ground?: FrameGround;
  /** Render: this slide's VO line ids in narration order (for lineId parity). */
  voIds?: string[];
};

/** A built element, before serialization (treatments split this into page parts). */
export type BuildNode = {
  node: ElementNode;
  /** Authored (unscoped) CSS — the emitter scopes it under `.<compId>-root`. */
  css: string;
  /** Fully-qualified anim descriptors (targets already scoped). */
  anims: AnimDescriptor[];
};

export type BuildResult = {
  html: string;
  css: string;
  anims: AnimDescriptor[];
};

export interface ComponentInstance {
  readonly name: string;
  readonly kind: "component" | "treatment";
  /** Build to a mini-dom node + css + anims (pure, deterministic). */
  buildNode(ctx: BuildContext): BuildNode;
  /** Build to serialized html + css + anims. */
  build(ctx: BuildContext): BuildResult;
  /** JSON Schema (z.toJSONSchema) of this element's params — for tools + showcase docs. */
  jsonSchema(): object;
  /** The parsed example params (drives showcase render + defaults). */
  defaults(): unknown;
  /** Replace this instance's default animations. */
  withAnim(anims: AnimDescriptor[]): this;
  /** Override the whole-element entrance transition (animIn + timing). */
  withTransition(t: ComponentTransition): this;
}

export interface TreatmentInstance extends ComponentInstance {
  readonly kind: "treatment";
  readonly ground: FrameGround;
  /** Override the whole-scene page transition (animIn/animOut + timing). */
  withTransition(t: TransitionSpec): this;
  addChildren(...children: ComponentInstance[]): this;
  /** Add positioned decoration components (any treatment can carry these) —
   *  appended to the page root and layered fore/back by their own z-index. */
  addDecorations(...decorations: ComponentInstance[]): this;
  /** Build a full scene sub-composition (ready for wrapSubComposition). */
  buildScene(ctx: BuildContext): SubComposition;
  /** The resolved whole-scene page transition (caller override ?? treatment defaults).
   *  Lets the live preview replay the same page IN/OUT the render emits — the render
   *  path stays in buildScene (entranceJs/exitJs), this is the data seam for the editor. */
  pageTransition(): TransitionSpec;
}

export type ComponentFactory<S extends z.ZodTypeAny = z.ZodTypeAny> = ((
  params?: Partial<z.input<S>>,
) => ComponentInstance) & {
  readonly componentName: string;
  readonly kind: "component";
  readonly schema: S;
  /** True for a full-frame composite (e.g. `hud`) — the showcase renders it in a
   *  1920×1080 frame slot instead of the natural-size component slot. */
  readonly frame?: boolean;
  /** True for a positioned page-space decoration flourish (starburst, node, …). It's an
   *  INTRINSIC property of the element, not a per-theme role: a decoration is never listed
   *  in the showcase Components grid under ANY theme, so one theme's decorations never leak
   *  into another's. Which decorations a theme actually OFFERS is `ThemeTokens.decorations`
   *  (its own roster, surfaced in the Decorations section + the treatment decoration editor). */
  readonly decoration?: boolean;
  jsonSchema(): object;
  defaults(): z.infer<S>;
};

export type TreatmentFactory<S extends z.ZodTypeAny = z.ZodTypeAny> = ((
  params?: Partial<z.input<S>>,
) => TreatmentInstance) & {
  readonly treatmentName: string;
  readonly kind: "treatment";
  readonly schema: S;
  /** The leaf component this treatment repeats as its children (stat-grid→stat, …)
   *  — formalizes the CLI/agent child relationship and drives the showcase child editor. */
  readonly childComponent?: string;
  jsonSchema(): object;
  defaults(): z.infer<S>;
};

export type { AnimDescriptor, SubComposition, FrameGround };
