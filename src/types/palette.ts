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
 * The default accent cycle for `defaultChildren` and any repeated-accent loop
 * (stat dots, card icon squares, chart columns). Four slots — the roles that
 * read as "an accent" in every theme; the muted/light/dark roles are grounds and
 * text, not accents.
 */
export const ACCENT_CYCLE = ["primary", "secondary", "accent-1", "accent-2"] as const satisfies readonly PaletteVar[];

/**
 * Legacy colour-token names → their palette role. Kept PERMANENTLY on the READ
 * path (storyboard/deck ground, accent params): stored decks persist the value
 * that was current when they were saved, so a deck written before this migration
 * still names `pink`/`fx-cyan`. Nothing WRITES these anymore — `normalizePaletteVar`
 * folds them to a role on the way in, and every code path downstream sees a role.
 *
 * Two vocabularies are folded here: block's palette names (which doubled as the
 * shared ground/accent vocabulary) and future's --fx-* identity tokens.
 */
export const LEGACY_PALETTE_ALIASES = {
  // block's palette names
  pink: "primary",
  blue: "secondary",
  yellow: "accent-1",
  green: "accent-2",
  cream: "muted-1",
  offwhite: "muted-2",
  white: "light",
  black: "dark",
  // future's --fx-* identity tokens (both with and without the fx- prefix, since
  // the decoration accent enum used the bare name: `accent: "cyan"` → --fx-cyan)
  cyan: "primary",
  "fx-cyan": "primary",
  amber: "secondary",
  "fx-amber": "secondary",
  "fx-green": "accent-1",
  violet: "accent-2",
  "fx-violet": "accent-2",
  "fx-muted": "muted-1",
  "fx-navy": "muted-2",
  "fx-panel-solid": "muted-3",
  ink: "light",
  "fx-ink": "light",
  "fx-abyss": "dark",
} as const satisfies Record<string, PaletteVar>;

export type LegacyPaletteName = keyof typeof LEGACY_PALETTE_ALIASES;

/** Every value a palette-colour field accepts on the READ path: the 10 roles plus
 *  every legacy name. Write paths use `PALETTE_VARS` alone. */
export const PALETTE_VARS_WITH_LEGACY = [
  ...PALETTE_VARS,
  ...(Object.keys(LEGACY_PALETTE_ALIASES) as LegacyPaletteName[]),
] as const;

const ALIAS_LOOKUP: Record<string, PaletteVar> = LEGACY_PALETTE_ALIASES;
const ROLE_LOOKUP = new Set<string>(PALETTE_VARS);

/**
 * Fold any accepted palette-colour value to its canonical role. A role passes
 * through; a legacy name maps; anything else falls back to `primary` (the read
 * path is validated by a Zod enum first, so this is belt-and-braces for callers
 * that hand-roll a value).
 */
export const normalizePaletteVar = (value: string): PaletteVar =>
  ROLE_LOOKUP.has(value) ? (value as PaletteVar) : (ALIAS_LOOKUP[value] ?? "primary");

/**
 * Repair a params object that failed schema validation by folding any legacy colour
 * NAME it carries to the palette role that replaced it — so a deck saved before this
 * migration (`accent: "pink"`, `variant: "cyan"`) still composes.
 *
 * Deliberately applied ONLY as a repair, after `schema.safeParse` has already failed
 * (see runtime/component.ts + runtime/treatment.ts). Params that validate are never
 * touched, which is what makes a blind by-value fold safe: a decoration's shape
 * `variant: "hexagon"` or any other non-colour enum passes validation and never
 * reaches this function. Values that are not legacy colour names are left alone, so
 * the fold can only ever turn an invalid value into a valid one.
 *
 * The accent enums themselves stay a plain `z.enum(PALETTE_VARS)` — no Zod transform —
 * so `z.toJSONSchema(schema, {io:"input"})` keeps emitting exactly the 10 roles to the
 * Pi agent tool bridge and the web UI's ParamForm. Legacy names are accepted, never
 * advertised.
 */
export const foldLegacyPaletteParams = (input: unknown): unknown => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return input;
  let changed = false;
  const out: Record<string, unknown> = { ...(input as Record<string, unknown>) };
  for (const [key, value] of Object.entries(out)) {
    if (typeof value === "string" && value in ALIAS_LOOKUP) {
      out[key] = ALIAS_LOOKUP[value];
      changed = true;
    }
  }
  return changed ? out : input;
};

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
