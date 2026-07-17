// Browser engine entry — the surface the WebUI imports for the showcase + editor.
// The base chunk carries ONLY the runtime core (registry accessors, build/preview,
// fx bootstrap, the gallery/editor mount machinery) — no elements, no theme.
// `loadTheme(name)` dynamically imports a theme's registration payload (code-split
// into its own chunk), so the WebUI ships one payload per theme, not a monolith.
export { THEMES, loadTheme, type ThemeName } from "./load-theme";
export { mountShowcase, type ShowcaseHandle } from "./showcase";
export { mountEditor, type EditorHandle, type MountEditorOptions } from "./editor";
export { mountPreview, type MountOptions, type PreviewHandle } from "./mount";
export { bootstrapFx } from "./fx";
export { SHOWCASE_CHROME, EDITOR_CHROME } from "./chrome";

// Registry introspection + build API (element-free — these modules never import an
// element, so re-exporting them keeps the base chunk light).
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
export { buildPreview, type Preview } from "../components/runtime/emit";
export { rootContext } from "../components/runtime";
export type {
  ComponentFactory,
  ComponentInstance,
  ThemeTokens,
  TreatmentFactory,
  TreatmentInstance,
} from "../components/runtime/types";
// Deck contracts the editor consumers need.
export type { DeckDocument, DeckScene } from "../types/deck";
