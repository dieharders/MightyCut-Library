// Animation descriptors — the single, JSON-serializable animation model shared
// by the render pipeline and the interactive showcase. A component/treatment
// declares its motion as a list of AnimDescriptors (kind + target + time);
// the emitter serializes them to ONE inline `MC.applyAnims(...)` call in the
// slide's <script>, and the showcase drives the SAME descriptors through the
// SAME `MC.applyAnims` interpreter (the library's assets/fx/mc.js) on hover.
// Because both sides run one interpreter, the showcase is WYSIWYG with render.
//
// Timing NEVER uses hardcoded seconds for content reveals: `line`/`index` key to
// VO-line offsets resolved at render time (at/atIndex/lineId are in scope in the
// sub-composition script). `seconds` exists only for the fixed page entrance.
import { z } from "zod";

export const AnimTimeSchema = z
  .union([
    z
      .object({
        at: z.literal("line"),
        n: z.number().int().min(0).describe("VO line index this reveal keys to (0 = first line)"),
        plus: z.number().optional().describe("Seconds added to the fallback stagger"),
      })
      .describe("Fire at the Nth VO line's start (fallback: a small staggered offset)"),
    z
      .object({
        at: z.literal("index"),
        n: z.number().int().min(0),
        plus: z.number().optional(),
      })
      .describe("Fire at the Nth narration offset (atIndex)"),
    z.object({ at: z.literal("leadIn"), plus: z.number().optional() }).describe("Fire at the scene lead-in"),
    z.object({ at: z.literal("seconds"), t: z.number() }).describe("Fire at a fixed second (entrance only)"),
    z
      .object({
        at: z.literal("slot"),
        n: z.number().int().min(0).describe("Ordered cascade slot (0 = first-revealed element)"),
        plus: z.number().optional().describe("The element's own internal offset within its slot"),
        d: z.number().optional().describe("Per-treatment default slot delay (s), before caption-count tightening"),
      })
      .describe("Fire at an ordered cascade slot; the runtime derives the per-slot delay from caption count"),
  ])
  .describe("When an animation fires — keyed to narration, not wall-clock");
export type AnimTime = z.infer<typeof AnimTimeSchema>;

export const ANIM_KINDS = [
  "riseIn",
  "fadeIn",
  "staggerIn",
  "rule",
  "float",
  "countUp",
  "growBar",
  "scaleIn",
  "from",
  "backdrop",
] as const;
export type AnimKind = (typeof ANIM_KINDS)[number];

export const AnimDescriptorSchema = z.object({
  kind: z.enum(ANIM_KINDS).describe("Which MC.* motion to apply"),
  target: z.string().min(1).describe("The element's data-anim id (before scoping)"),
  time: AnimTimeSchema,
  opts: z
    .record(z.string(), z.union([z.number(), z.string(), z.boolean()]))
    .optional()
    .describe("Tween options: dist, dur, ease, each (stagger), to/decimals/prefix/suffix (countUp), prop/from"),
});
export type AnimDescriptor = z.infer<typeof AnimDescriptorSchema>;

/** Shift a content anim's line/index by `addN` and its stagger fallback by `addPlus`
 *  (used when composing a component as the i-th child of a treatment). */
export const offsetAnim = (a: AnimDescriptor, addN: number, addPlus: number): AnimDescriptor => {
  const t = a.time;
  if (t.at === "line" || t.at === "index") {
    return { ...a, time: { ...t, n: t.n + addN, plus: (t.plus ?? 0) + addPlus } };
  }
  return a;
};

/** Rewrite a local `target` (a data-anim id) to a fully-qualified scoped class. */
export const qualifyAnim = (a: AnimDescriptor, prefix: string): AnimDescriptor => ({
  ...a,
  target: `${prefix}-${a.target}`,
});

/** Re-anchor a reveal to an ordered cascade slot, preserving the element's own internal
 *  offset (its declared `plus`) so a component keeps its own internal timing. `delay` is the
 *  treatment's default slot delay; the runtime tightens it by the slide's caption count.
 *  This is how a treatment schedules WHEN each element reveals while the element still owns
 *  HOW it animates — replacing the old VO-line-keyed `offsetAnim` shift for children. */
export const toSlot = (a: AnimDescriptor, slot: number, delay: number): AnimDescriptor => {
  const t = a.time;
  const plus = t.at === "line" || t.at === "index" || t.at === "leadIn" || t.at === "slot" ? (t.plus ?? 0) : 0;
  return { ...a, time: { at: "slot", n: slot, plus, d: delay } };
};

// Break any "</script" the JSON might contain (e.g. a caption string), so the
// inline <script> can't be terminated early. Mirrors sub-composition.ts:js().
const CLOSE_SCRIPT = /<\//g;

/** Serialize anim descriptors to the single inline call the sub-comp <script> runs.
 *  Returns "" when there is nothing to animate. */
export const serializeAnims = (anims: AnimDescriptor[]): string => {
  if (anims.length === 0) return "";
  const json = JSON.stringify(anims).replace(CLOSE_SCRIPT, "<\\/");
  // voCount = the slide's caption count (drives the runtime slot-delay); `voIds` is a var in
  // the sub-composition <script> the preamble already defines, so no wrapper change is needed.
  // `dur` (scene duration) is also a preamble var — an animated backdrop spans the scene.
  return `          MC.applyAnims(tl, ${json}, { q: q, qa: qa, at: at, atIndex: atIndex, lineId: lineId, leadIn: leadIn, voCount: voIds.length, dur: dur, page: page });`;
};
