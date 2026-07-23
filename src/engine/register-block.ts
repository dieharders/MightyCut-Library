// The BLOCK theme payload — the lazy per-theme chunk. Importing this module
// (only ever via `loadTheme('block')`'s dynamic import) pulls in every element
// trio + the block theme tokens, registers them in the runtime registry, and
// injects the core content fonts (inlined, shared with future via core-fonts.ts).
// Vite code-splits this into its own chunk, so the base engine ships without any
// theme and the WebUI fetches one payload per theme. The element registry is shared
// across themes (structure + behavior are theme-agnostic; a theme supplies only
// tokens/skins/templates).
import "../components/registry"; // side-effect: registerComponent/registerTreatment for every element
import { blockTheme } from "../components/themes/block/theme";
import type { ThemeTokens } from "../components/runtime/types";
import { injectCoreFonts } from "./core-fonts";

export const registerBlock = (): ThemeTokens => {
  injectCoreFonts();
  return blockTheme;
};
