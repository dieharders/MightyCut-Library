/**
 * Reusable leaf components — sub-slide pieces composed into treatments (and
 * available to the agent via build_component). Each is a folder trio under
 * src/components/primitives/<name>/.
 */
export declare const COMPONENT_NAMES: readonly ["stat", "card", "step", "agenda-item", "bar", "rank", "row", "caption", "pill", "cta", "list-number", "starburst", "slab", "stripe", "badge", "icon", "hud"];
export type ComponentName = (typeof COMPONENT_NAMES)[number];
/**
 * The whole-slide treatments — identical set to the frame system's
 * FRAME_TREATMENTS (a tripwire asserts equality), so a deck can move between the
 * legacy frame builder and the component builder without a vocabulary change.
 */
export declare const TREATMENT_NAMES: readonly ["cover", "feature-cards", "stat-grid", "closing-plate", "quote", "timeline", "comparison", "chart", "bar-ranking", "agenda"];
export type TreatmentName = (typeof TREATMENT_NAMES)[number];
