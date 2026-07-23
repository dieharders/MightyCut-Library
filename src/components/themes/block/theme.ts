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

// Palette — block's colour for each of the 10 shared palette roles (types/palette.ts).
// This is the SINGLE source of truth for block's colours: it drives the showcase
// Palette section AND generates the `:root` custom properties below, so a hex is
// written down once. `name` is the human/agent-facing label; a colour may fill
// several roles (oat is both --muted-2 and --muted-3, green both accents), and the
// UI de-dupes on hex so the showcase lists block's 8 unique colours, not 10 rows.
const palette: NonNullable<ThemeTokens["palette"]> = [
  { name: "Pink", hex: "#FE90E8", varName: "primary" },
  { name: "Blue", hex: "#C0F7FE", varName: "secondary" },
  { name: "Yellow", hex: "#F7CB46", note: "CTA", varName: "accent-1" },
  { name: "Green", hex: "#99E885", varName: "accent-2" },
  { name: "Green", hex: "#99E885", varName: "accent-3" },
  { name: "Cream", hex: "#FFDC8B", varName: "muted-1" },
  { name: "Oat", hex: "#FFFDF5", note: "canvas", varName: "muted-2" },
  { name: "Oat", hex: "#FFFDF5", note: "canvas", varName: "muted-3" },
  { name: "White", hex: "#FFFFFF", note: "cards", varName: "light" },
  { name: "Black", hex: "#000000", note: "borders", varName: "dark" },
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
// its OWN color (var(--dark)) so a sample reads correctly on any panel without relying
// on an inherited/wrapper text color.
const displayBase =
  "font-family: var(--disp); text-transform: uppercase; line-height: 0.95; color: var(--dark);";
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
      "font-family: var(--disp); font-weight: 900; line-height: 1; letter-spacing: -0.02em; font-size: 64px; color: var(--dark);",
  },
  {
    token: "body",
    spec: "Inter 500 · sentence case · paragraphs & supporting copy",
    sample:
      "Body runs Inter at weight 500, sentence case — the calm against the heavy uppercase display.",
    style:
      "font-family: var(--disp); font-weight: 500; font-size: 18px; line-height: 1.6; max-width: 640px; color: var(--dark);",
  },
  {
    token: "label",
    spec: "Space Grotesk 600 · uppercase · eyebrows, tags & section kickers above a heading",
    sample: "Section Eyebrow",
    style:
      "display: inline-block; border: 3px solid var(--dark); background: var(--light); box-shadow: 4px 4px 0 var(--dark); padding: 6px 16px; font-family: var(--mono); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; font-size: 13px; color: var(--dark);",
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

// Showcase sample copy — block OWNS its examples here (symmetric with futureTheme.examples),
// so a theme's showcase content lives in its own file. These mirror the shared def
// example/defaultChildren (which stay as the render/defaults baseline); `params` seed the
// treatment's own slots, `children` seed the child rows (params of its childComponent).
const examples: NonNullable<ThemeTokens["examples"]> = {
  cover: {
    params: {
      headline: "Block, bordered, crooked.",
      subtitle: "A maximalist neobrutalist frame system.",
      eyebrow: "MightyCut",
    },
  },
  quote: {
    params: {
      text: "Design is not just what it looks like. Design is how it works.",
      attribution: "Steve Jobs",
      eyebrow: "In their words",
    },
  },
  "closing-plate": { params: { headline: "Stay loud.", cta: "Start building" } },
  "feature-cards": {
    params: { headline: "Built for the whole workflow" },
    children: [
      { title: "Prompt to preview", body: "Describe the video; get a preview-ready deck back in one pass.", icon: "I", accent: "primary" },
      { title: "On-brand by default", body: "Themed frames, captions, and motion — no timeline surgery.", icon: "II", accent: "secondary" },
      { title: "Render on demand", body: "Publish the preview now; render the final MP4 whenever you like.", icon: "III", accent: "accent-2" },
    ],
  },
  "stat-grid": {
    params: { headline: "Numbers that moved" },
    children: [
      { value: 92, label: "Detection rate", unitSuffix: "%", accent: "primary" },
      { value: 3, label: "Faster triage", unitSuffix: "x", accent: "secondary" },
      { value: 40, label: "Cost reduction", unitSuffix: "%", accent: "accent-1" },
    ],
  },
  timeline: {
    params: { headline: "Four Steps" },
    children: [
      { num: "01", title: "Survey", body: "Map the field automatically." },
      { num: "02", title: "Sync", body: "Nodes self-organize." },
      { num: "03", title: "Run", body: "Live coverage in minutes." },
      { num: "04", title: "Scale", body: "Add nodes on demand." },
    ],
  },
  comparison: {
    params: { headline: "Why We Win", columns: ["Status Quo", "Our Approach"] },
    children: [
      { label: "Speed", a: "Hours", b: "Minutes" },
      { label: "Cost", a: "$$$", b: "$" },
      { label: "Risk", a: "High", b: "Managed" },
      { label: "Setup", a: "Weeks", b: "Same day" },
    ],
  },
  chart: {
    params: { headline: "Revenue by quarter", caption: "Net new revenue" },
    children: [
      { value: 42, label: "Q1", max: 96, unitPrefix: "$", unitSuffix: "M" },
      { value: 68, label: "Q2", max: 96, unitPrefix: "$", unitSuffix: "M" },
      { value: 79, label: "Q3", max: 96, unitPrefix: "$", unitSuffix: "M" },
      { value: 96, label: "Q4", max: 96, unitPrefix: "$", unitSuffix: "M", leader: true },
    ],
  },
  "bar-ranking": {
    params: { headline: "Market share by vendor", caption: "Share of new installs, 2026" },
    children: [
      { value: 38, label: "Acme", max: 38, unitSuffix: "%", leader: true },
      { value: 27, label: "Globex", max: 38, unitSuffix: "%" },
      { value: 19, label: "Initech", max: 38, unitSuffix: "%" },
      { value: 11, label: "Umbrella", max: 38, unitSuffix: "%" },
    ],
  },
  agenda: {
    params: { headline: "What we'll cover" },
    children: [
      { num: "01", title: "The problem", detail: "Why now" },
      { num: "02", title: "Our approach", detail: "How it works" },
      { num: "03", title: "The results", detail: "Proof" },
      { num: "04", title: "What's next", detail: "Roadmap" },
    ],
  },
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
  // Block's own showcase sample copy — see `examples` above.
  examples,
  // The decoration component families block offers (starburst · slab · stripe · badge).
  decorations: [...DECORATION_COMPONENTS],
};
