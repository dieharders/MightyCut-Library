// The FUTURE theme payload — the lazy per-theme chunk (mirror of register-block.ts).
// Importing this module (only via `loadTheme('future')`'s dynamic import) registers the
// shared element trios (idempotent — ES module caching runs the registry side-effect once
// across theme payloads) and returns future's tokens. Future's content fonts (Space Grotesk
// / Inter / JetBrains Mono) are all in the core set, so it injects the same core faces —
// no add-on woff2.
import "../components/registry"; // side-effect: registers every element (shared, idempotent)
import { futureTheme } from "../components/themes/future/theme";
import type { ThemeTokens } from "../components/runtime/types";
import { injectCoreFonts } from "./core-fonts";

export const registerFuture = (): ThemeTokens => {
  injectCoreFonts();
  return futureTheme;
};
