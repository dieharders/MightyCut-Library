// The `:root` token block every theme emits as its `ThemeTokens.css`.
//
// This used to be a six-line template literal copy-pasted verbatim into all six
// theme.ts files. It lives here once now because the block grew: it carries the 10
// palette roles, the font families, the 8-step type ladder, the 5 leading steps and
// the 2 tracking roles, and six hand-maintained copies of that is six chances for a
// theme to silently omit a token nothing would notice was missing.
//
// The output is a single flat `:root { … }` rule, which matters for both consumers:
// the harness writes it to a project's assets/tokens.css verbatim, and the browser
// preview rescopes it with `theme.css.replace(/:root/g, ":host")` to scope the tokens
// into a shadow root (engine/mount.ts) — the showcase does the same against
// `.mc-type-tokens`. A nested or multi-rule block would break both rewrites.
import type { Leading, Tracking, TypeScale } from "../../types/typescale";
import { LEADING_VARS, TEXT_VARS, TRACKING_VARS } from "../../types/typescale";
import type { PaletteSwatch } from "./types";

export type TokenInput = {
  /** The theme's 10 palette roles, in canonical order (types/palette.ts). */
  palette: readonly PaletteSwatch[];
  /** Font FAMILIES, keyed by role: `{ disp, body, mono }`. Names are the theme's
   *  choice — three is the convention, not a limit — so this stays a loose record. */
  fontTokens: Record<string, string>;
  /** The theme's size for each of the 8 shared type steps. */
  typeScale: TypeScale;
  /** The theme's 5 line-height steps. */
  leading: Leading;
  /** The theme's display + label tracking. */
  tracking: Tracking;
};

/**
 * Build a theme's `:root` block from its token DATA — every value written down exactly
 * once, in a stable order (palette roles → families → type steps → leading → tracking)
 * so the generated CSS is byte-stable across builds.
 *
 * Iteration is driven by the canonical `*_VARS` lists rather than by `Object.entries`
 * of the caller's literal: a theme that declares its steps out of order still emits
 * them in ladder order, and a missing step is a TypeScript error at the call site
 * rather than a token that quietly vanishes from `:root`.
 */
export const buildTokensCss = ({ palette, fontTokens, typeScale, leading, tracking }: TokenInput): string =>
  `:root {\n${[
    ...palette.map((p) => `  --${p.varName}: ${p.hex.toLowerCase()};`),
    ...Object.entries(fontTokens).map(([name, value]) => `  --${name}: ${value};`),
    ...TEXT_VARS.map((k) => `  --text-${k}: ${typeScale[k]};`),
    ...LEADING_VARS.map((k) => `  --lh-${k}: ${leading[k]};`),
    ...TRACKING_VARS.map((k) => `  --track-${k}: ${tracking[k]};`),
  ].join("\n")}\n}\n`;
