// The CAPSULE theme payload — the lazy per-theme chunk (mirror of register-future.ts).
// Importing this module (only via `loadTheme('capsule')`'s dynamic import) registers the
// shared element trios (idempotent — ES module caching runs the registry side-effect once
// across theme payloads) and returns capsule's tokens. Capsule is the first theme with an
// ADD-ON face: Space Grotesk (--body/--mono) rides along in the core chrome set, but Bodoni
// Moda (--disp) is capsule's own, so this payload injects BOTH sheets. Vite code-splits this
// module into its own chunk, so the base engine bundle never carries the inlined Bodoni.
import "../components/registry"; // side-effect: registers every element (shared, idempotent)
import { capsuleTheme } from "../components/themes/capsule/theme";
import type { ThemeTokens } from "../components/runtime/types";
import { injectCoreFonts } from "./core-fonts";
import { injectCapsuleFonts } from "./capsule-fonts";

export const registerCapsule = (): ThemeTokens => {
  injectCoreFonts(); // Space Grotesk (--body / --mono) — the always-staged core set
  injectCapsuleFonts(); // Bodoni Moda (--disp) — capsule's add-on faces
  return capsuleTheme;
};
