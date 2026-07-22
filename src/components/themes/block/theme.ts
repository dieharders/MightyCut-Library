// Block theme — everything block OWNS lives in this folder, imported as text (the
// same convention as the component trio CSS):
//   frame.css   the shared frame base — the `.block-frame` ground, the `.body`
//               content wrapper, the base `.eyebrow`/`h3` type, CSS-only decorations
//   hud.css     block's SKIN for the shared `hud` component
//   caption.css block's SKIN for the shared `caption` component
// The `:root` palette/font tokens are NOT a file — they are DERIVED from `palette`
// below, so each colour is written down exactly once (see `tokensCss`).
// The frame base is inlined ONCE per scene by the treatment builder; the
// per-treatment look lives in each treatment's own trio CSS. Per-component skins
// are handed to the runtime via `skins` below: the component owns structure +
// behavior (template/schema/anim), the theme owns how it looks — so another theme
// styles the same standard class names from its own folder. Content fonts (Inter,
// Space Grotesk) are self-hosted and staged from video-assets/themes/block/assets.
import { DECORATION_COMPONENTS } from "../../primitives/decoration-shapes";
import type { ThemeTokens } from "../../runtime/types";
import frameCss from "./frame.css" with { type: "text" };
// Per-element skins block OWNS. Every primitive + treatment is structure+behavior only
// (template/schema/anim); block styles their standard class names here, in
// themes/block/<name>.css. The runtime prefers theme.skins[name] over an element's own
// css (which is now empty), so another theme restyles the same names from its own folder.
import hudCss from "./hud.css" with { type: "text" };
import captionCss from "./caption.css" with { type: "text" };
// Component skins.
import agendaItemCss from "./agenda-item.css" with { type: "text" };
import barCss from "./bar.css" with { type: "text" };
import cardCss from "./card.css" with { type: "text" };
import ctaCss from "./cta.css" with { type: "text" };
import iconCss from "./icon.css" with { type: "text" };
import listNumberCss from "./list-number.css" with { type: "text" };
import pillCss from "./pill.css" with { type: "text" };
import rankCss from "./rank.css" with { type: "text" };
import rowCss from "./row.css" with { type: "text" };
import statCss from "./stat.css" with { type: "text" };
import stepCss from "./step.css" with { type: "text" };
// Treatment skins.
import agendaCss from "./agenda.css" with { type: "text" };
import barRankingCss from "./bar-ranking.css" with { type: "text" };
import chartCss from "./chart.css" with { type: "text" };
import closingPlateCss from "./closing-plate.css" with { type: "text" };
import comparisonCss from "./comparison.css" with { type: "text" };
import coverCss from "./cover.css" with { type: "text" };
import featureCardsCss from "./feature-cards.css" with { type: "text" };
import quoteCss from "./quote.css" with { type: "text" };
import statGridCss from "./stat-grid.css" with { type: "text" };
import timelineCss from "./timeline.css" with { type: "text" };

// Showcase design data — the block styleguide extracted from
// video-assets/themes/block/frame-showcase.html (verbatim hex/labels/type-scale/
// rules), so the interactive showcase renders each section GENERICALLY from theme
// data. Other themes populate the same fields to standardize for free.

// Palette — the 8 block swatches (frame-showcase.html PALETTE section). This is the
// SINGLE source of truth for block's colours: it drives the showcase Palette section
// AND generates the `:root` custom properties below, so a hex is written down once.
const palette: NonNullable<ThemeTokens["palette"]> = [
  { name: "Pink", hex: "#FE90E8", varName: "pink" },
  { name: "Blue", hex: "#C0F7FE", varName: "blue" },
  { name: "Green", hex: "#99E885", varName: "green" },
  { name: "Yellow", hex: "#F7CB46", note: "CTA", varName: "yellow" },
  { name: "Cream", hex: "#FFDC8B", varName: "cream" },
  { name: "Off-White", hex: "#FFFDF5", note: "canvas", varName: "offwhite" },
  { name: "White", hex: "#FFFFFF", note: "cards", varName: "white" },
  { name: "Black", hex: "#000000", note: "borders", varName: "black" },
];

/** Font tokens — the only `:root` entries that aren't colours. */
const fontTokens: Record<string, string> = {
  disp: '"Inter", sans-serif',
  mono: '"Space Grotesk", sans-serif',
};

/**
 * The theme's `:root` block, DERIVED from `palette` + `fontTokens` (replaces the old
 * hand-maintained tokens.css, which duplicated every hex). The harness writes this to
 * a project's assets/tokens.css; the browser engine rewrites `:root` → `:host` to
 * scope it into a shadow root.
 */
