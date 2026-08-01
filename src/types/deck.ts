// The deck interchange format — the serializable, editable record of a video's
// visual composition (per-slide treatment + resolved params / children /
// decorations / ground / anim). It is the JSON the standalone editor loads and
// saves, and a SUPERSET of compose.ts's SceneSpec, so the same data can drive the
// component render path. Derived from a spec via `specToDeck` (deck-map.ts).
//
// Extensible by design: the document is version-stamped and every object is
// LENIENT (`.loose()` — unknown keys survive validation), so the format can gain
// per-slide fields later (VO/caption params, transition timings/anims, …) without
// breaking existing files or the current editor. An editor edits only a subset of a
// scene's fields and merges over the loaded scene, so everything it doesn't own
// round-trips untouched — the merge itself belongs to whichever editor owns the
// controls (the web UI patches per control), not here.
import { z } from "zod";
import { AnimDescriptorSchema } from "../components/runtime/anim";
import { BACKDROP_NAMES, FRAME_GROUNDS, FRAME_THEME_NAMES, FRAME_TREATMENTS } from "./storyboard";
import { TIMING_PRESETS, TRANSITION_NAMES, TransitionSpecSchema } from "./transitions";

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

/** Sentinel `treatment` for a CUSTOM slide — one whose kind has no standard treatment
 *  (custom / matrix / composed / line-chart). A custom slide is not a component scene: its
 *  composition stays the legacy generic fallback and a deck rebuild passes it through
 *  untouched (never recomposed). It exists in the deck ONLY so the editor still LISTS the
 *  slide (read-only) — no slide is silently dropped. See `specToDeck` (which emits it),
 *  `buildDeckCompositions` (which skips it), and the editor's SceneCard (read-only card). */
export const CUSTOM_TREATMENT = "custom" as const;

/** One slide's composition — `treatment` + own-slot `params` + resolved `children`,
 *  with optional `decorations` / `ground` / `anim` overrides and the slide's VO ids.
 *  `treatment` is a real FRAME_TREATMENT for a component scene, or the CUSTOM_TREATMENT
 *  sentinel for a read-only custom slide the editor lists but does not render/edit. */
export const DeckSceneSchema = z
  .object({
    id: z.string().min(1),
    treatment: z.enum([...FRAME_TREATMENTS, CUSTOM_TREATMENT]),
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

// `SceneEdit` + `applySceneEdit` used to live here: the merge helper for the vanilla bundled
// editor (`bun cli editor`), whose only caller went away when the deck editor was rewritten as
// React in the web UI. They were deleted rather than kept "just in case" — the surviving copy
// collapsed an EMPTY `decorations` list to absent, which the render path reads as "inherit the
// theme's shapes" rather than the intended bare frame, so a helper nothing called was still
// encoding a rule that contradicts `composeTreatment` (and had tests asserting it). Merging an
// edit belongs to whichever editor owns the controls; the web UI patches per control.
