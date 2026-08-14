// Block theme — everything block OWNS lives in this folder, imported as text (the
// same convention as the component trio CSS):
//   frame.css   the shared frame base — the `.mc-frame` ground, the `.body`
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
// This theme's frame base. It states NO safe-area value and has no side exception: the safe area
// is themes/safe-area.css, shared by all six, and the RUNTIME pushes it ahead of this file into
// every scene (`@safe-area` in runtime/treatment.ts) — no theme mentions it, so no theme can
// forget it or disagree with it. Adding a `--safe-top`/`--safe-side`/`--safe-bottom` here would
// not be an override to weigh up: safe-area.css is emitted FIRST at identical specificity, so a
// later declaration in this file silently wins over the one rule the whole library depends on.
import frameCss from "./frame.css" with { type: "text" };
// Per-element skins block OWNS. Every primitive + treatment is structure+behavior only
// (template/schema/anim); block styles their standard class names here, in
// themes/block/<name>.css. The runtime prefers theme.skins[name] over an element's own
// css (which is now empty), so another theme restyles the same names from its own folder.
// The HUD's GEOMETRY is shared by every theme (one band, one grid) and is concatenated ahead of
// the skin below; hud.css here is paint only. See primitives/hud/geometry.css for why.
import hudCss from "./hud.css" with { type: "text" };
import captionCss from "./caption.css" with { type: "text" };
// Component skins.
import agendaItemCss from "./agenda-item.css" with { type: "text" };
import barCss from "./bar.css" with { type: "text" };
import cardCss from "./card.css" with { type: "text" };
import ctaCss from "./cta.css" with { type: "text" };
import iconCss from "./icon.css" with { type: "text" };
import listNumberCss from "./list-number.css" with { type: "text" };
import matrixRowCss from "./matrix-row.css" with { type: "text" };
import teamMemberCss from "./team-member.css" with { type: "text" };
import plotCss from "./plot.css" with { type: "text" };
import clusterNodeCss from "./cluster-node.css" with { type: "text" };
import pillCss from "./pill.css" with { type: "text" };
import rankCss from "./rank.css" with { type: "text" };
import rowCss from "./row.css" with { type: "text" };
import statCss from "./stat.css" with { type: "text" };
import stepCss from "./step.css" with { type: "text" };
// Treatment skins.
import agendaCss from "./agenda.css" with { type: "text" };
import barRankingCss from "./bar-ranking.css" with { type: "text" };
import barChartCss from "./bar-chart.css" with { type: "text" };
import outroCss from "./outro.css" with { type: "text" };
import comparisonCss from "./comparison.css" with { type: "text" };
import coverCss from "./cover.css" with { type: "text" };
import featureCardsCss from "./feature-cards.css" with { type: "text" };
import matrixCss from "./matrix.css" with { type: "text" };
import pillWallCss from "./pill-wall.css" with { type: "text" };
import teamCss from "./team.css" with { type: "text" };
import trendLineCss from "./trend-line.css" with { type: "text" };
import clusterCss from "./cluster.css" with { type: "text" };
import statementCss from "./statement.css" with { type: "text" };
import statsCss from "./stats.css" with { type: "text" };
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

/** Font tokens — the only `:root` entries that aren't colours. Block has exactly TWO faces, and
 *  unusually it spends the NEUTRAL one on display: Inter (--disp) carries the uppercase 800/900
 *  slab headlines, the stat figures and the reading copy alike, because block's display voice is
 *  built from weight, case and negative tracking rather than from a characterful face. Space
 *  Grotesk (--mono) carries the label voice — every eyebrow pill, bar label and counter.
 *
 *  `body` is an ALIAS of `disp` (block's own `body` type role is set in Inter, see `typography`
 *  below), stated for the same reason capsule aliases `mono` onto `body`: the three role names are
 *  a SHARED vocabulary, so a skin reaching for var(--body) out of a shared idiom must land on a
 *  real family. Undefined, that declaration is invalid at computed-value time and silently falls
 *  back to whatever the parent inherits — a wrong face with no error and nothing in the suite to
 *  catch it. Every theme defines all three; none may define fewer.
 *
 *  Both faces are in the core chrome set (assets/fonts.css), so block ships no add-on sheet. */
