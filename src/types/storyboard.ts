// Storyboard — the per-scene DRESSING companion to spec.ts. spec.json stays the
// narrative source of truth (copy + per-look content + voiceover/timing) AND now
// owns the look itself, since a slide's `kind` is its treatment; storyboard.json
// decides only how each scene is dressed — ground colour, backdrop mask, transition.
//
// It is additive: it does not change spec.json / script.json / audio-manifest.json.
// The theme names and the ground/backdrop vocabularies live here; the look vocabulary
// lives in types/spec-treatments (LOOKS) and is re-exported below.
import { z } from "zod";
import { PALETTE_VARS, type PaletteVar } from "./palette";
import { FRAME_TREATMENTS, type FrameTreatment } from "./spec-treatments";
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

// FRAME_TREATMENTS MOVED to types/spec-treatments (the LOOKS table), where it is DERIVED from
// the one look vocabulary rather than declared as a second tuple beside it. A treatment name is
// now identical to the spec slide `kind` it renders — `bar-chart` and `bar-ranking` are two
// looks over the same series shape, `timeline` and `agenda` two over the same steps shape — so
// the pair that used to need a map, a default and a compatibility check is one name. Re-exported
// here so every `from "./storyboard"` importer is unchanged.
export { FRAME_TREATMENTS, type FrameTreatment };

/**
 * The grounds that cycle as full-bleed backgrounds across frames. FRAME.md: the
 * cycle is the rhythm. The builder applies the ground as an inline background on
 * the frame so a single shared frame.css restyles every scene.
 *
 * A ground is ANY palette colour of the active theme, so this is exactly the 10
 * palette roles (see types/palette.ts) — the same address space accent params
 * use. It is deliberately NOT a per-theme list: a treatment names a role, and
 * whichever theme renders it supplies the colour.
 */
export const FRAME_GROUNDS = PALETTE_VARS;
export type FrameGround = PaletteVar;

/**
 * The backdrop MASK designs — a full-bleed overlay painted on top of the ground
 * COLOR (behind the content). Distinct from `ground`: ground is the base colour,
 * backdrop is the pattern/texture over it. Theme-agnostic + shareable — a theme
 * recolours the mask through its `--<design>-ink` hook. `plain` = no mask
 * (byte-identical to a bare ground). A theme declares its DEFAULT design
 * (ThemeTokens.backdrop); a scene may override the design here.
 *
 * This list is the whole vocabulary AND the whole pool: unlike decorations — which the
 * owning theme curates via `ThemeTokens.decorations` — backdrops carry no per-theme
 * roster. Every theme may use every design, because a design names no theme-specific
 * token; it paints through an `--<design>-ink` hook the using theme re-points.
 *
 * `constellation`, `gradient` and `hatch` are animated (a particle network, a slow-turning
 * two-tone wash, and angled vanishing stripes with a soothing hue drift — all driven off the
 * scene timeline via the backdrop anim-kind); `dots` and `grid` are static CSS. `gradient`,
 * `grid` and `hatch` were the root chrome's deck-wide `.mc-bg--gradient/grid/pattern` layers
 * before they became per-scene, role-recoloured designs.
 */
export const BACKDROP_NAMES = ["plain", "dots", "constellation", "gradient", "grid", "hatch", "sunburst"] as const;
export type BackdropName = (typeof BACKDROP_NAMES)[number];

// Decorations (star / tilt-rect / stripe / dot-grid) are authored per-treatment in
// the showcase and ship with the frame — there is no storyboard knob for them.

// SLOT_NAMES / SlotName and REPEAT_LISTS / RepeatList were REMOVED here.
//
// They were the vocabulary the FRAME BUILDER validated an annotated showcase against: the set of
// `data-slot` names its resolver could map to a spec field, and the `data-repeat` container names
// it cloned an item template into. Both were policed by tripwires that read
// `video-assets/themes/<theme>/frame-showcase.html` — and that builder, those showcases and those
// tripwires are all deleted. A treatment now declares its own slots in its own template.html and
// fills them through its own `fill()`, so a slot name is private to the element that owns it and
// there is nothing left for a shared list to keep in sync.
//
// They survived only as exported symbols with no reader in any of the three repos, which is worse
// than useless: a closed vocabulary that nothing enforces reads as a constraint on new work.

/**
 * The storyboard is per-scene PRESENTATION OPTIONS now, and nothing else.
 *
 * It used to carry `treatment` as well, which was the scene's look. That look is the spec
 * slide's own `kind` since the two vocabularies collapsed to one name, so storing it here was
 * storing a second copy of a field the spec already owns — free to disagree with it, and with
 * nothing able to say which copy was right. `buildAll` reads the look off the slide; this file
 * decides only how the scene is DRESSED (ground colour, backdrop mask, transition).
 */
const SceneStoryboardSchema = z.object({
  /** MUST equal a spec slide id — the builder cross-checks (tolerate-and-warn). */
  sceneId: id,
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
