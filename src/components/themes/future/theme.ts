// Future theme — the dark sci-fi "command center" (formerly "technical"): a navy
// ground carrying a cyan constellation backdrop, near-white Space Grotesk headlines
// opened by a cyan rule, translucent glass panels, and a corner-bracket HUD. Ported
// from video-assets/themes/future/frame-showcase.html + frame.css onto the shared
// component system. Everything future OWNS lives in this folder, imported as text:
//   frame.css        the `.block-frame` base (navy ground, body wrapper, h3, .head)
//   <element>.css    future's SKIN for each shared primitive/treatment (structure +
//                    behavior are shared; future styles the standard class names here)
//   templates/*.html per-theme structure overrides where CSS can't reach (stat drops
//                    the dot; cover drops the eyebrow + adds a rule; quote adds a mark)
// The `:root` tokens are DERIVED from the 10-role `palette` below (see `tokensCss`),
// the same shape block uses — future no longer carries a parallel --fx-* identity
// layer. Content fonts (Space Grotesk / Inter / JetBrains Mono) are all in the
// always-staged core set, so future ships no add-on font.
import { FUTURE_DECORATION_COMPONENTS } from "../../primitives/future-decoration-shapes";
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
import statTemplate from "./templates/stat.html" with { type: "text" };
import coverTemplate from "./templates/cover.html" with { type: "text" };
import quoteTemplate from "./templates/quote.html" with { type: "text" };

// Palette — future's colour for each of the 10 shared palette roles (types/palette.ts).
// The SINGLE source of truth for future's colours: it drives the showcase Palette
// section AND generates the `:root` custom properties below. Amber fills both
// --secondary and --accent-3, so the UI de-dupes on hex to future's 9 unique colours.
// Every shade future used to carry as a separate --fx-* token (panel, line, steel,
// faint, glass, rule) is now DERIVED from these ten with color-mix() in the skins —
// there is no parallel identity layer anymore.
const palette: NonNullable<ThemeTokens["palette"]> = [
  { name: "Cyan", hex: "#34E1FF", note: "primary accent", varName: "primary" },
  { name: "Amber", hex: "#FFB454", note: "quiet accent", varName: "secondary" },
  { name: "Green", hex: "#56E39F", note: "positive", varName: "accent-1" },
  { name: "Violet", hex: "#8C9EFF", note: "rule gradient", varName: "accent-2" },
  { name: "Amber", hex: "#FFB454", note: "quiet accent", varName: "accent-3" },
  { name: "Frost", hex: "#94B0CC", note: "body text", varName: "muted-1" },
  { name: "Navy", hex: "#070D18", note: "backdrop ground", varName: "muted-2" },
  { name: "Glass", hex: "#0E1F33", note: "panel fill", varName: "muted-3" },
  { name: "Ghost", hex: "#EAF3FB", note: "text", varName: "light" },
  { name: "Abyss", hex: "#04080F", note: "vignette edge", varName: "dark" },
];

/** Font tokens — the only `:root` entries that aren't colours. */
const fontTokens: Record<string, string> = {
  disp: '"Space Grotesk", sans-serif',
  body: '"Inter", sans-serif',
  mono: '"JetBrains Mono", monospace',
};

/**
 * The theme's `:root` block, DERIVED from `palette` + `fontTokens` (matching block),
 * so each hex is written down exactly once. Future no longer authors an identity
 * layer beside the roles — the shades it used to name (`--fx-panel`, `--fx-line`,
 * `--fx-steel`, `--fx-faint`, `--fx-glass`, `--fx-rule`) are derived per-use with
 * color-mix() in the skins.
 */
const tokensCss = `:root {\n${[
  ...palette.map((p) => `  --${p.varName}: ${p.hex.toLowerCase()};`),
  ...Object.entries(fontTokens).map(([name, value]) => `  --${name}: ${value};`),
].join("\n")}\n}\n`;

