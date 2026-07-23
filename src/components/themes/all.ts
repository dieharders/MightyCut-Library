// Every converted theme's tokens, as ONE list — so tooling and tests can assert a
// behaviour across all themes instead of naming one (a per-theme test is how a
// converted theme silently drifts from the reference theme it was ported from).
//
// TEST / TOOLING ONLY: do NOT import this from engine or render code paths. The
// engine loads themes LAZILY (engine/load-theme.ts) so each theme is its own Vite
// chunk; a static barrel like this pulls every theme into whatever bundles it.
// boxless-reveal.test.ts pins this list to engine/THEMES, so a newly converted theme
// fails the suite until it is added here — and then every theme-generic sweep that
// iterates ALL_THEMES covers it automatically.
import type { ThemeTokens } from "../runtime/types";
import { blockTheme } from "./block/theme";
import { futureTheme } from "./future/theme";

/** All live themes, in conversion order (block is the reference implementation). */
export const ALL_THEMES: ThemeTokens[] = [blockTheme, futureTheme];
