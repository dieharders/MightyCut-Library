// The CREATIVE theme payload — the lazy per-theme chunk. Importing this module (only via
// `loadTheme('creative')`'s dynamic import) registers the shared element trios (idempotent — ES
// module caching runs the registry side-effect once across theme payloads) and returns creative's
// tokens. All three of creative's faces — Archivo Black (--disp), Space Grotesk (--body) and
// JetBrains Mono (--mono) — are already in the CORE chrome set, so this payload injects core
// alone and ships no add-on sheet: unlike capsule (core + Bodoni) and professional (its own two
// faces, no core), creative adds no font bytes at all. Vite code-splits this into its own chunk.
import "../components/registry"; // side-effect: registers every element (shared, idempotent)
import { creativeTheme } from "../components/themes/creative/theme";
import type { ThemeTokens } from "../components/runtime/types";
import { injectCoreFonts } from "./core-fonts";

export const registerCreative = (): ThemeTokens => {
  injectCoreFonts(); // Archivo Black + Space Grotesk + JetBrains Mono are all core faces
  return creativeTheme;
};