// Typography — the type roles (frame-showcase.html TYPOGRAPHY section). `style` is the
// self-contained inline CSS the showcase applies to each live sample.
const typography: ThemeTokens["typography"] = [
  {
    token: "display",
    spec: "Space Grotesk 700 · sentence case · −0.03em · hero titles",
    sample: "Command Center.",
    style:
      "font-family: var(--disp); font-weight: 700; letter-spacing: -0.03em; line-height: 1; font-size: 84px; color: var(--light);",
  },
  {
    token: "h2",
    spec: "Space Grotesk 700 · slide headlines",
    sample: "Built for the Edge",
    style:
      "font-family: var(--disp); font-weight: 700; letter-spacing: -0.015em; font-size: 52px; color: var(--light);",
  },
  {
    token: "stat-number",
    spec: "Space Grotesk 700 · cyan · big numeric callouts",
    sample: "99.7%",
    style:
      "font-family: var(--disp); font-weight: 700; line-height: 1; letter-spacing: -0.02em; font-size: 60px; color: var(--primary);",
  },
  {
    token: "body",
    spec: "Inter 400 · line 1.55 · muted — paragraphs & supporting copy",
    sample:
      "Inter carries every paragraph in cool muted blue — readable, recessive, never competing with the cyan statement above it.",
    style:
      "font-family: var(--body); font-weight: 400; font-size: 18px; line-height: 1.55; max-width: 680px; color: var(--muted-1);",
  },
  {
    token: "label",
    spec: "JetBrains Mono 500 · uppercase · wide track · cyan — eyebrows, counters, HUD",
    sample: "Section · Eyebrow",
    style:
      "font-family: var(--mono); font-weight: 500; text-transform: uppercase; letter-spacing: 0.18em; font-size: 13px; color: var(--primary);",
  },
  // NOTE: the quote glyph is deliberately NOT a type role — it belongs solely to the quote
  // treatment (templates/quote.html's .qmark + quote.css). Keep this list to the general roles
  // (mirrors block's typography) so the showcase Typography section stays treatment-agnostic.
];

// Frame Rules — Do / Don't bullets (frame-showcase.html PRINCIPLES section).
const rules: ThemeTokens["rules"] = {
  do: [
    "Keep frame grounds transparent — the root constellation backdrop is the shared ground.",
    "Set headlines in Space Grotesk 700, near-white, sentence case; open data frames with a cyan rule.",
    "Render panels as glass — translucent navy, blur, a thin cyan/steel hairline, soft radius.",
    "Reserve the cyan glow for the winner: highlighted column, last bar, the outro CTA.",
    "Use JetBrains Mono, uppercase, wide-tracked, cyan for labels, counters, and the HUD.",
  ],
  dont: [
    "No opaque frame grounds — they hide the backdrop, the theme's whole identity.",
    "No hard offset shadows, square-corner neobrutalism, or thick borders.",
    "No uppercase display (that's block's law) — Space Grotesk stays sentence case.",
    "No accent riot — cyan leads; violet / amber / green stay quiet.",
    "Don't crowd the frame — the dark negative space carries the mood.",
  ],
};

// Showcase sample copy — future's OWN examples (from frame-showcase.html), so its treatment
// cards read as Future (an Atlas Relay demo) rather than block's neobrutalist placeholder. Each
// entry's `params` seed the treatment's own slots; `children` seed the child rows (params of the
// treatment's childComponent). SHOWCASE-ONLY — real decks use spec content, never these.
const examples: NonNullable<ThemeTokens["examples"]> = {
  cover: {
    params: {
      headline: "Future Systems",
      subtitle: "Self-healing edge communications for contested environments.",
    },
  },
  quote: {
    params: {
      text: "Communications should heal faster than the adversary can break them.",
      attribution: "Atlas Dynamics",
    },
  },
  "closing-plate": { params: { headline: "Award via Tradewinds today.", cta: "Get Started" } },
  "feature-cards": {
    params: { headline: "Built for the Edge" },
    children: [
      { title: "Edge Mesh", body: "Every node routes for every other — no single point of failure.", icon: "I", accent: "primary" },
      { title: "Auto-Failover", body: "Links re-form around jamming in under two seconds.", icon: "II", accent: "secondary" },
      { title: "Zero Trust", body: "Mutual TLS between every pair of nodes; keys rotate hourly.", icon: "III", accent: "accent-2" },
    ],
  },
  "stat-grid": {
    params: { headline: "Impact That Compounds" },
    children: [
      { value: 99.7, label: "Mesh uptime in EW conditions", unitSuffix: "%", decimals: 1, accent: "primary" },
      { value: 12, label: "Minutes to full mesh", unitSuffix: " min", accent: "secondary" },
      { value: 60, label: "Lower cost than legacy SATCOM", unitSuffix: "%", accent: "accent-1" },
    ],
  },
  timeline: {
    params: { headline: "How Atlas Deploys" },
    children: [
      { num: "01", title: "Site Survey", body: "RF map auto-generated by the kit." },
      { num: "02", title: "Bolt Down", body: "Two-person lift, no tools." },
      { num: "03", title: "Mesh Sync", body: "Nodes self-organize in minutes." },
      { num: "04", title: "Live Ops", body: "Zero-trust traffic flows." },
    ],
  },
  comparison: {
    params: { headline: "Why Alternatives Fall Short", columns: ["Legacy SATCOM", "Atlas Relay"] },
    children: [
      { label: "Autonomous", a: "Geo-dependent", b: "Self-organizing" },
      { label: "Encrypted", a: "Add-on", b: "Zero trust" },
      { label: "72-hr deploy", a: "Rarely", b: "Every time" },
    ],
  },
  chart: {
    params: { headline: "Packet Loss, Falling Fast", caption: "Median packet loss under active jamming." },
    children: [
      { value: 18, label: "Q1", max: 20 },
      { value: 11, label: "Q2", max: 20 },
      { value: 6, label: "Q3", max: 20 },
      { value: 2, label: "Q4", max: 20, leader: true },
    ],
  },
  "bar-ranking": {
    params: { headline: "What Moves the Mission", caption: "Ranked by field contribution." },
    children: [
      { value: 88, label: "Uptime", max: 100, unitSuffix: "%", leader: true },
      { value: 62, label: "Deploy Speed", max: 100, unitSuffix: "%" },
      { value: 41, label: "Cost Savings", max: 100, unitSuffix: "%" },
    ],
  },
  agenda: {
    params: { headline: "Four Considerations" },
    children: [
      { num: "01", title: "The Problem", detail: "Contested comms" },
      { num: "02", title: "The Solution", detail: "Self-healing mesh" },
      { num: "03", title: "The Edge", detail: "Zero-trust by default" },
      { num: "04", title: "The Model", detail: "Fixed-price licenses" },
    ],
  },
};