const fontTokens: Record<string, string> = {
  disp: '"Inter", sans-serif',
  body: '"Inter", sans-serif',
  mono: '"Space Grotesk", sans-serif',
};

/** Type-SIZE tokens — block's own type scale. This is to `font-size` what `palette` is to
 *  colour: a skin NAMES a step, it never writes a number, and the scale is the one place the
 *  theme's type ramp is stated. The steps are BLOCK's, not the library's — every theme derives
 *  its own from its own ramp, and only the SHAPE (the step vocabulary, ascending, on the 0.125rem
 *  grid) is shared. Block's is the tightest in the library: it starts at 1.75rem because block has
 *  no small copy at all, and no adjacent pair is closer than 1.10x, because a step nobody can tell
 *  from its neighbour is not a step.
 *
 *  The top of the ramp is ANCHORED, not chosen: `3xl` IS the content-frame h3 (the seven-treatment
 *  normalisation 8fb19d7 landed), `4xl` IS the stat figure, and `max` IS the cover and closing
 *  plate. That is why the jumps up there are leaps rather than steps — display type is supposed
 *  to break the ramp. If you change `3xl`, re-derive the whole scale — don't nudge one step, or
 *  the 1.10x floor stops holding. */
const sizeTokens: Record<string, string> = {
  "font-size-xs": "1.75rem",
  "font-size-sm": "2rem",
  "font-size-md": "2.25rem",
  "font-size-lg": "2.5rem",
  "font-size-xl": "2.875rem",
  "font-size-2xl": "3.375rem",
  "font-size-3xl": "4rem",
  "font-size-4xl": "5.5rem",
  "font-size-max": "9rem",
};