const tokensCss = `:root {\n${[
  ...palette.map((p) => `  --${p.varName}: ${p.hex.toLowerCase()};`),
  ...Object.entries(fontTokens).map(([name, value]) => `  --${name}: ${value};`),
].join("\n")}\n}\n`;

// Typography — the 5 type roles (frame-showcase.html TYPOGRAPHY section). `style`
// is the self-contained inline CSS the showcase applies to each live sample — it sets
// its OWN color (var(--black)) so a sample reads correctly on any panel without relying
// on an inherited/wrapper text color.
const displayBase =
  "font-family: var(--disp); text-transform: uppercase; line-height: 0.95; color: var(--black);";
const typography: ThemeTokens["typography"] = [
  {
    token: "heading-xl",
    spec: "Inter 900 · uppercase · hero titles & biggest word on a frame",
    sample: "Maximal.",
    style: `${displayBase} font-weight: 900; letter-spacing: -0.03em; font-size: 80px;`,
  },
  {
    token: "heading-lg",
    spec: "Inter 800 · uppercase · section headlines & secondary titles",
    sample: "Bordered & Bold",
    style: `${displayBase} font-weight: 800; letter-spacing: -0.02em; font-size: 50px;`,
  },
  {
    token: "stat-number",
    spec: "Inter 900 · line 1 · big numeric callouts: stats, counts, prices",
    sample: "240",
    style:
      "font-family: var(--disp); font-weight: 900; line-height: 1; letter-spacing: -0.02em; font-size: 64px; color: var(--black);",
  },
  {
    token: "body",
    spec: "Inter 500 · sentence case · paragraphs & supporting copy",
    sample:
      "Body runs Inter at weight 500, sentence case — the calm against the heavy uppercase display.",
    style:
      "font-family: var(--disp); font-weight: 500; font-size: 18px; line-height: 1.6; max-width: 640px; color: var(--black);",
  },
  {
    token: "label",
    spec: "Space Grotesk 600 · uppercase · eyebrows, tags & section kickers above a heading",
    sample: "Section Eyebrow",
    style:
      "display: inline-block; border: 3px solid var(--black); background: var(--white); box-shadow: 4px 4px 0 var(--black); padding: 6px 16px; font-family: var(--mono); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; font-size: 13px; color: var(--black);",
  },
];

// Frame Rules — Do / Don't bullets (frame-showcase.html PRINCIPLES section).
const rules: ThemeTokens["rules"] = {
  do: [
    "4px borders + 8px shadows on primary cards; 3px + 4px on chrome.",
    "Cycle pastel grounds across frames; keep the rhythm.",
    "Inter 800–900 uppercase, negative tracking, for all display.",
    "Open every region with a label-pill eyebrow.",
    "Tilt decorations ±2°–12°; add one to every frame.",
  ],
  dont: [
    "No rounded corners (save the stat-deco dot); no blurred shadows.",
    "No colored borders (black only, save the close-frame white).",
    "No sentence-case Inter display; no sixth pastel.",
    "No label rendered as plain text — pill or nothing.",
    "Don't blow a headline edge-to-edge — fit to measure.",
  ],
};

export const blockTheme: ThemeTokens = {
  name: "block",
  title: "BlockFrame",
  description:
    "A maximalist neobrutalist theme: black borders, hard offset shadows, square corners, tilted decorations, saturated pastel accents, shadows stacking comfortably dense. Frame unit: 1920×1080, 16:9.",
  css: tokensCss,
  frameCss,
  // Block's canonical backdrop mask: the ink dot-grid painted over every ground.
  // A scene can override it (storyboard/deck `backdrop`); see primitives/backdrops.ts.
  backdrop: "dots",
  // Block's skins for the shared structure+behavior elements — every primitive +
  // treatment block renders. The element trios carry no css; these are the block look.
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
  fonts: {
    // Block's content fonts (Inter, Space Grotesk) are a subset of the core chrome
    // set, so they come from the always-staged core fonts.css — block ships no
    // add-on font of its own (only capsule/standard do). Staged by copyProjectAssets.
    css: "assets/fonts.css",
    files: ["inter.woff2", "space-grotesk.woff2"],
  },
  palette,
  typography,
  rules,
  // The decoration component families block offers (starburst · slab · stripe · badge).
  decorations: [...DECORATION_COMPONENTS],
};
