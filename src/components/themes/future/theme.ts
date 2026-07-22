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
// The `:root` tokens fold three groups (see `tokensCss`): the block-name ground/accent
// vocabulary (so shared elements that reference --pink/--blue/… still resolve), future's
// own --fx-* identity tokens, and the fonts. Content fonts (Space Grotesk / Inter /
// JetBrains Mono) are all in the always-staged core set, so future ships no add-on font.
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

// Palette — the future swatches (frame-showcase.html PALETTE section). Display data for
// the showcase; the `:root` tokens are authored below (not derived) because future carries
// identity tokens beyond the swatches.
const palette: NonNullable<ThemeTokens["palette"]> = [
  { name: "Navy", hex: "#070D18", note: "backdrop ground", varName: "fx-navy" },
  { name: "Abyss", hex: "#04080F", note: "vignette edge", varName: "fx-abyss" },
  {
    name: "Panel",
    hex: "#0E1F33",
    note: "glass fill",
    varName: "fx-panel-solid",
  },
  { name: "Cyan", hex: "#34E1FF", note: "primary accent", varName: "fx-cyan" },
  {
    name: "Violet",
    hex: "#8C9EFF",
    note: "rule gradient",
    varName: "fx-violet",
  },
  { name: "Amber", hex: "#FFB454", note: "quiet accent", varName: "fx-amber" },
  { name: "Green", hex: "#56E39F", note: "positive", varName: "fx-green" },
  { name: "Ink", hex: "#EAF3FB", note: "text", varName: "fx-ink" },
  { name: "Muted", hex: "#94B0CC", note: "body text", varName: "fx-muted" },
];

// The `:root` block. Authored (not derived) — three groups: block-name ground/accent
// aliases (so shared elements resolve), future identity tokens, fonts.
const tokensCss = `:root {
  /* Shared ground/accent vocabulary → future palette (grounds resolve to navy; the
     accents double as the cyan/violet/green/amber cycle shared elements reference). */
  --offwhite: #070d18;
  --cream: #070d18;
  --black: #04080f;
  --white: #eaf3fb;
  --pink: #34e1ff;
  --blue: #8c9eff;
  --green: #56e39f;
  --yellow: #ffb454;
  /* Future identity tokens (from frame-showcase.html / frame.css). */
  --fx-navy: #070d18;
  --fx-abyss: #04080f;
  --fx-panel: rgba(14, 31, 51, 0.55);
  --fx-panel-solid: #0e1f33;
  --fx-glass: linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(0, 0, 0, 0.16) 100%);
  --fx-cyan: #34e1ff;
  --fx-cyan-rgb: 52, 225, 255;
  --fx-violet: #8c9eff;
  --fx-amber: #ffb454;
  --fx-green: #56e39f;
  --fx-ink: #eaf3fb;
  --fx-muted: #94b0cc;
  --fx-faint: #5c7b8a;
  --fx-line: rgba(52, 225, 255, 0.16);
  --fx-steel: rgba(148, 176, 204, 0.16);
  --fx-rule: linear-gradient(90deg, #34e1ff 0%, #8c9eff 100%);
  /* Fonts — all in the core set (no add-on woff2). */
  --disp: "Space Grotesk", sans-serif;
  --body: "Inter", sans-serif;
  --mono: "JetBrains Mono", monospace;
}
`;

// Typography — the type roles (frame-showcase.html TYPOGRAPHY section). `style` is the
// self-contained inline CSS the showcase applies to each live sample.
const typography: ThemeTokens["typography"] = [
  {
    token: "display",
    spec: "Space Grotesk 700 · sentence case · −0.03em · hero titles",
    sample: "Command Center.",
    style:
      "font-family: var(--disp); font-weight: 700; letter-spacing: -0.03em; line-height: 1; font-size: 84px; color: var(--fx-ink);",
  },
  {
    token: "h2",
    spec: "Space Grotesk 700 · slide headlines",
    sample: "Built for the Edge",
    style:
      "font-family: var(--disp); font-weight: 700; letter-spacing: -0.015em; font-size: 52px; color: var(--fx-ink);",
  },
  {
    token: "stat-number",
    spec: "Space Grotesk 700 · cyan · big numeric callouts",
    sample: "99.7%",
    style:
      "font-family: var(--disp); font-weight: 700; line-height: 1; letter-spacing: -0.02em; font-size: 60px; color: var(--fx-cyan);",
  },
  {
    token: "body",
    spec: "Inter 400 · line 1.55 · muted — paragraphs & supporting copy",
    sample:
      "Inter carries every paragraph in cool muted blue — readable, recessive, never competing with the cyan statement above it.",
    style:
      "font-family: var(--body); font-weight: 400; font-size: 18px; line-height: 1.55; max-width: 680px; color: var(--fx-muted);",
  },
  {
    token: "label",
    spec: "JetBrains Mono 500 · uppercase · wide track · cyan — eyebrows, counters, HUD",
    sample: "Section · Eyebrow",
    style:
      "font-family: var(--mono); font-weight: 500; text-transform: uppercase; letter-spacing: 0.18em; font-size: 13px; color: var(--fx-cyan);",
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
  previewBg: "#070d18",
  // Future owns its look via the backdrop, not per-frame decorations — suppress block's
  // default cover star / closing slab so they don't render off-theme or shift the cascade.
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
  // Future has no neobrutalist decoration families — its ground IS the backdrop.
  decorations: [],
};
