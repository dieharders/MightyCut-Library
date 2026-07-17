// Shared runtime types for the component/treatment system.
import type { z } from "zod";
import type { ElementNode } from "../../pipeline/mini-dom";
import type { SubComposition } from "../../pipeline/sub-composition";
import type { FrameGround } from "../../types/storyboard";
import type { ComponentTransition, TransitionSpec } from "../../types/transitions";
import type { AnimDescriptor } from "./anim";

export type BuildMode = "render" | "showcase";

/** One palette swatch — a named token backing a CSS custom property. */
export type PaletteSwatch = {
  /** Display name, e.g. "Pink". */
  name: string;
  /** Hex value, e.g. "#FE90E8". */
  hex: string;
  /** Optional role note shown after the hex, e.g. "CTA", "canvas". */
  note?: string;
  /** The CSS custom property name (no leading `--`), e.g. "pink". */
  varName: string;
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
  /** `:root { --pink: …; --disp: … }` — emitted to a project's assets/tokens.css. */
  css: string;
  /** Shared frame-base CSS (the `.block-frame` structure, body wrapper, decorations,
   *  base type) inlined ONCE per scene (deduped by name). Theme-specific look. */
  frameCss?: string;
  /** Self-hosted content fonts to stage into the project (theme-fonts.css + files). */
  fonts?: { css: string; files: string[] };
  /** The theme's swatches — drives the showcase Palette section (data-driven). */
  palette?: PaletteSwatch[];
  /** The theme's type scale — drives the showcase Typography section. */
  typography?: TypeSpec[];
  /** The theme's authoring rules — drives the showcase Rules section. */
  rules?: ThemeRules;
  /** The decoration component families this theme offers (starburst, slab, …) —
   *  drives the showcase Decorations section + the treatment decoration editor. */
  decorations?: string[];
};

export type BuildContext = {
  /** Scene id — the CSS scope (`.<compId>-root`) and default marker prefix. */
  compId: string;
  /** Marker prefix for THIS instance's animatable elements (compId, or compId__cN for a child). */
  idPrefix: string;
  theme: ThemeTokens;
  mode: BuildMode;
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
