// The palette contract — ONE finite set of 10 generically-named CSS custom
// properties that every theme defines. Themes differ only in which colour fills
// each role; component/treatment CSS never names a colour, only a role.
//
// Before this module each theme carried its own colour vocabulary (block's
// --pink/--blue/…, future's parallel --fx-* layer), so a shared skin could not
// address a colour without knowing which theme it was rendering under. The roles
// below are that shared address space: a skin says `var(--primary)`, and the
// active theme decides whether that is pink or cyan.
//
// Rules (see also each theme's `palette`):
//  - A theme MUST define all 10. There is no "unset" role.
//  - One colour MAY fill several roles (block's oat is both --muted-2 and
//    --muted-3). The UI de-dupes; the render doesn't care.
//  - Skins never write a hex or rgba(). Lighter/darker/translucent is DERIVED
//    from a role with color-mix() — see the header of any theme's *.css.
//  - The old colour names are GONE, not aliased. Roles are the only vocabulary;
//    a value that isn't one fails validation rather than being quietly folded.

/**
 * The 10 palette roles, in canonical order. This order is meaningful: when the
 * UI de-dupes a theme's palette down to its unique colours, the canonical value
 * for a colour is its FIRST role in this list (block's oat de-dupes to
 * `muted-2`, not `muted-3`).
 *
 * Used as: the CSS custom property names (`--primary`, …), the `FrameGround`
 * enum (a ground is any palette colour of the theme), and the accent enum for
 * every param that takes a palette colour.
 */
export const PALETTE_VARS = [
  "primary",
  "secondary",
  "accent-1",
  "accent-2",
  "accent-3",
  "muted-1",
  "muted-2",
  "muted-3",
  "light",
  "dark",
] as const;
export type PaletteVar = (typeof PALETTE_VARS)[number];

/**
 * The accent roles, in cycle order — the subset that reads as "an accent" under
 * every theme (the muted/light/dark roles are grounds and text, not accents).
 * Walk it with `ACCENT_CYCLE[i % ACCENT_CYCLE.length]` to colour a repeated list
 * without re-picking roles by hand: stat-grid's dots do exactly that, and the
 * WebUI's child-list editor offers the same order when seeding a new row.
 *
 * A treatment MAY deviate deliberately (feature-cards skips `accent-1` — block's
 * yellow is reserved as the CTA colour); the cycle is the default, not a rule.
 */
export const ACCENT_CYCLE = ["primary", "secondary", "accent-1", "accent-2"] as const satisfies readonly PaletteVar[];

/**
 * De-dupe a theme's 10-role palette down to its unique colours for display, in
 * canonical role order. A colour that fills several roles is listed ONCE, keyed
 * to its FIRST role — so block shows 8 swatches (oat and green collapse) and
 * future shows 9 (amber collapses), rather than 10 with visible duplicates.
 *
 * Used by the showcase Palette section and by every param control that offers a
 * palette colour, so the two never disagree about what a theme's colours are.
 */
export const uniquePaletteEntries = <T extends { hex: string }>(palette: readonly T[]): T[] => {
  const seen = new Set<string>();
  return palette.filter((sw) => {
    const key = sw.hex.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
