// Capsule theme — the cream candy canvas: every container a fully rounded PILL wrapped in one
// 0.25rem ink outline, lifted by a soft offset shadow that is never blurred, set in Bodoni Moda
// (ink, sentence case) against Space Grotesk labels (uppercase, wide-tracked). Ported from
// video-assets/themes/capsule/frame-showcase.html + frame.css onto the shared component system.
// Everything capsule OWNS lives in this folder, imported as text:
//   frame.css        the `.block-frame` base (frame ground, body wrapper, h3, .eyebrow chip)
//   <element>.css    capsule's SKIN for each shared primitive/treatment (structure + behavior
//                    are shared; capsule styles the standard class names here)
//   templates/*.html per-theme structure overrides where CSS can't reach (cover gains the
//                    accent rule the shared coverAnim already emits a descriptor for)
// The `:root` tokens are DERIVED from the 10-role `palette` below (see `tokensCss`), the same
// shape block and future use — the legacy `--cap-*` identity layer does NOT exist here; every
// shade a skin used to name is derived per-use with color-mix() from the ten roles. Bodoni Moda
// is capsule's ADD-ON face (assets/fonts/capsule-fonts.css), injected by engine/register-capsule;
// Space Grotesk rides along in the always-staged core set.
import { CAPSULE_DECORATION_COMPONENTS } from "../../primitives/capsule-decoration-shapes";
import type { ThemeTokens } from "../../runtime/types";
import frameCss from "./frame.css" with { type: "text" };
// Component skins.
import cardCss from "./card.css" with { type: "text" };
import statCss from "./stat.css" with { type: "text" };
import stepCss from "./step.css" with { type: "text" };
import rowCss from "./row.css" with { type: "text" };
import barCss from "./bar.css" with { type: "text" };
import rankCss from "./rank.css" with { type: "text" };
import agendaItemCss from "./agenda-item.css" with { type: "text" };
import hudCss from "./hud.css" with { type: "text" };
import captionCss from "./caption.css" with { type: "text" };
import ctaCss from "./cta.css" with { type: "text" };
import pillCss from "./pill.css" with { type: "text" };
import iconCss from "./icon.css" with { type: "text" };
import listNumberCss from "./list-number.css" with { type: "text" };
// Treatment skins.
import coverCss from "./cover.css" with { type: "text" };
import featureCardsCss from "./feature-cards.css" with { type: "text" };
import statGridCss from "./stat-grid.css" with { type: "text" };
import closingPlateCss from "./closing-plate.css" with { type: "text" };
import quoteCss from "./quote.css" with { type: "text" };
import timelineCss from "./timeline.css" with { type: "text" };
import comparisonCss from "./comparison.css" with { type: "text" };
import chartCss from "./chart.css" with { type: "text" };
import barRankingCss from "./bar-ranking.css" with { type: "text" };
import agendaCss from "./agenda.css" with { type: "text" };
// Structure overrides (kept in lockstep with the shared marker vocabulary).
import coverTemplate from "./templates/cover.html" with { type: "text" };

// Palette — capsule's colour for each of the 10 shared palette roles (types/palette.ts).
// The SINGLE source of truth for capsule's colours: it drives the showcase Palette section AND
// generates the `:root` custom properties below. Shell fills both --muted-2 and --muted-3, so
// the UI de-dupes on hex to capsule's 9 unique colours. Colour lives on stat figures, bar
// fills, icon discs and pill fills — never on a headline, which is always Ink.
const palette: NonNullable<ThemeTokens["palette"]> = [
  { name: "Coral", hex: "#E85D4E", note: "leading accent", varName: "primary" },
  { name: "Sky", hex: "#8BB4F7", note: "quiet accent", varName: "secondary" },
  { name: "Yellow", hex: "#F2D160", note: "CTA / eyebrow pills", varName: "accent-1" },
  { name: "Mint", hex: "#A8E6CF", note: "highlighted cell", varName: "accent-2" },
  { name: "Lavender", hex: "#C5B5E0", note: "closing rule", varName: "accent-3" },
  { name: "Cream", hex: "#F5F5F0", note: "canvas", varName: "muted-1" },
  { name: "Shell", hex: "#FBF7EF", note: "quiet ground", varName: "muted-2" },
  { name: "Shell", hex: "#FBF7EF", note: "quiet ground", varName: "muted-3" },
  { name: "White", hex: "#FFFFFF", note: "cards, tracks", varName: "light" },
  { name: "Ink", hex: "#1A1A1A", note: "outlines + text", varName: "dark" },
];

