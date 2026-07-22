// Storyboard — the frame-theme companion to spec.ts. spec.json stays the
// narrative source of truth (copy + per-kind content + voiceover/timing);
// storyboard.json only decides, per scene, WHICH frame treatment renders the
// scene's content and an optional ground color. Slot →
// spec-field resolution is deterministic in the frame builder, so the agent
// (and the scaffold default) only choose a treatment, not every slot.
//
// This file is additive: it does not change spec.json / script.json /
// audio-manifest.json. It is consumed by src/pipeline/frame-builder.ts and is
// only produced for frame themes (isFrameTheme — any theme with a
// FRAME_THEME_TOKENS entry; block is the reference).
import { z } from "zod";
import { TransitionSpecSchema } from "./transitions";

const id = z.string().regex(/^[a-z][a-z0-9-]*$/, "ids are lowercase kebab-case");

/**
 * The frame-theme names — the themes the frame builder renders (each with its own
 * annotated showcase + treatments + frame.css). Canonical home so the storyboard
 * schema, generate-content's selector, and the CLI/job overrides share one list
 * (no drift). `block` is the reference; the others go live as their showcases are
 * annotated.
 */
export const FRAME_THEME_NAMES = ["block", "capsule", "creative", "professional", "standard", "future"] as const;
export type FrameThemeName = (typeof FRAME_THEME_NAMES)[number];

/**
 * The render-ready frame treatments — universal frame-system concepts each
 * theme's showcase annotates with data-treatment="<id>". EVERY live theme ships
 * the SAME named set (a tripwire test asserts this list and each showcase's
 * data-treatment ids stay in sync, both directions). `chart` and `bar-ranking`
 * are siblings over the same spec data (chart.series): `chart` is the vertical
 * bar chart, `bar-ranking` the horizontal ranked list — the builder fills both
 * from the same code; orientation is chosen per theme in its showcase markup
 * (data-bar vs data-bar="horizontal"). Likewise `timeline` and `agenda` are
 * siblings over the same spec data (steps): `timeline` is the stepped cards,
 * `agenda` a sparse numbered index list — same builder code, different skin.
 */
export const FRAME_TREATMENTS = [
  "cover",
  "feature-cards",
  "stat-grid",
  "closing-plate",
  "quote",
  "timeline",
  "comparison",
  "chart",
  "bar-ranking",
  "agenda",
] as const;
export type FrameTreatment = (typeof FRAME_TREATMENTS)[number];

/**
 * The five candy pastels (+ structural offwhite/white/black) that cycle as
 * full-bleed grounds across frames. FRAME.md: the cycle is the rhythm. The
 * builder applies the ground as an inline background on the frame so a single
 * shared frame.css restyles every scene.
 */
export const FRAME_GROUNDS = [
  "offwhite",
  "cream",
  "blue",
  "pink",
  "green",
  "yellow",
  "black",
] as const;
export type FrameGround = (typeof FRAME_GROUNDS)[number];

/**
 * The backdrop MASK designs — a full-bleed overlay painted on top of the ground
 * COLOR (behind the content). Distinct from `ground`: ground is the base colour,
 * backdrop is the pattern/texture over it. Theme-agnostic + shareable — a theme
 * recolours the mask with its own tokens/skin. `plain` = no mask (byte-identical
 * to a bare ground). A theme declares its canonical design (ThemeTokens.backdrop);
 * a scene may override it here. Static today (block's dots); the design interface
 * already carries anims so an animated mask (e.g. a constellation) drops in later.
 */
export const BACKDROP_NAMES = ["plain", "dots"] as const;
export type BackdropName = (typeof BACKDROP_NAMES)[number];

// Decorations (star / tilt-rect / stripe / dot-grid) are authored per-treatment in
// the showcase and ship with the frame — there is no storyboard knob for them.

/**
 * The standardized, theme-agnostic slot vocabulary. Treatments mark injectable
 * elements with data-slot="<name>" drawn from this set; the builder's resolver
 * maps each name (plus the slide kind) to a spec field. A tripwire test asserts
 * every data-slot in the showcase is in this set.
 */
export const SLOT_NAMES = [
  "eyebrow",
  "headline",
  "subtitle",
  "counter",
  "cta",
  "attribution",
  "quote-text",
  "card-icon",
  "card-title",
  "card-body",
  "stat-number",
  "stat-label",
  "step-num",
  "step-title",
  "step-body",
  "col-a",
  "col-b",
  "row-label",
  "cell-a",
  "cell-b",
  "bar-value",
  "bar-label",
  "caption",
  // Component slots (data-component pieces, not treatment slots): filled at stamp
  // time by their consumer (the root caption rail / HUD overlay), not the
  // treatment resolver.
  "caption-text",
  "brand-name",
  "tagline",
  "hud-title",
] as const;
export type SlotName = (typeof SLOT_NAMES)[number];

/**
 * The data-repeat list names — a container wrapping exactly ONE item template
 * the builder clones per content item. A tripwire asserts the showcase's
 * data-repeat values are in this set.
 */
export const REPEAT_LISTS = ["cards", "stats", "steps", "rows", "bars"] as const;
export type RepeatList = (typeof REPEAT_LISTS)[number];

const SceneStoryboardSchema = z.object({
  /** MUST equal a spec slide id — the builder cross-checks (tolerate-and-warn). */
  sceneId: id,
  treatment: z.enum(FRAME_TREATMENTS),
  options: z
    .object({
      ground: z.enum(FRAME_GROUNDS).optional(),
      backdrop: z.enum(BACKDROP_NAMES).optional(),
      transition: TransitionSpecSchema.optional(),
    })
    .optional(),
});
export type SceneStoryboard = z.infer<typeof SceneStoryboardSchema>;

export const StoryboardSchema = z
  .object({
    theme: z.enum(FRAME_THEME_NAMES),
    scenes: z.array(SceneStoryboardSchema).min(3),
  })
  .superRefine((sb, ctx) => {
    const seen = new Set<string>();
    for (const [i, scene] of sb.scenes.entries()) {
      if (seen.has(scene.sceneId)) {
        ctx.addIssue({
          code: "custom",
          path: ["scenes", i, "sceneId"],
          message: `duplicate sceneId '${scene.sceneId}'`,
        });
      }
      seen.add(scene.sceneId);
    }
  });
export type Storyboard = z.infer<typeof StoryboardSchema>;
