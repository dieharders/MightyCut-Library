import type { ThemeTokens } from "../components/runtime/types";
/** Theme values the engine can lazily register (grows as themes are converted). */
export declare const THEMES: readonly ["block"];
export type ThemeName = (typeof THEMES)[number];
/** Lazily register a theme's elements + inject its fonts, returning its tokens. */
export declare const loadTheme: (name: ThemeName | string) => Promise<ThemeTokens>;
