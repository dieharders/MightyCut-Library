// The type-scale contract — ONE finite ladder of generically-named CSS custom
// properties that every theme defines. Themes differ only in which SIZE fills each
// step; component/treatment CSS never names a size, only a step.
//
// This is the palette pattern (types/palette.ts) applied to type. Before this module
// every size was a bare rem literal at its use site: 263 `font-size` declarations
// across the six themes, 43 distinct values, no named steps. Two things were broken by
// that. Nothing held a theme to a coherent internal scale, so roles that read alike
// drifted apart (a 1.25rem pill next to a 1.375rem HUD tagline); and "make all body
// copy one notch bigger" was a hundred-site edit with no way to confirm it was done.
//
// The steps below are the shared address space: a skin says `font-size: var(--text-md)`
// and the active theme decides whether that is 1.75rem or 2.625rem.
//
// Rules (see also each theme's `typeScale`):
//  - A theme MUST define all 8 steps. There is no "unset" step.
//  - Values MUST be rem on the 0.125rem grid (see runtime/css.ts REM_GRID) and MUST
//    increase strictly, so `md` is never quietly smaller than `sm`.
//  - The SAME step name carries a DIFFERENT size in each theme, by design — capsule's
//    `xs` is 1.25rem, block's is 1.75rem. The ladder shares names, not numbers.
//  - Skins never write a bare rem font-size. A deliberate one-off keeps its literal
//    and says why in a comment — the same discipline colours already follow with
//    color-mix() (a tripwire in registry.test.ts enforces it).

/**
 * The 8 type steps, in canonical (ascending) order. `xs`–`md` carry slide content —
 * info, facts, data, labels; `lg`/`xl` the slide title and the pull-quote statement;
 * `2xl`–`4xl` the display voices (stat figures, the closing plate, the cover).
 *
 * That mapping is GUIDANCE, not a contract: each theme's ladder was fitted to the
 * sizes it already shipped, so which step a given role lands on varies by theme. The
 * contract is only that the eight names exist and ascend.
 *
 * Used as the CSS custom property names (`--text-xs`, …, `--text-4xl`).
 */
export const TEXT_VARS = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"] as const;
export type TextVar = (typeof TEXT_VARS)[number];

/** A theme's size for each step, e.g. `{ xs: "1.25rem", …, "4xl": "9rem" }`. */
export type TypeScale = Record<TextVar, string>;

/**
 * The 5 line-height steps, ascending. `solid` is display leading (numerals and cover
 * headlines, often under 1); `relaxed` is paragraph leading. Unitless multipliers, so
 * they scale with whatever step they sit next to.
 *
 * Emitted as `--lh-solid` … `--lh-relaxed`.
 */
export const LEADING_VARS = ["solid", "tight", "snug", "normal", "relaxed"] as const;
export type LeadingVar = (typeof LEADING_VARS)[number];
export type Leading = Record<LeadingVar, string>;

/**
 * The 2 letter-spacing roles — deliberately ROLE-named rather than a magnitude ladder,
 * and deliberately only two.
 *
 * These are the tracking values that are a theme's SIGNATURE and are stated in its own
 * design rules: `display` is what its headlines are tracked at (negative in the
 * neobrutalist/sci-fi themes, 0 in the restrained ones), and `label` is its uppercase
 * eyebrow tracking — the value that ranges 0.08em → 0.22em across the six themes and
 * was hand-set at every use site before this.
 *
 * Everything else stays an authored literal on purpose. The per-role tracking a skin
 * spends on craft (a cover pulled to -0.04em, a data row nudged to 0.06em) does not
 * generalise across themes, and flattening it onto a shared ladder would cost real
 * design without buying consistency.
 *
 * Emitted as `--track-display` / `--track-label`.
 */
export const TRACKING_VARS = ["display", "label"] as const;
export type TrackingVar = (typeof TRACKING_VARS)[number];
export type Tracking = Record<TrackingVar, string>;

/**
 * The 5 typographic roles every theme documents in `ThemeTokens.typography`, in
 * canonical order. Before this the five role NAMES differed in all six themes (block
 * `heading-xl`/`heading-lg`, capsule `display`/`headline`, creative
 * `display-hero`/`display-md`, …), which made the showcase Typography section
 * incomparable between themes.
 *
 * A theme MAY append its own extra roles after these five (professional documents its
 * `eyebrow` and `cta`); it may not omit or reorder them.
 */
export const TYPE_ROLES = ["display", "heading", "figure", "body", "label"] as const;
export type TypeRole = (typeof TYPE_ROLES)[number];