/** Font tokens — the only `:root` entries that aren't colours. Capsule has exactly TWO faces;
 *  `mono` is an alias of `body` (skins should prefer var(--body)) so a stray var(--mono)
 *  inherited from a shared idiom still lands on Space Grotesk rather than nothing. */
const fontTokens: Record<string, string> = {
  disp: '"Bodoni Moda", serif',
  body: '"Space Grotesk", sans-serif',
  mono: '"Space Grotesk", sans-serif',
};

/**
 * The theme's `:root` block, DERIVED from `palette` + `fontTokens` (matching block and
 * future), so each hex is written down exactly once. Capsule authors no identity layer beside
 * the roles — the legacy `--cap-coral` / `--cap-shadow` / `--cap-serif` tokens are gone, and
 * every translucent shade they carried is derived per-use with color-mix() in the skins.
 */
const tokensCss = `:root {\n${[
  ...palette.map((p) => `  --${p.varName}: ${p.hex.toLowerCase()};`),
  ...Object.entries(fontTokens).map(([name, value]) => `  --${name}: ${value};`),
].join("\n")}\n}\n`;

// Typography — the type roles (frame-showcase.html TYPOGRAPHY section). `style` is the
// self-contained inline CSS the showcase applies to each live sample (px is fine here — a
// sample is not a skin). Bodoni is ALWAYS ink and sentence case; the stat figure is the one
// role where colour is allowed to meet type.
const typography: ThemeTokens["typography"] = [
  {
    token: "display",
    spec: "Bodoni Moda 800 · sentence case · −0.03em · ink, never coloured",
    sample: "Inflated.",
    style:
      "font-family: var(--disp); font-weight: 800; letter-spacing: -0.03em; line-height: 0.9; font-size: 88px; color: var(--dark);",
  },
  {
    token: "headline",
    spec: "Bodoni Moda 700 · sentence case · −0.02em · ink, never coloured",
    sample: "A friendly pill",
    style:
      "font-family: var(--disp); font-weight: 700; letter-spacing: -0.02em; line-height: 1; font-size: 54px; color: var(--dark);",
  },
  {
    token: "stat-number",
    spec: "Bodoni Moda 800 · −0.03em · the ONE place colour meets type",
    sample: "240%",
    style:
      "font-family: var(--disp); font-weight: 800; line-height: 1; letter-spacing: -0.03em; font-size: 64px; color: var(--primary);",
  },
  {
    token: "body",
    spec: "Space Grotesk 400 · sentence case · ink 65% — paragraphs & supporting copy",
    sample:
      "Space Grotesk carries every paragraph and label — the clean grotesque against Bodoni's glamour.",
    style:
      "font-family: var(--body); font-weight: 400; font-size: 17px; line-height: 1.6; max-width: 680px; color: color-mix(in srgb, var(--dark) 65%, transparent);",
  },
  {
    token: "pill-text",
    spec: "Space Grotesk 600 · uppercase · 0.12em · in a yellow outlined pill",
    sample: "Featured",
    style:
      "display: inline-block; border: 3px solid var(--dark); border-radius: 9999px; background: var(--accent-1); box-shadow: 5px 5px 0 color-mix(in srgb, var(--dark) 12%, transparent); padding: 7px 22px; font-family: var(--body); font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; font-size: 14px; color: var(--dark);",
  },
];

// Frame Rules — Do / Don't bullets (frame-showcase.html PRINCIPLES section), restated against
// what the ported CSS actually does: ONE outline weight, the 12% ink shadow ladder in rem,
// and flat (unshadowed) floating decorations.
const rules: ThemeTokens["rules"] = {
  do: [
    "Make every container a pill — 9999px for chips, tracks and discs; ~2.125rem for cards.",
    "Wrap every pill, card, cell, disc and track in the ONE 0.25rem ink outline.",
    "Set Bodoni headlines in ink, sentence case; colour lives on stat figures, bar fills and pill fills.",
    "Lift content with soft offset shadows (0.375–0.75rem, 12% ink) — offset only, never blurred.",
    "Float 5–8 tilted candy pills as wallpaper on the declarative frames (cover, closing) — each on the same soft offset shadow every capsule carries, scaled with its size.",
  ],
  dont: [
    "No sharp-cornered text container, and no unstroked pill.",
    "No coloured Bodoni headline, and never uppercase Bodoni.",
    "No blurred shadow anywhere — every lift, decorations included, is a hard offset only.",
    "No second outline weight, and no colour outside the ten palette roles.",
    "Don't blow a headline edge-to-edge — fit it to measure.",
  ],
};

