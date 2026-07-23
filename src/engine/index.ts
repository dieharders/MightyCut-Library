// Browser engine entry — the surface the web UI imports. The engine draws ONLY the
// vanilla component/treatment PREVIEW (via mountPreview, so it matches the MP4
// render); every surrounding UI element (gallery, cards, param forms, toolbar,
// editor) is native React/Tailwind in the web UI. The rest of this module is the
// data the React chrome needs: the registry, per-element JSON schemas + defaults,
// instance builders, theme tokens, and the deck/transition vocab.
//
// The base chunk carries only the runtime core; `loadTheme(name)` dynamically
// imports a theme's registration payload (code-split per theme).
export { THEMES, loadTheme, type ThemeName } from "./load-theme";
export { mountPreview, type MountPreviewOptions, type PreviewHandle } from "./mount";
export { bootstrapFx } from "./fx";

// Registry introspection (element-free modules — keep the base chunk light).
export {
  allComponents,
  allTreatments,
  componentNames,
  treatmentNames,
  getComponent,
  getTreatment,
  hasComponent,
  hasTreatment,
} from "../components/runtime/registry";

// Instance builders — validate params + children into a renderable instance (throw
// a formatted issue string on bad input, so the React form can surface it).
export {
  composeComponent,
  composeTreatment,
  composeScene,
  type ChildSpec,
  type SceneSpec,
  type ComposeOpts,
} from "../components/compose";

// Types the React chrome renders against.
export type {
  ComponentFactory,
  ComponentInstance,
  PaletteSwatch,
  ThemeRules,
  ThemeTokens,
  TreatmentFactory,
  TreatmentInstance,
  TypeSpec,
} from "../components/runtime/types";

// The palette-role contract. The React chrome renders every colour param and the
// showcase Palette section from these: the 10 role names, the fold that absorbs the
// legacy colour vocabulary saved decks still carry, and the by-hex de-dupe that turns
// a theme's 10 roles into its unique COLOURS. Exported here (not only from the Bun
// entry) because the web UI reaches the library exclusively through `/engine`.
export {
  PALETTE_VARS,
  ACCENT_CYCLE,
  uniquePaletteEntries,
  type PaletteVar,
} from "../types/palette";

// Vocab for the React form controls.
export {
  TRANSITION_NAMES,
  TIMING_PRESETS,
  TIMING_SECONDS,
  type TransitionName,
  type TimingPreset,
  type TransitionSpec,
} from "../types/transitions";
export {
  FRAME_GROUNDS,
  FRAME_TREATMENTS,
  BACKDROP_NAMES,
  type FrameGround,
  type FrameTreatment,
  type BackdropName,
} from "../types/storyboard";
export { COMPONENT_NAMES, TREATMENT_NAMES } from "../types/components";

// Deck contracts (the editor edits + round-trips these).
export {
  DeckDocumentSchema,
  applySceneEdit,
  type DeckDocument,
  type DeckScene,
  type DeckVoLine,
  type SceneEdit,
} from "../types/deck";
