// The component/treatment registry. Populated by an explicit static barrel
// (src/components/registry.ts imports every element's index and calls
// register*) — no fs globbing, so the same registry works in the harness (Bun)
// and the showcase browser bundle (esbuild). A tripwire asserts the registry
// keys match the COMPONENT_NAMES / TREATMENT_NAMES tuples both directions.
import type { ComponentFactory, TreatmentFactory } from "./types";

const components = new Map<string, ComponentFactory>();
const treatments = new Map<string, TreatmentFactory>();

export const registerComponent = (factory: ComponentFactory): ComponentFactory => {
  if (components.has(factory.componentName)) {
    throw new Error(`duplicate component '${factory.componentName}'`);
  }
  components.set(factory.componentName, factory);
  return factory;
};

export const registerTreatment = (factory: TreatmentFactory): TreatmentFactory => {
  if (treatments.has(factory.treatmentName)) {
    throw new Error(`duplicate treatment '${factory.treatmentName}'`);
  }
  treatments.set(factory.treatmentName, factory);
  return factory;
};

export const getComponent = (name: string): ComponentFactory => {
  const f = components.get(name);
  if (!f) throw new Error(`unknown component '${name}' (registered: ${[...components.keys()].join(", ")})`);
  return f;
};

export const getTreatment = (name: string): TreatmentFactory => {
  const f = treatments.get(name);
  if (!f) throw new Error(`unknown treatment '${name}' (registered: ${[...treatments.keys()].join(", ")})`);
  return f;
};

export const hasComponent = (name: string): boolean => components.has(name);
export const hasTreatment = (name: string): boolean => treatments.has(name);

export const componentNames = (): string[] => [...components.keys()].sort();
export const treatmentNames = (): string[] => [...treatments.keys()].sort();

export const allComponents = (): ComponentFactory[] => [...components.values()];
export const allTreatments = (): TreatmentFactory[] => [...treatments.values()];
