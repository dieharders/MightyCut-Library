// The STANDARD theme payload — the lazy per-theme chunk (mirror of register-capsule.ts).
// Importing this module (only via `loadTheme('standard')`'s dynamic import) registers the shared
// element trios (idempotent — ES module caching runs the registry side-effect once across theme
// payloads) and returns standard's tokens. Standard's faces straddle the two tiers: Inter
// (--body/--mono) rides along in the core chrome set, while Playfair Display (--disp) is its own,
// so this payload injects BOTH sheets. Vite code-splits this module into its own chunk, so the
// base engine bundle never carries the inlined Playfair.
import "../components/registry"; // side-effect: registers every element (shared, idempotent)
import { standardTheme } from "../components/themes/standard/theme";
import type { ThemeTokens } from "../components/runtime/types";
import { injectCoreFonts } from "./core-fonts";
import { injectStandardFonts } from "./standard-fonts";

export const registerStandard = (): ThemeTokens => {
  injectCoreFonts(); // Inter (--body / --mono) — the always-staged core set
  injectStandardFonts(); // Playfair Display upright + italic (--disp) — standard's add-on faces
  return standardTheme;
};
