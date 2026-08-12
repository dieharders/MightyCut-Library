// Future theme — the dark sci-fi "command center" (formerly "technical"): a navy
// ground carrying a cyan constellation backdrop, near-white Space Grotesk headlines
// opened by a cyan rule, translucent glass panels, and a corner-bracket HUD. Ported
// from video-assets/themes/future/frame-showcase.html + frame.css onto the shared
// component system. Everything future OWNS lives in this folder, imported as text:
//   frame.css        the `.mc-frame` base (navy ground, body wrapper, h3, .head)
//   <element>.css    future's SKIN for each shared primitive/treatment (structure +
//                    behavior are shared; future styles the standard class names here)
//   templates/*.html per-theme structure overrides where CSS can't reach (stat drops
//                    the dot; cover adds a rule under the headline; quote adds a mark)
// The `:root` tokens are DERIVED from the 10-role `palette` below (see `tokensCss`),
// the same shape block uses — future no longer carries a parallel --fx-* identity
// layer. Content fonts (Space Grotesk / Inter / JetBrains Mono) are all in the
// always-staged core set, so future ships no add-on font.
import { FUTURE_DECORATION_COMPONENTS } from "../../primitives/future-decoration-shapes";
import type { ThemeTokens } from "../../runtime/types";
// The SAFE AREA is shared by every theme (one vertical, deck-wide) and is concatenated ahead of
// this theme's frame base; frame.css states only --safe-side and its own side exceptions.
import safeAreaCss from "../safe-area.css" with { type: "text" };
import frameCss from "./frame.css" with { type: "text" };
// Component skins.
import cardCss from "./card.css" with { type: "text" };
import statCss from "./stat.css" with { type: "text" };
import stepCss from "./step.css" with { type: "text" };
import rowCss from "./row.css" with { type: "text" };
import barCss from "./bar.css" with { type: "text" };
import rankCss from "./rank.css" with { type: "text" };
import agendaItemCss from "./agenda-item.css" with { type: "text" };
// The HUD's GEOMETRY is shared by every theme (one band, one grid) and is concatenated ahead of
// the skin below; hud.css here is paint only. See primitives/hud/geometry.css for why.
import hudGeometryCss from "../../primitives/hud/geometry.css" with { type: "text" };
import hudCss from "./hud.css" with { type: "text" };
import captionCss from "./caption.css" with { type: "text" };
import ctaCss from "./cta.css" with { type: "text" };
import pillCss from "./pill.css" with { type: "text" };
import iconCss from "./icon.css" with { type: "text" };
import listNumberCss from "./list-number.css" with { type: "text" };
import matrixRowCss from "./matrix-row.css" with { type: "text" };
import teamMemberCss from "./team-member.css" with { type: "text" };
import plotCss from "./plot.css" with { type: "text" };
import clusterNodeCss from "./cluster-node.css" with { type: "text" };
// Treatment skins.
import coverCss from "./cover.css" with { type: "text" };
import featureCardsCss from "./feature-cards.css" with { type: "text" };
import matrixCss from "./matrix.css" with { type: "text" };
import pillWallCss from "./pill-wall.css" with { type: "text" };
import teamCss from "./team.css" with { type: "text" };
import lineChartCss from "./line-chart.css" with { type: "text" };
import nodeClusterCss from "./node-cluster.css" with { type: "text" };
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
  {
    name: "Violet",
    hex: "#8C9EFF",
    note: "rule gradient",
    varName: "accent-2",
  },
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

