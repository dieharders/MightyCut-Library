// The PROFESSIONAL theme payload — the lazy per-theme chunk. Importing this module (only via
// `loadTheme('professional')`'s dynamic import) registers the shared element trios (idempotent —
// ES module caching runs the registry side-effect once across theme payloads) and returns
// professional's tokens. Unlike block/future (core faces) and capsule (core + one add-on),
// professional's content faces are ENTIRELY its own — Libre Baskerville + IBM Plex Sans — so this
// payload injects ONLY the professional add-on sheet, not the core chrome set (professional
// references no core face). Vite code-splits this into its own chunk.
import "../components/registry"; // side-effect: registers every element (shared, idempotent)
import { professionalTheme } from "../components/themes/professional/theme";
import type { ThemeTokens } from "../components/runtime/types";
import { injectProfessionalFonts } from "./professional-fonts";

export const registerProfessional = (): ThemeTokens => {
  injectProfessionalFonts(); // Libre Baskerville (--disp) + IBM Plex Sans (--body/--mono)
  return professionalTheme;
};