// Showcase sample copy — capsule's OWN examples (a calm, friendly voice matching the soft
// rounded look), so its treatment cards read as Capsule rather than block's neobrutalist or
// future's mission-systems placeholder. Each entry's `params` seed the treatment's own slots;
// `children` seed the child rows (params of the treatment's childComponent). SHOWCASE-ONLY —
// real decks use spec content, never these.
const examples: NonNullable<ThemeTokens["examples"]> = {
  cover: {
    params: {
      headline: "Everything's a capsule.",
      subtitle: "A soft, rounded frame system for calm and friendly stories.",
      eyebrow: "Frame System",
    },
  },
  quote: {
    params: {
      text: "Soften the edges and people lean in — the shape does half the talking.",
      attribution: "The System Voice",
      eyebrow: "In Their Words",
    },
  },
  "closing-plate": { params: { headline: "Stay rounded.", cta: "Say hello" } },
  "feature-cards": {
    params: { headline: "Cards on candy grounds" },
    children: [
      { title: "Pill Geometry", body: "Every container is fully rounded — chips, cards, tracks and discs.", icon: "I", accent: "primary" },
      { title: "Soft Outline", body: "One ink stroke wraps every shape, at one weight, everywhere.", icon: "II", accent: "secondary" },
      { title: "Gentle Lift", body: "Offset shadows sit under each card — never blurred, never heavy.", icon: "III", accent: "accent-2" },
    ],
  },
  "stat-grid": {
    params: { headline: "A quiet tally" },
    children: [
      { value: 2.4, label: "Times more replies", unitSuffix: "x", decimals: 1, accent: "primary" },
      { value: 240, label: "Output this quarter", unitSuffix: "%", accent: "secondary" },
      { value: 96, label: "Frames shipped on time", unitSuffix: "%", accent: "accent-3" },
    ],
  },
  timeline: {
    params: { headline: "Four gentle steps" },
    children: [
      { num: "01", title: "Survey", body: "Map what you already have." },
      { num: "02", title: "Sync", body: "Let the pieces find each other." },
      { num: "03", title: "Run", body: "Watch it come together." },
      { num: "04", title: "Scale", body: "Add more whenever you're ready." },
    ],
  },
  comparison: {
    params: { headline: "The friendlier path", columns: ["The Old Way", "The Capsule Way"] },
    children: [
      { label: "Onboarding", a: "A week of setup", b: "Ready in an hour" },
      { label: "Tone", a: "Corporate and cold", b: "Warm and plain-spoken" },
      { label: "Changes", a: "File a ticket", b: "Edit it yourself" },
    ],
  },
  chart: {
    params: { headline: "Signups by quarter", caption: "Measured across the whole programme." },
    children: [
      { value: 24, label: "Q1", max: 96, unitSuffix: "k" },
      { value: 41, label: "Q2", max: 96, unitSuffix: "k" },
      { value: 68, label: "Q3", max: 96, unitSuffix: "k" },
      { value: 96, label: "Q4", max: 96, unitSuffix: "k", leader: true },
    ],
  },
  "bar-ranking": {
    params: { headline: "What moves it", caption: "Ranked by contribution to the quarter." },
    children: [
      { value: 88, label: "Expansion", max: 100, unitSuffix: "%", leader: true },
      { value: 62, label: "New Logos", max: 100, unitSuffix: "%" },
      { value: 41, label: "Pricing", max: 100, unitSuffix: "%" },
    ],
  },
  agenda: {
    params: { headline: "Four considerations" },
    children: [
      { num: "01", title: "On measure", detail: "What we track" },
      { num: "02", title: "On margin", detail: "What it costs" },
      { num: "03", title: "On the line", detail: "Who it touches" },
      { num: "04", title: "On silence", detail: "What we leave out" },
    ],
  },
};