/** Type-SIZE tokens — future's own type scale. This is to `font-size` what `palette` is to
 *  colour: a skin NAMES a step, it never writes a number. The steps are FUTURE's — every theme
 *  derives its own from its own ramp, and only the SHAPE (the step vocabulary, ascending, on the
 *  0.125rem grid, no adjacent pair closer than 1.10x) is shared. Future's floor is 1.5rem: it has
 *  no true fine print, because a HUD reads at a distance.
 *
 *  The top of the ramp is ANCHORED, not chosen: `3xl` IS the content-frame h3 (the seven-treatment
 *  normalisation 8fb19d7 landed, which the pull quote now joins), `4xl` IS the stat figure, and
 *  `max` IS the cover and closing plate. One step change here is NOT self-contained: the quote
 *  watermark's line-height is derived from the rem value of the step it names (see quote.css). */
const sizeTokens: Record<string, string> = {
  "font-size-xs": "1.5rem",
  "font-size-sm": "1.75rem",
  "font-size-md": "2.125rem",
  "font-size-lg": "2.5rem",
  "font-size-xl": "2.875rem",
  "font-size-2xl": "3.375rem",
  "font-size-3xl": "4.375rem",
  "font-size-4xl": "6.5rem",
  "font-size-max": "8.25rem",
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
  ...Object.entries(fontTokens).map(
    ([name, value]) => `  --${name}: ${value};`,
  ),
  ...Object.entries(sizeTokens).map(
    ([name, value]) => `  --${name}: ${value};`,
  ),
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
      eyebrow: "From the Field",
    },
  },
  "closing-plate": {
    params: { headline: "Award via Tradewinds today.", cta: "Get Started" },
  },
  "feature-cards": {
    params: { headline: "Built for the Edge" },
    children: [
      {
        title: "Edge Mesh",
        body: "Every node routes for every other — no single point of failure.",
        icon: "I",
        accent: "primary",
      },
      {
        title: "Auto-Failover",
        body: "Links re-form around jamming in under two seconds.",
        icon: "II",
        accent: "secondary",
      },
      {
        title: "Zero Trust",
        body: "Mutual TLS between every pair of nodes; keys rotate hourly.",
        icon: "III",
        accent: "accent-2",
      },
    ],
  },
  "stat-grid": {
    params: { headline: "Impact That Compounds" },
    children: [
      {
        value: 99.7,
        label: "Mesh uptime in EW conditions",
        unitSuffix: "%",
        decimals: 1,
        accent: "primary",
      },
      {
        value: 12,
        label: "Minutes to full mesh",
        unitSuffix: " min",
        accent: "secondary",
      },
      {
        value: 60,
        label: "Lower cost than legacy SATCOM",
        unitSuffix: "%",
        accent: "accent-1",
      },
    ],
  },
  timeline: {
    params: { headline: "How Atlas Deploys" },
    children: [
      {
        num: "01",
        title: "Site Survey",
        body: "RF map auto-generated by the kit.",
      },
      { num: "02", title: "Bolt Down", body: "Two-person lift, no tools." },
      {
        num: "03",
        title: "Mesh Sync",
        body: "Nodes self-organize in minutes.",
      },
      { num: "04", title: "Live Ops", body: "Zero-trust traffic flows." },
    ],
  },
  matrix: {
    params: {
      headline: "Capability Coverage",
      criteria: ["Autonomous", "Encrypted", "72-hr deploy"],
      caption: "Assessed against the program's threshold requirements",
    },
    children: [
      { label: "Legacy SATCOM", sublabel: "Geo-dependent, add-on crypto", cells: ["no", "no", "no"] },
      { label: "Mesh Retrofit", sublabel: "Partial coverage, long lead time", cells: ["yes", "yes", "no"] },
      { label: "Atlas Relay", sublabel: "The proposed system", cells: ["yes", "yes", "yes"], highlight: true },
    ],
  },
  "pill-wall": {
    params: {
      headline: "Sensor Coverage",
      caption: "Feeds ingested by the relay on entry to service",
    },
    children: [
      { text: "Radar" },
      { text: "EO/IR" },
      { text: "SIGINT" },
      { text: "AIS" },
      { text: "ADS-B" },
      { text: "Sonar" },
      { text: "LIDAR" },
      { text: "Telemetry" },
    ],
  },
  team: {
    params: {
      headline: "Program Leadership",
      caption: "Cleared personnel assigned for the program's duration",
    },
    children: [
      { name: "Cmdr. Rae Sol", role: "Program Director", org: "Orbital Ops", accent: "primary" },
      { name: "Dr. Ivo Kess", role: "Chief Engineer", org: "Relay Systems", accent: "secondary" },
      { name: "Maj. Lena Cruz", role: "Mission Assurance", org: "Test & Eval", accent: "accent-1" },
    ],
  },
  "line-chart": {
    params: {
      headline: "Link Latency Trend",
      caption: "Mean round-trip, milliseconds",
    },
    children: [
      {
        labels: ["T+0","T+30","T+60","T+90"],
        values: [240,180,120,64],
        max: 240,
        unitSuffix: "ms",
      },
    ],
  },
  "node-cluster": {
    params: {
      headline: "One Relay, Every Sensor",
      hub: "Atlas Relay",
      caption: "Each source normalised on the way in",
    },
    children: [
      { label: "Radar", detail: "12 feeds", index: 0, total: 5, accent: "primary" },
      { label: "EO/IR", detail: "8 feeds", index: 1, total: 5, accent: "secondary" },
      { label: "SIGINT", detail: "4 feeds", index: 2, total: 5, accent: "accent-1" },
      { label: "AIS", detail: "global", index: 3, total: 5, accent: "accent-2" },
      { label: "Telemetry", detail: "live", index: 4, total: 5, accent: "primary" },
    ],
  },
  comparison: {
    params: {
      headline: "Why Alternatives Fall Short",
      columns: ["Legacy SATCOM", "Atlas Relay"],
    },
    children: [
      { label: "Autonomous", a: "Geo-dependent", b: "Self-organizing" },
      { label: "Encrypted", a: "Add-on", b: "Zero trust" },
      { label: "72-hr deploy", a: "Rarely", b: "Every time" },
    ],
  },
  chart: {
    params: {
      headline: "Packet Loss, Falling Fast",
      caption: "Median packet loss under active jamming.",
    },
    children: [
      { value: 18, label: "Q1", max: 20, unitSuffix: "%" },
      { value: 11, label: "Q2", max: 20, unitSuffix: "%" },
      { value: 6, label: "Q3", max: 20, unitSuffix: "%" },
      { value: 2, label: "Q4", max: 20, unitSuffix: "%", leader: true },
    ],
  },
  "bar-ranking": {
    params: {
      headline: "What Moves the Mission",
      caption: "Ranked by field contribution.",
    },
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

// Future's hero-frame decorations. The constellation backdrop already carries the theme's
// motion, so these stay SPARSE — one or two instruments per frame, hairline strokes on the
// navy, never competing with the particle field. Cyan (primary) draws every lit instrument;
// glass (muted-3) is the one unlit shape, a mass rather than a mark. Every decoration takes
// a reveal cascade slot, so a heavier set would push the headline late.
const decorationDefaults: NonNullable<ThemeTokens["decorationDefaults"]> = {
  // One instrument in two parts, both centred on the BOTTOM edge so the pair is cropped to a
  // half: a cyan ring with a bracket set turned 135° around it. It reads as a single
  // horizon-line device under the left-set headline, not as two shapes.
  cover: [],
  // A single glass triangle at the schema's maximum size, centred DIRECTLY behind the
  // sign-off card — the one place future spends a mass instead of a hairline, so the closer
  // has something to sit on once the constellation stops carrying the frame.
  "closing-plate": [
    {
      name: "glyph",
      params: {
        variant: "triangle",
        x: 50,
        y: 50,
        size: 60,
        accent: "muted-3",
        layer: "back",
      },
    },
  ],
  // The quote card is centred: a cyan beam raked up from low-left, a cyan hexagon
  // high-right.
  quote: [
    {
      name: "signal",
      params: {
        variant: "beam",
        x: 13,
        y: 78,
        size: 16,
        rotate: -51,
        accent: "primary",
        layer: "back",
      },
    },
    {
      name: "glyph",
      params: {
        variant: "hexagon",
        x: 87,
        y: 22,
        size: 14,
        rotate: 12,
        accent: "primary",
        layer: "back",
      },
    },
  ],
};

export const futureTheme: ThemeTokens = {
  name: "future",
  title: "Future",
  description:
    "A dark command-center theme. Constellation backdrop, near-white headlines, translucent glass panels. Cyan leads; violet, amber, and green stays muted. Frame unit: 1920×1080, 16:9.",
  css: tokensCss,
  frameCss: safeAreaCss + frameCss,
  // Every future frame sits on navy: this REPLACES the shared per-treatment grounds
  // (which are block-flavoured — cream/pink/blue) without pinning them, so a scene that
  // explicitly picks a background still gets it. Formerly a `!important` in frame.css,
  // which made an explicit ground impossible to apply.
  groundDefault: "muted-2",
  // Future's DEFAULT backdrop: the animated cyan constellation (a per-scene seeded particle
  // network) painted over the navy ground — the signature design future contributes to the
  // SHARED pool. It is not future-only: another theme can set it as its own default or pick
  // it per scene, and the particles take THAT theme's --primary (particleRgb resolves the
  // colour from the active theme's palette at build time). See primitives/backdrops.ts.
  backdrop: "constellation",
  // Showcase/editor preview surface — the navy ground future's components are designed
  // against, so glass panels + light-on-dark text read (a light card would wash them out).
  // Read off the palette (--muted-2) rather than repeated as a literal.
  previewBg: palette.find((p) => p.varName === "muted-2")!.hex.toLowerCase(),
  // …and future is a DARK theme, stated outright: the preview shadow's color-scheme and
  // its safety-net text colour follow this, not the mere presence of previewBg above.
  previewScheme: "dark",
  // Future's skins for every shared element it renders. The element trios carry no css;
  // these are the future look. Unskinned elements (block-only decorations) fall back to
  // their own inline css, which is acceptable — future never renders them in a deck.
  skins: {
    hud: hudGeometryCss + hudCss,
    caption: captionCss,
    // primitives
    "agenda-item": agendaItemCss,
    bar: barCss,
    card: cardCss,
    cta: ctaCss,
    icon: iconCss,
    "list-number": listNumberCss,
    "matrix-row": matrixRowCss,
    "team-member": teamMemberCss,
    plot: plotCss,
    "cluster-node": clusterNodeCss,
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
    matrix: matrixCss,
    "pill-wall": pillWallCss,
    team: teamCss,
    "line-chart": lineChartCss,
    "node-cluster": nodeClusterCss,
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
  // Future's three content fonts (Space Grotesk / Inter / JetBrains Mono) are all in the
  // always-staged core chrome set, so future ships no add-on font of its own. (No `fonts`
  // field — it was dead metadata; see the note on blockTheme. The font-coverage tripwire in
  // theme-parity.test.ts checks the families named in `css` against the core set.)
  palette,
  typography,
  rules,
  // Future's own showcase sample copy (Atlas Relay demo) — see `examples` above.
  examples,
  // Future's OWN sci-fi decoration families (node · reticle · glyph · signal) — luminous
  // strokes + glow, distinct from block's neobrutalist set. Themes don't share decorations:
  // this roster lists only future's, and every decoration is held out of the Components grid
  // globally (ComponentFactory.decoration), so block's shapes never appear under future.
  // Offered per scene via addDecorations() / the editor's decoration picker (the constellation
  // backdrop remains the always-on ground, which is why the defaults below stay sparse).
  decorations: [...FUTURE_DECORATION_COMPONENTS],
  // …and how the hero frames wear them by default — see `decorationDefaults` above.
  decorationDefaults,
};
