import { z } from "zod";

export const CoverSchema = z.object({
  headline: z
    .string()
    .max(80)
    .describe("The dominant title line — big, uppercase"),
  subtitle: z
    .string()
    .max(140)
    .optional()
    .describe("Supporting line under the headline; optional"),
  // NO `eyebrow`, deliberately — do not re-add one. The section label belongs to the HUD's
  // top-right corner, which is ROOT chrome and is drawn on the cover like any other scene.
  // The cover carried a second, duplicate consumer of the same words: the harness fed the
  // title slide's `kicker` to BOTH, so a deck's opening frame printed its section name twice,
  // once in the corner and once in a pill above the headline. Removing the pill is the fix —
  // the corner is the one that generalises, since every other kind reaches it too.
  // If the cover ever wants a label of its own, it needs its own SPEC FIELD, distinct from
  // `kicker`; the quote treatment keeps its `eyebrow` on exactly those terms (spec-map passes
  // it nothing, so the slot is showcase/editor-only until a field exists to fill it).
});
export type CoverParams = z.infer<typeof CoverSchema>;
