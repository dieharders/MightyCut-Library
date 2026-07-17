// Transition vocabulary — the leaf tuples + Zod schemas shared by the data model
// (spec.ts / deck.ts / storyboard.ts / compose.ts) and the runtime catalog
// (src/components/runtime/transitions.ts). Kept import-clean (zod only) so the
// `src/types` layer never pulls in `src/components` runtime code.
//
// A transition is a NAMED, canned effect shared by ALL themes, plus a DURATION
// preset (short/medium/long). Components carry an in-transition only; treatments
// (whole scene page) carry both an in and an out.
import { z } from "zod";

/** Timing presets — the transition's DURATION in seconds. */
export const TIMING_PRESETS = ["short", "medium", "long"] as const;
export type TimingPreset = (typeof TIMING_PRESETS)[number];
export const TIMING_SECONDS: Record<TimingPreset, number> = { short: 1, medium: 3, long: 5 };

/** The shared, theme-agnostic transition catalog names. `none` = no transition. */
export const TRANSITION_NAMES = [
  "none",
  "fade",
  "rise",
  "fall",
  "scale",
  "pop",
  "slide-left",
  "slide-right",
  "slide-up",
  "slide-down",
  "wipe",
] as const;
export type TransitionName = (typeof TRANSITION_NAMES)[number];

const nameSchema = z.enum(TRANSITION_NAMES);
const timeSchema = z.enum(TIMING_PRESETS);

/** Scene (treatment) transition: whole-page IN at scene start + OUT at scene end. */
export const TransitionSpecSchema = z.object({
  animIn: nameSchema.optional().describe("Effect the scene page enters with (default a soft fade)"),
  animOut: nameSchema.optional().describe("Effect the scene page exits with (default none / hard cut)"),
  timeIn: timeSchema.optional().describe("IN duration: short=1s, medium=3s, long=5s"),
  timeOut: timeSchema.optional().describe("OUT duration: short=1s, medium=3s, long=5s"),
});
export type TransitionSpec = z.infer<typeof TransitionSpecSchema>;

/** Component (leaf) transition: a whole-element entrance only (no exit). */
export const ComponentTransitionSchema = z.object({
  animIn: nameSchema.optional().describe("Effect the element enters with"),
  timeIn: timeSchema.optional().describe("IN duration: short=1s, medium=3s, long=5s"),
});
export type ComponentTransition = z.infer<typeof ComponentTransitionSchema>;
