// Canonical vocabulary for the component/treatment system — the drift-proof SSOT
// the registry, the agent/CLI tools, and the showcase share (mirrors the pattern
// in storyboard.ts). A tripwire (src/components/registry.test.ts) asserts the
// live registry's keys equal these tuples, both directions.
import { FRAME_TREATMENTS } from "./storyboard";

/**
 * Reusable leaf components — sub-slide pieces composed into treatments (and
 * available to the agent via build_component). Each is a folder trio under
 * src/components/primitives/<name>/.
 */
export const COMPONENT_NAMES = [
  "stat", // → stat-grid
  "card", // → feature-cards
  "step", // → timeline
  "agenda-item", // → agenda
  "bar", // → chart (vertical column)
  "rank", // → bar-ranking (horizontal ranked row)
  "row", // → comparison (ledger row)
  // Chrome / decorative leaf pieces — library + showcase (no treatment child role):
  "caption", // VO-transcript pill (root caption rail in render)
  "pill", // label / eyebrow pill
  "cta", // call-to-action button
  "list-number", // numbered index row
  // Decoration families — positioned page-space flourishes any treatment can add.
  // Each has its OWN disjoint shape-variant list (no two render the same shape), and
  // is INTRINSICALLY a decoration (ComponentFactory.decoration) so it's held out of the
  // showcase Components grid; a theme rosters only its own via ThemeTokens.decorations.
  // block's neobrutalist set:
  "starburst", // star · burst · triangle · circle
  "slab", // square · rectangle · rhombus · hexagon · cross
  "stripe", // stripe · bars · grid
  "badge", // shield · tag · ticket · capsule
  // future's sci-fi set (luminous strokes + glow, --fx-* accents):
  "node", // ring · core · orbit · pulse
  "reticle", // brackets · crosshair · gauge · frame
  "glyph", // hexagon · diamond · chevron · triangle
  "signal", // waveform · bars · beam
  "icon", // inline-SVG icon from the shared set
  "hud", // full-frame HUD overlay composite
] as const;
export type ComponentName = (typeof COMPONENT_NAMES)[number];

/**
 * The whole-slide treatments — identical set to the frame system's
 * FRAME_TREATMENTS (a tripwire asserts equality), so a deck can move between the
 * legacy frame builder and the component builder without a vocabulary change.
 */
export const TREATMENT_NAMES = FRAME_TREATMENTS;
export type TreatmentName = (typeof TREATMENT_NAMES)[number];