export const futureTheme: ThemeTokens = {
  name: "future",
  title: "FutureFrame",
  description:
    "A dark sci-fi command-center theme. Constellation backdrop, near-white headlines, translucent glass panels. Cyan leads; violet, amber, and green stays quiet. Frame unit: 1920×1080, 16:9.",
  css: tokensCss,
  frameCss,
  // Future's canonical backdrop: the animated cyan constellation (a per-scene seeded
  // particle network) painted over the navy ground. See primitives/backdrops.ts.
  backdrop: "constellation",
  // Showcase/editor preview surface — the navy ground future's components are designed
  // against, so glass panels + light-on-dark text read (a light card would wash them out).
  // Read off the palette (--muted-2) rather than repeated as a literal.
  previewBg: palette.find((p) => p.varName === "muted-2")!.hex.toLowerCase(),
  // The treatments' DEFAULT decorations are block's own (cover's pink star, closing's slab)
  // — suppress them so those neobrutalist shapes never auto-render on a future frame or shift
  // the reveal cascade. Future's own decorations (see `decorations` below) are opt-in per
  // scene via addDecorations(); the always-on ground is the constellation backdrop.
  suppressDefaultDecorations: true,
  // Future's skins for every shared element it renders. The element trios carry no css;
  // these are the future look. Unskinned elements (block-only decorations) fall back to
  // their own inline css, which is acceptable — future never renders them in a deck.
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
  // Structure overrides where future's markup diverges from block (shared markers kept).
  templates: {
    stat: statTemplate,
    cover: coverTemplate,
    quote: quoteTemplate,
  },
  fonts: {
    // All three content fonts are a subset of the always-staged core chrome set, so
    // future ships no add-on font of its own (unlike capsule/standard).
    css: "assets/fonts.css",
    files: ["space-grotesk.woff2", "inter.woff2", "jetbrains-mono.woff2"],
  },
  palette,
  typography,
  rules,
  // Future's own showcase sample copy (Atlas Relay demo) — see `examples` above.
  examples,
  // Future's OWN sci-fi decoration families (node · reticle · glyph · signal) — luminous
  // strokes + glow, distinct from block's neobrutalist set. Themes don't share decorations:
  // this roster lists only future's, and every decoration is held out of the Components grid
  // globally (ComponentFactory.decoration), so block's shapes never appear under future.
  // Opt-in per scene via addDecorations() / the editor's decoration picker (the constellation
  // backdrop remains the always-on ground; see suppressDefaultDecorations above).
  decorations: [...FUTURE_DECORATION_COMPONENTS],
};
