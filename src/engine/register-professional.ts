// The PROFESSIONAL theme payload — the lazy per-theme chunk (mirror of register-block.ts).
// Importing this module (only via `loadTheme('professional')`'s dynamic import) registers the
// shared element trios (idempotent — ES module caching runs the registry side-effect once across
// theme payloads) and returns professional's tokens. Like block, professional's content faces
// (Space Grotesk --disp / Inter --body) are a subset of the always-staged core chrome set, so it
// injects ONLY the core set — no add-on woff2 of its own. Vite code-splits this into its own chunk.
import "../components/registry"; // side-effect: registers every element (shared, idempotent)
import { professionalTheme } from "../components/themes/professional/theme";
import type { ThemeTokens } from "../components/runtime/types";
import { injectCoreFonts } from "./core-fonts";

export const registerProfessional = (): ThemeTokens => {
  injectCoreFonts(); // Space Grotesk (--disp/--mono) + Inter (--body) — the always-staged core set
  return professionalTheme;
};
