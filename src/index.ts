// Root barrel — the Node/Bun build API of the shared library (the surface the
// render harness consumes). Importing this registers every component/treatment
// (via ./components/registry) and re-exports the compose + runtime + theme API
// and the Zod contracts. The browser engine has its own entry (./engine).
import "./components/registry"; // side-effect: populate the runtime registry

export * from "./components/compose";
export * from "./components/runtime";
export { blockTheme } from "./components/themes/block/theme";
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
} from "./components/runtime/registry";

// The palette-role contract (the 10 shared colour vars every theme defines) —
// exported flat, not namespaced: the enums, the schemas and both consumers all
// address colours through it.
export * from "./types/palette";

// Zod contracts (the params / spec / deck vocabulary).
export * as spec from "./types/spec";
export * as storyboard from "./types/storyboard";
export * as transitions from "./types/transitions";
export * as deck from "./types/deck";
export * as components from "./types/components";
