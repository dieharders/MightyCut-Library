// The deck interchange format — the serializable, editable record of a video's
// visual composition (per-slide treatment + resolved params / children /
// decorations / ground / anim). It is the JSON the standalone editor loads and
// saves, and a SUPERSET of compose.ts's SceneSpec, so the same data can drive the
// component render path. Derived from a spec via `specToDeck` (deck-map.ts).
//
// Extensible by design: the document is version-stamped and every object is
// LENIENT (`.loose()` — unknown keys survive validation), so the format can gain
// per-slide fields later (VO/caption params, transition timings/anims, …) without
// breaking existing files or the current editor. The editor edits only a subset of
// a scene's fields; everything else round-trips untouched (see `applySceneEdit`).
import { z } from "zod";
import { AnimDescriptorSchema } from "../components/runtime/anim";
import type { ChildSpec } from "../components/compose";
import { BACKDROP_NAMES, FRAME_GROUNDS, FRAME_THEME_NAMES, FRAME_TREATMENTS, type BackdropName, type FrameGround } from "./storyboard";
import { TIMING_PRESETS, TRANSITION_NAMES, TransitionSpecSchema, type TransitionSpec } from "./transitions";

/** A resolved child (or decoration) instance: a registered component name + its
 *  params. Structurally identical to compose.ts's `ChildSpec` (all variation lives
 *  in `params`), so no `.loose()` is needed here. */
export const ChildSpecSchema = z.object({
  name: z.string().min(1),
  params: z.record(z.string(), z.unknown()).optional(),
  animIn: z.enum(TRANSITION_NAMES).optional(),
  timeIn: z.enum(TIMING_PRESETS).optional(),
});

/** One editable caption line: the id ties it back to a `spec.voiceover[]` line (and
 *  its audio clip / manifest entry); `text` is the on-screen caption. `max(220)`
 *  mirrors `VOLineSchema.text` so the editor's edit is rejected at the deck layer if
 *  it overflows. The spoken `say` override is intentionally NOT carried — editing a
 *  caption's text does not re-synthesize audio (see the deck POST write-back). */
export const DeckVoLineSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(220),
});

/** One slide's composition — `treatment` + own-slot `params` + resolved `children`,
 *  with optional `decorations` / `ground` / `anim` overrides and the slide's VO ids. */
export const DeckSceneSchema = z
  .object({
    id: z.string().min(1),
    treatment: z.enum(FRAME_TREATMENTS),
    params: z.record(z.string(), z.unknown()),
    children: z.array(ChildSpecSchema),
    decorations: z.array(ChildSpecSchema).optional(),
    ground: z.enum(FRAME_GROUNDS).optional(),
    backdrop: z.enum(BACKDROP_NAMES).optional(),
    anim: z.array(AnimDescriptorSchema).optional(),
    transition: TransitionSpecSchema.optional(),
    voIds: z.array(z.string()).optional(),
    /** The slide's VO/caption lines (id + editable on-screen text). Surfaced in the
     *  editor's Captions section; the deck POST writes edits back to spec.json. */
    vo: z.array(DeckVoLineSchema).optional(),
  })
  .loose();

export const DeckMetaSchema = z
  .object({
    title: z.string().optional(),
    requester: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    fps: z.number().optional(),
  })
  .loose();

export const DeckDocumentSchema = z
  .object({
    version: z.literal(1),
    theme: z.enum(FRAME_THEME_NAMES),
    meta: DeckMetaSchema.optional(),
    scenes: z.array(DeckSceneSchema),
  })
  .loose();

export type DeckScene = z.infer<typeof DeckSceneSchema>;
export type DeckMeta = z.infer<typeof DeckMetaSchema>;
export type DeckDocument = z.infer<typeof DeckDocumentSchema>;
export type DeckVoLine = z.infer<typeof DeckVoLineSchema>;

/** The subset of a scene the editor owns and overwrites on save. */
export type SceneEdit = {
  params: Record<string, unknown>;
  children: ChildSpec[];
  decorations?: ChildSpec[];
  ground?: FrameGround;
  backdrop?: BackdropName;
  transition?: TransitionSpec;
  vo?: DeckVoLine[];
};

/**
 * Merge an editor edit over the originally-loaded scene: overwrite ONLY the fields
 * the editor owns (`params`/`children`/`decorations`/`ground`/`backdrop`) and carry
 * everything else through untouched — `id`, `treatment`, `anim`, `voIds`, and any field
 * not surfaced in the editor. Empty decorations / unset ground / unset backdrop mirror
 * "absent", so a scene that inherited treatment defaults stays identical on an unedited round-trip.
 */
export const applySceneEdit = (original: DeckScene, edit: SceneEdit): DeckScene => {
  const next: DeckScene = { ...original, params: edit.params, children: edit.children };
  if (edit.decorations && edit.decorations.length) next.decorations = edit.decorations;
  else delete next.decorations;
  if (edit.ground) next.ground = edit.ground;
  else delete next.ground;
  if (edit.backdrop) next.backdrop = edit.backdrop;
  else delete next.backdrop;
  if (edit.transition) next.transition = edit.transition;
  else delete next.transition;
  // `vo` is always present (from specToDeck) — the `{ ...original }` spread carries an
  // unedited list through; an edited list from the Captions section overrides it. Unlike
  // decorations/ground/transition it is never stripped (losing it would drop caption data).
  if (edit.vo) next.vo = edit.vo;
  return next;
};
