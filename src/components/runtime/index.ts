// Public API for the component runtime.
export { component, type ComponentDef } from "./component";
export { treatment, type TreatmentDef } from "./treatment";
export {
  AnimDescriptorSchema,
  AnimTimeSchema,
  ANIM_KINDS,
  offsetAnim,
  qualifyAnim,
  serializeAnims,
  type AnimDescriptor,
  type AnimKind,
  type AnimTime,
} from "./anim";
export { collectCss, scopeCss } from "./css";
export { scrubDeterminism } from "./determinism";
export { buildPreview, buildScene, renderScene, type Preview, type SceneOverrides } from "./emit";
export {
  allComponents,
  allTreatments,
  componentNames,
  getComponent,
  getTreatment,
  hasComponent,
  hasTreatment,
  registerComponent,
  registerTreatment,
  treatmentNames,
} from "./registry";
export type {
  BuildContext,
  BuildMode,
  BuildNode,
  BuildResult,
  ComponentFactory,
  ComponentInstance,
  PaletteSwatch,
  ThemeRules,
  ThemeTokens,
  TreatmentFactory,
  TreatmentInstance,
  TypeSpec,
} from "./types";

import type { BuildContext, BuildMode, ThemeTokens } from "./types";

/** Convenience: a root build context (a top-level instance, idPrefix == compId). */
export const rootContext = (
  compId: string,
  theme: ThemeTokens,
  opts?: { mode?: BuildMode; voIds?: string[] },
): BuildContext => ({
  compId,
  idPrefix: compId,
  theme,
  mode: opts?.mode ?? "render",
  voIds: opts?.voIds,
});