export const capsuleTheme: ThemeTokens = {
  name: "capsule",
  title: "CapsuleFrame",
  description:
    "A soft candy theme on a cream canvas: every container is a fully rounded pill wrapped in one ink outline and lifted by a soft offset shadow that is never blurred. Bodoni Moda carries the display in ink, sentence case; Space Grotesk carries every label in wide-tracked uppercase. Colour lives on stat figures, bar fills, icon discs and pill fills — never on a headline. Frame unit: 1920×1080, 16:9.",
  css: tokensCss,
  frameCss,
  // Every capsule frame lands on the cream canvas: this REPLACES the shared per-treatment
  // grounds (which are block-flavoured) without pinning them, so a scene that explicitly picks
  // a background still gets it — the thing a `background: … !important` in frame.css makes
  // impossible. The candy variety comes from the two-tone backdrop wash and the accents
  // (yellow eyebrow, coral rule, mint cell, lavender closer), not from the ground.
  groundDefault: "muted-1",
  // Capsule's DEFAULT backdrop: the shared `gradient` wash, re-tinted two-tone through the
  // --gradient-ink / --gradient-ink-2 hooks in frame.css (coral top-left into sky
  // bottom-right) — the component-system home of the legacy `.bframe::before` radial candy
  // glow. It is a default,
  // not ownership: a scene may pick any other design from the shared pool, and any other theme
  // may set this one. See primitives/backdrops.ts.
  backdrop: "gradient",
  // Showcase/editor preview surface — the cream canvas capsule's components are designed
  // against, so white pill cards and their ink outlines read. Taken off the palette (--muted-1)
  // rather than repeated as a literal.
  previewBg: palette.find((p) => p.varName === "muted-1")!.hex.toLowerCase(),
  // …and capsule is a LIGHT theme, stated outright: the preview shadow's color-scheme and its
  // safety-net text colour follow this, not the mere presence of previewBg above.
  previewScheme: "light",
  // The treatments' DEFAULT decorations are block's own (cover's star, closing's slab) — those
  // hard-shadowed neobrutalist shapes are off-theme here, so suppress them rather than let them
  // auto-render or shift the reveal cascade. Capsule's own families (see `decorations` below)
  // are opt-in per scene via addDecorations(); the always-on atmosphere is the gradient wash.
  suppressDefaultDecorations: true,
  // Capsule's skins for every shared element it renders. The element trios carry no css; these
  // are the capsule look. Unskinned elements (another theme's decorations) fall back to their
  // own inline css, which is acceptable — capsule never renders them in a deck.
  skins: {
    hud: hudCss,
    caption: captionCss,
    // primitives
    "agenda-item": agendaItemCss,
    bar: barCss,
    card: cardCss,
    cta: ctaCss,
    icon: iconCss,
    "list-number": listNumberCss,
    pill: pillCss,
    rank: rankCss,
    row: rowCss,
    stat: statCss,
    step: stepCss,
    // treatments
    agenda: agendaCss,
    "bar-ranking": barRankingCss,
    chart: chartCss,
    "closing-plate": closingPlateCss,
    comparison: comparisonCss,
    cover: coverCss,
    "feature-cards": featureCardsCss,
    quote: quoteCss,
    "stat-grid": statGridCss,
    timeline: timelineCss,
  },
  // ONE structure override. The shared coverAnim ALREADY emits a `rule`-kind descriptor for the
  // id "rule" that no-ops wherever no node stamps it (mc.js skips a missing target) — so adding
  // the node is the whole cost of capsule's signature coral accent bar drawing itself in under
  // the just-arrived headline. Every shared data-slot and every TARGETED data-anim id survives;
  // the node carries the `rule` class cover.css styles (`.cover .rule`), and its `data-anim="rule"`
  // stamps the id the shared coverAnim descriptor targets. closing-plate, quote and stat need no
  // override: their capsule look is reachable in CSS alone (a pseudo-element rule, a transparent
  // max-width quote wrapper, and flex `order` on the existing — untargeted — .stat-dot).
  templates: {
    cover: coverTemplate,
  },
  // Capsule's body face (Space Grotesk) is in the always-staged core chrome set, but its
  // DISPLAY face (Bodoni Moda) is capsule's own add-on: assets/fonts/bodoni-moda*.woff2 +
  // assets/fonts/capsule-fonts.css. The render path stages it by file-existence on the theme
  // name (stageThemeFonts), and engine/register-capsule.ts injects the inlined copy for the
  // browser preview/showcase. (No `fonts` field — it was dead metadata; staging is
  // theme-name-keyed on disk. The font-coverage tripwire in theme-parity.test.ts checks the
  // families named in `css` against the injected set.)
  palette,
  typography,
  rules,
  // Capsule's own showcase sample copy — see `examples` above.
  examples,
  // Capsule's OWN candy decoration families (blob · lozenge · arch · confetti) — tilted,
  // ink-outlined shapes lifted on the same soft offset shadow every capsule carries (scaled with
  // size; see SHADOW_UNIT in capsule-decoration-shapes.ts), so a decoration reads as the same
  // candy object as a card or pill. Themes don't share decorations: this roster lists only capsule's, and every
  // decoration is held out of the Components grid globally (ComponentFactory.decoration), so
  // block's and future's shapes never appear under capsule. Opt-in per scene via
  // addDecorations() / the editor's decoration picker.
  decorations: [...CAPSULE_DECORATION_COMPONENTS],
};
