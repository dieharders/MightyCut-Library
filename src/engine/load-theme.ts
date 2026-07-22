// Per-theme lazy loader — kept in its own module (no import of the mount
// wrappers) so showcase.ts / editor.ts can import loadTheme without a cycle
// through index.ts. `loadTheme(name)` dynamically imports a theme's registration
// payload, which Vite code-splits into its own chunk (one payload per theme).
import type { ThemeTokens } from "../components/runtime/types";

/** Theme values the engine can lazily register (grows as themes are converted). */
export const THEMES = ["block", "future"] as const;
export type ThemeName = (typeof THEMES)[number];

/** Lazily register a theme's elements + inject its fonts, returning its tokens. */
export const loadTheme = async (name: ThemeName | string): Promise<ThemeTokens> => {
  switch (name) {
    case "block": {
      const m = await import("./register-block");
      return m.registerBlock();
    }
    case "future": {
      const m = await import("./register-future");
      return m.registerFuture();
    }
    default:
      throw new Error(`unknown theme: ${name} (available: ${THEMES.join(", ")})`);
  }
};