/**
 * The theme's `:root` block, DERIVED from `palette` + `fontTokens` + `sizeTokens` (replaces the
 * old hand-maintained tokens.css, which duplicated every hex). The harness writes this to
 * a project's assets/tokens.css; the browser engine rewrites `:root` → `:host` to
 * scope it into a shadow root.
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
      headline: "Blocky, bordered, crooked.",
      subtitle: "A maximalist, neobrutalist theme.",
    },
  },
  statement: {
    params: {
      text: "Design is not just what it looks like. Design is how it works.",
      attribution: "Steve Jobs",
      eyebrow: "In their words",
    },
  },
  "outro": {
    params: { headline: "Stay loud.", cta: "Start building" },
  },
  "feature-cards": {
    params: { headline: "Built for the whole workflow" },
    children: [
      {
        title: "Prompt to preview",
        body: "Describe the video; get a preview-ready deck back in one pass.",
        icon: "I",
        accent: "primary",
      },
      {
        title: "On-brand by default",
        body: "Themed frames, captions, and motion — no timeline surgery.",
        icon: "II",
        accent: "secondary",
      },
      {
        title: "Render on demand",
        body: "Publish the preview now; render the final MP4 whenever you like.",
        icon: "III",
        accent: "accent-2",
      },
    ],
  },
  "stats": {
    params: { headline: "Numbers that moved" },
    children: [
      {
        value: 92,
        label: "Detection rate",
        unitSuffix: "%",
        accent: "primary",
      },
      {
        value: 3,
        label: "Faster triage",
        unitSuffix: "x",
        accent: "secondary",
      },
      {
        value: 40,
        label: "Cost reduction",
        unitSuffix: "%",
        accent: "accent-1",
      },
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
  matrix: {
    params: {
      headline: "Stack Up The Options",
      criteria: ["Fast", "Auditable", "Self-serve"],
      caption: "Scored on the three things buyers ask about first",
    },
    children: [
      {
        label: "Status Quo",
        sublabel: "What most teams run today",
        cells: ["no", "yes", "no"],
      },
      {
        label: "Point Tools",
        sublabel: "Stitched together per team",
        cells: ["yes", "no", "no"],
      },
      {
        label: "Our Platform",
        sublabel: "The proposed approach",
        cells: ["yes", "yes", "yes"],
        highlight: true,
      },
    ],
  },
  "pill-wall": {
    params: {
      headline: "Plugs Into Everything",
      caption: "Every integration ships on day one",
    },
    children: [
      { text: "Slack" },
      { text: "Jira" },
      { text: "GitHub" },
      { text: "Notion" },
      { text: "Figma" },
      { text: "Linear" },
      { text: "Datadog" },
      { text: "Snowflake" },
      { text: "Dropbox" },
      { text: "Google Drive" },
      { text: "SharePoint" },
      { text: "Trello" },
    ],
  },
  team: {
    params: {
      headline: "Who Builds It",
      caption: "The core team, end to end",
    },
    children: [
      {
        name: "Ada Byron",
        role: "Head of Research",
        org: "Analytical Engines",
        accent: "primary",
      },
      {
        name: "Grace Hopper",
        role: "Chief Architect",
        org: "Compiler Group",
        accent: "secondary",
      },
      {
        name: "Alan Turing",
        role: "Principal Scientist",
        org: "Machine Intelligence",
        accent: "accent-1",
      },
    ],
  },
  "trend-line": {
    params: {
      headline: "Losses Keep Falling",
      caption: "Incidents per 1,000 sessions",
    },
    children: [
      {
        labels: ["Q1", "Q2", "Q3", "Q4"],
        values: [61, 44, 29, 18],
        max: 61,
        unitSuffix: "",
      },
    ],
  },
  "cluster": {
    params: {
      headline: "One Hub, Every Feed",
      hub: "Platform",
      caption: "Everything lands in the same place",
    },
    children: [
      {
        label: "Slack",
        detail: "alerts",
        index: 0,
        total: 5,
        accent: "primary",
      },
      {
        label: "Jira",
        detail: "tickets",
        index: 1,
        total: 5,
        accent: "secondary",
      },
      {
        label: "GitHub",
        detail: "commits",
        index: 2,
        total: 5,
        accent: "accent-1",
      },
      {
        label: "Okta",
        detail: "identity",
        index: 3,
        total: 5,
        accent: "accent-2",
      },
      {
        label: "Datadog",
        detail: "metrics",
        index: 4,
        total: 5,
        accent: "primary",
      },
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
  "bar-chart": {
    params: { headline: "Revenue by quarter", caption: "Net new revenue" },
    children: [
      { value: 42, label: "Q1", max: 96, unitPrefix: "$", unitSuffix: "M" },
      { value: 68, label: "Q2", max: 96, unitPrefix: "$", unitSuffix: "M" },
      { value: 79, label: "Q3", max: 96, unitPrefix: "$", unitSuffix: "M" },
      {
        value: 96,
        label: "Q4",
        max: 96,
        unitPrefix: "$",
        unitSuffix: "M",
        leader: true,
      },
    ],
  },
  "bar-ranking": {
    params: {
      headline: "Market share by vendor",
      caption: "Share of new installs, 2026",
    },
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

// The shapes block's hero frames wear when a caller adds none — the pink star and blue
// tilt-rect that have always ridden the cover, now declared HERE rather than on the shared
// treatment def (only a theme may name its own decoration families). These are also what
// the showcase seeds its editable decoration rows from, so what a user sees listed is
// exactly what renders. Two per frame, three on the closer: every decoration takes a reveal
// cascade slot, so the count is the headline's delay.
// `list` currently shares feature-cards' skin, so it shares its showcase example too —
// aliased rather than copied, so the two cannot drift into different copy while rendering
// identically. When the list-number rendering lands this becomes an entry of its own.
examples["list"] = examples["feature-cards"]!;

const decorationDefaults: NonNullable<ThemeTokens["decorationDefaults"]> = {
  // Pink star top-right, blue tilt-rect lower-right — clear of the left-set headline.
  cover: [
    {
      name: "starburst",
      params: {
        variant: "star",
        x: 87,
        y: 20,
        size: 14,
        rotate: -21,
        accent: "primary",
        layer: "back",
      },
    },
    {
      name: "slab",
      params: {
        variant: "cross",
        x: 88,
        y: 78,
        size: 20,
        rotate: 31,
        accent: "secondary",
        layer: "back",
      },
    },
  ],
  // A blue tilt-rect and a yellow star stacked low-left, plus a big blue disc bleeding off
  // the top-right corner. All three sit BEHIND the statement card — the closer's own hard
  // offset is the shape that reads in front, so nothing here competes with it.
  "outro": [
    {
      name: "starburst",
      params: {
        variant: "triangle",
        x: 12,
        y: 79,
        size: 12,
        rotate: 19,
        accent: "accent-1",
        layer: "back",
      },
    },
    {
      name: "starburst",
      params: {
        variant: "circle",
        x: 97,
        y: 0,
        size: 26,
        accent: "secondary",
        layer: "back",
      },
    },
  ],
  // The quote card is centred, so both flourishes sit hard in opposite corners: a tilted
  // yellow capsule upper-left, a cream rhombus lower-right.
  statement: [
    {
      name: "badge",
      params: {
        variant: "capsule",
        x: 2,
        y: 20,
        size: 14,
        rotate: -21,
        accent: "accent-1",
        layer: "back",
      },
    },
    {
      name: "slab",
      params: {
        variant: "rhombus",
        x: 97,
        y: 79,
        size: 14,
        rotate: 8,
        accent: "muted-1",
        layer: "back",
      },
    },
  ],
};

export const blockTheme: ThemeTokens = {
  name: "block",
  title: "Block",
  description:
    "A maximalist neobrutalist theme: black borders, hard offset shadows, square corners, tilted decorations, saturated pastel accents, shadows stacking comfortably dense. Frame unit: 1920×1080, 16:9.",
  css: tokensCss,
  frameCss,
  // Block's DEFAULT backdrop mask: the ink dot-grid painted over every ground — also the
  // signature design block contributes to the SHARED pool (any theme may use it, recoloured
  // through --dots-ink). A scene can pick any other design (storyboard/deck `backdrop`);
  // see primitives/backdrops.ts.
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
    "bar-chart": barChartCss,
    "outro": outroCss,
    comparison: comparisonCss,
    cover: coverCss,
    "feature-cards": featureCardsCss,
    // `list` shares the feature-cards skin: the two looks compose identically today (both
    // emit `card` children), and splitting them is what makes each SELECTABLE. When the
    // list-number rendering lands, this points at its own sheet and nothing else moves.
    "list": featureCardsCss,
    matrix: matrixCss,
    "pill-wall": pillWallCss,
    team: teamCss,
    "trend-line": trendLineCss,
    "cluster": clusterCss,
    statement: statementCss,
    "stats": statsCss,
    timeline: timelineCss,
  },
  // Block's content fonts (Inter, Space Grotesk) are a subset of the always-staged core
  // chrome set (core-fonts.ts), staged by copyProjectAssets — block ships no add-on font of
  // its own. (No `fonts` field: it was dead metadata no staging path ever read — staging is
  // theme-name-keyed on disk. The font-coverage tripwire in theme-parity.test.ts checks the
  // families in `css` against the core set instead.)
  palette,
  typography,
  rules,
  // Block's own showcase sample copy — see `examples` above.
  examples,
  // The decoration component families block offers (starburst · slab · stripe · badge).
  decorations: [...DECORATION_COMPONENTS],
  // …and how the hero frames wear them by default — see `decorationDefaults` above.
  decorationDefaults,
};
