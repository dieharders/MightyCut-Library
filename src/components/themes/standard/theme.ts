// Standard theme — the museum-catalog frame system: a warm sandstone canvas, near-black Playfair
// Display headlines in sentence case, warm-gray Inter paragraphs, brownstone uppercase labels, and a
// SINGLE hairline weight carrying every border, rule and compass ring in the deck. No shadows, no
// elevated cards, no rounded rectangles — 50% is the only radius, reserved for true circles.
// Ported from video-assets/themes/standard/frame-showcase.html + frame.css onto the shared
// component system. Everything standard OWNS lives in this folder, imported as text:
//   frame.css        the `.mc-frame` base (frame ground, body wrapper, h3, the bare brownstone
//                    eyebrow label) + the backdrop ink hooks
//   <element>.css    standard's SKIN for each shared primitive/treatment (structure + behavior are
//                    shared; standard styles the standard class names here)
// The `:root` tokens are DERIVED from the 10-role `palette` below (see `tokensCss`), the same
// shape block, future, capsule, professional and creative use. The reference's `--st-*` identity
// layer does NOT exist here: every colour a skin needs is one of the ten roles, and anything
// lighter/darker/translucent is derived per-use with color-mix().
//
// WHAT MAKES STANDARD DIFFERENT FROM THE OTHER LIGHT THEMES. Professional is also restrained, also
// cream-grounded, also shadowless — so the boundary has to be real. Three things draw it:
//   • THE PALETTE IS MONOCHROME. Professional spends a single SATURATED cobalt on every accent;
//     standard has no saturated colour at all. Its "accent" is a stone brownstone, and its emphasis
//     device is TYPE CONTRAST (serif against sans, ink against gray) rather than hue.
//   • ONE LINE WEIGHT. Professional tints (5% fills, 22% borders, gently rounded). Standard fills
//     almost nothing and rounds nothing: the 0.125rem hairline is the entire structural
//     vocabulary, and the Line brownstone that draws it is its own palette role.
//   • THE BACKDROP IS NOTHING. Professional grounds every deck on the hatch mask; standard's
//     default is `plain` — the bare stone. Atmosphere comes from the compass decorations a scene
//     opts into, never from an always-on field.
import { STANDARD_DECORATION_COMPONENTS } from "../../primitives/standard-decoration-shapes";
import type { ThemeTokens } from "../../runtime/types";
// This theme's frame base. It states NO safe-area value and has no side exception: the safe area
// is themes/safe-area.css, shared by all six, and the RUNTIME pushes it ahead of this file into
// every scene (`@safe-area` in runtime/treatment.ts) — no theme mentions it, so no theme can
// forget it or disagree with it. Adding a `--safe-top`/`--safe-side`/`--safe-bottom` here would
// not be an override to weigh up: safe-area.css is emitted FIRST at identical specificity, so a
// later declaration in this file silently wins over the one rule the whole library depends on.
import frameCss from "./frame.css" with { type: "text" };
// Component skins.
import agendaItemCss from "./agenda-item.css" with { type: "text" };
import barCss from "./bar.css" with { type: "text" };
import captionCss from "./caption.css" with { type: "text" };
import cardCss from "./card.css" with { type: "text" };
import ctaCss from "./cta.css" with { type: "text" };
// The HUD's GEOMETRY is shared by every theme (one band, one grid) and is concatenated ahead of
// the skin below; hud.css here is paint only. See primitives/hud/geometry.css for why.
import hudCss from "./hud.css" with { type: "text" };
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

// Palette — standard's colour for each of the 10 shared palette roles (types/palette.ts). The
// SINGLE source of truth: it drives the showcase Palette section AND generates the `:root` custom
// properties below. It de-dupes to the reference's own seven: Brownstone, Line, Sandstone, Stone, Gray,
// White, Ink.
//
// THE FOUR ACCENT-CYCLE SLOTS ARE ALL THE ONE BROWNSTONE. ACCENT_CYCLE walks
// primary→secondary→accent-1→accent-2 to colour a repeated row (stat figures, card icon rings, bar
// fills), so filling all four with the same stone is what makes "a monochrome theme" true at the
// palette level instead of per-skin — a three-card row, a four-stat grid and an auto-cycled ledger
// all resolve to brownstone with no `!important` anywhere. It is the same device professional uses for
// its single cobalt, answered by a theme that has no saturated hue to spend.
//
// accent-3 IS THE HAIRLINE, and it is on accent-3 for a structural reason rather than an arbitrary
// one: accent-3 is the ONE accent role OUTSIDE the cycle, so nothing can auto-assign it. That
// matters here more than in any other theme, because the Line brownstone is a BORDER colour — light
// enough to disappear as type. Parked off-cycle, it is reached only where a skin or a scene names
// it, which is every border, rule, ring and track in the theme and nothing else.
//
// muted-1 / muted-2 are the RAISED/RECESSED stone pair the reference calls BG Primary and BG
// Secondary. muted-1 is the canvas every frame grounds on (`groundDefault`); muted-2 is the
// recessed fill — chart columns, rank tracks, the ledger's quiet column — and the ground a scene
// picks when it wants the reference's deeper-stone data frame.
const palette: NonNullable<ThemeTokens["palette"]> = [
  {
    name: "Brownstone",
    hex: "#8A8178",
    note: "the accent — labels, numerals, small text",
    varName: "primary",
  },
  { name: "Brownstone", hex: "#8A8178", varName: "secondary" },
  { name: "Brownstone", hex: "#8A8178", varName: "accent-1" },
  { name: "Brownstone", hex: "#8A8178", varName: "accent-2" },
  {
    name: "Line",
    hex: "#B8B0A4",
    note: "the universal hairline",
    varName: "accent-3",
  },
  { name: "Sandstone", hex: "#EDE8E0", note: "canvas", varName: "muted-1" },
  {
    name: "Stone",
    hex: "#E2DBD1",
    note: "recessed fill + tracks",
    varName: "muted-2",
  },
  { name: "Gray", hex: "#5A5A5A", note: "body text", varName: "muted-3" },
  {
    name: "White",
    hex: "#FFFFFF",
    note: "tracing-paper overlay (never a ground)",
    varName: "light",
  },
  {
    name: "Ink",
    hex: "#1A1A1A",
    note: "headlines + the one black rule",
    varName: "dark",
  },
];

/** Font tokens — the only `:root` entries that aren't colours. Playfair Display (--disp) carries
 *  every DISPLAY voice: headlines, card/step/agenda titles, stat figures, bar values and the
 *  pull-quote statement. Inter carries everything else — paragraphs (--body) and the labels /
 *  eyebrows / counters / chrome (--mono), which is one face doing two jobs on purpose: standard
 *  separates those voices by CASE AND TRACKING, not by family.
 *
 *  Inter is already in the core chrome set (assets/fonts.css); Playfair Display is standard's OWN
 *  add-on (assets/fonts/standard-fonts.css, injected by engine/register-standard), so a standard
 *  deck downloads exactly one extra family. */
const fontTokens: Record<string, string> = {
  disp: '"Playfair Display", serif',
  body: '"Inter", sans-serif',
  mono: '"Inter", sans-serif',
};

/** Type-SIZE tokens — standard's own type scale. This is to `font-size` what `palette` is to
 *  colour: a skin NAMES a step, it never writes a number. The steps are STANDARD's — every theme
 *  derives its own from its own ramp, and only the SHAPE (the step vocabulary, ascending, on the
 *  0.125rem grid, no adjacent pair closer than 1.10x) is shared. Standard's runs the widest of the
 *  six, because a catalogue voice needs a real 1.25rem label AND a 9.5rem display statement.
 *
 *  The top of the ramp is ANCHORED, not chosen: `3xl` IS the content-frame h3 (the seven-treatment
 *  normalisation 8fb19d7 landed, which the pull quote also takes), `4xl` IS the stat figure, and
 *  `max` IS the cover and closing plate. The jumps up there are leaps rather than steps — display
 *  type is supposed to break the ramp. */
const sizeTokens: Record<string, string> = {
  "font-size-xs": "1.25rem",
  "font-size-sm": "1.5rem",
  "font-size-md": "1.75rem",
  "font-size-lg": "2.125rem",
  "font-size-xl": "2.625rem",
  "font-size-2xl": "3.375rem",
  "font-size-3xl": "4.75rem",
  "font-size-4xl": "6rem",
  "font-size-max": "9.5rem",
};

/** THE TRACING-PAPER PLATE — the one wash this theme fills with, written down once.
 *
 *  Standard draws rather than fills: the ledger, the matrix and the timeline are hairlines on
 *  bare stone, and the only things that take a surface are the ones that must SEPARATE from
 *  whatever is behind them. That wash used to be `--light 30%` over `transparent`, which is
 *  calibrated for the sandstone canvas alone — 30% white on near-white stone is the barely-there
 *  lift the theme wants, but on a dark or saturated slide ground the same 30% is a grey veil,
 *  and a card's ink title and gray body sink into it. 70% keeps the ground tinting the paper
 *  (this is still a wash, not an opaque tile — the stone shows through and the frame is still
 *  drawn on, not stacked on) while holding a light plate under the type on ANY ground.
 *
 *  The DIAGRAM's fills are deliberately not this: `.cpuck` and `.hub` mix the wash into
 *  `--ground` instead of into `transparent`, so they are already fully opaque and cannot be
 *  washed out by the ground — they stay at 30%, which is the value that reads as bare stone
 *  inside a hairline. See cluster-node.css.
 *
 *  In `:root` rather than frame.css because a component previewed BARE in the showcase gets
 *  `theme.css` and its own skin but no frame base (engine/mount.ts). */
const surfaceTokens: Record<string, string> = {
  plate: "color-mix(in srgb, var(--light) 70%, transparent)",
};

/** :root, DERIVED from `palette` + `fontTokens` + `sizeTokens` + `surfaceTokens` — every hex,
 *  every size and the one paper wash written down exactly once (matching block, future, capsule,
 *  professional and creative). */
const tokensCss = `:root {\n${[
  ...palette.map((p) => `  --${p.varName}: ${p.hex.toLowerCase()};`),
  ...Object.entries(fontTokens).map(
    ([name, value]) => `  --${name}: ${value};`,
  ),
  ...Object.entries(sizeTokens).map(
    ([name, value]) => `  --${name}: ${value};`,
  ),
  ...Object.entries(surfaceTokens).map(
    ([name, value]) => `  --${name}: ${value};`,
  ),
].join("\n")}\n}\n`;

// Typography — the type roles (frame-showcase.html TYPOGRAPHY section). `style` is the
// self-contained inline CSS the showcase renders each live sample with (px is fine here — a sample
// is not a skin). The whole ramp is two faces and two colours: Playfair/ink for what declares and
// Inter/gray for what explains. Colour never carries emphasis.
const typography: ThemeTokens["typography"] = [
  {
    token: "heading",
    spec: "Playfair Display 700 · sentence case · line 1.04 — the cover and closing statement, and nothing else",
    sample: "Considered.",
    style:
      "font-family: var(--disp); font-weight: 700; letter-spacing: 0; line-height: 1.04; font-size: 92px; color: var(--dark);",
  },
  {
    token: "title",
    spec: "Playfair Display 600 · sentence case · line 1.1 — the headline on every content frame",
    sample: "Drawn in one line",
    style:
      "font-family: var(--disp); font-weight: 600; letter-spacing: 0; line-height: 1.1; font-size: 56px; color: var(--dark);",
  },
  {
    token: "body",
    spec: "Inter 400 · line 1.55 · warm gray — paragraphs & supporting copy, recessive by design",
    sample:
      "Inter carries every paragraph in warm gray — readable, recessive, never competing with the serif statement above it.",
    style:
      "font-family: var(--body); font-weight: 400; font-size: 18px; line-height: 1.55; max-width: 680px; color: var(--muted-3);",
  },
];

// Frame Rules — Do / Don't bullets (frame-showcase.html PRINCIPLES section), restated against what
// the PORTED CSS actually does. Two of the reference's lines move: its "1px" becomes the 0.125rem
// grid floor (the same rule, in the library's unit), and its Playfair 400 becomes 600/700 because
// a didone's hairlines thin out at frame scale on a warm ground.
const rules: ThemeTokens["rules"] = {
  do: [
    "Use ONE hairline — 0.125rem in the Line brownstone — for every border, rule, track and ring. The hairline is the identity.",
    "Set every Playfair Display headline in sentence case, in ink, at 600 (700 for the cover and the closing statement).",
    "Render labels in brownstone Inter, uppercase, tracked 0.22em — no chip, no fill, no border.",
    "Let type contrast carry emphasis: serif against sans, ink against warm gray. Never a hue.",
    "Layer one or two compass rings (solid outer, dashed inner) behind the content, and let the frame breathe.",
  ],
  dont: [
    "No populist accent colour — no red, blue or green; stone and ink only.",
    "No bold Playfair Display, no brownstone headlines, no thick borders.",
    "No shadows, no elevated cards, no rounded rectangles — 50% is the only radius, and it is for circles.",
    "Don't crowd the frame; a packed layout reads as broken here in a way it doesn't in a louder theme.",
    "Never more than two geometric decorations per frame.",
  ],
};

// Showcase sample copy — standard's OWN examples (a quiet, curatorial voice), so its treatment
// cards read as Standard. Each entry's `params` seed the treatment's slots; `children` seed the
// child rows. SHOWCASE-ONLY — real decks use spec content. The key structure mirrors the other
// live themes so the showcase-parity tripwire passes (see registry.test.ts).
const examples: NonNullable<ThemeTokens["examples"]> = {
  cover: {
    params: {
      headline: "The standard in restraint.",
      subtitle:
        "A quiet museum-catalog system in motion — warm stone, one hairline, compass-drafted geometry.",
    },
  },
  statement: {
    params: {
      text: "Nothing is bold. Nothing is loud.",
      attribution: "The System Voice",
      eyebrow: "On Measure",
    },
  },
  "outro": {
    params: {
      headline: "Well framed, on stone.",
      cta: "Begin the conversation",
    },
  },
  "feature-cards": {
    params: { headline: "Considered by hand" },
    children: [
      {
        title: "Hairline",
        body: "One brownstone rule carries every border in the deck.",
        icon: "I",
        accent: "primary",
      },
      {
        title: "Restraint",
        body: "Emphasis comes from type contrast, never from weight or hue.",
        icon: "II",
        accent: "secondary",
      },
      {
        title: "Silence",
        body: "Generous negative space; a frame is allowed to be mostly empty.",
        icon: "III",
        accent: "accent-1",
      },
    ],
  },
  "stats": {
    params: { headline: "A measured record" },
    children: [
      {
        value: 5,
        label: "Stones",
        unitSuffix: "",
        decimals: 0,
        accent: "primary",
      },
      { value: 1, label: "Line weights", unitSuffix: "", accent: "secondary" },
      { value: 0, label: "Shadows", unitSuffix: "", accent: "accent-1" },
    ],
  },
  timeline: {
    params: { headline: "Four movements" },
    children: [
      { num: "01", title: "Survey", body: "Establish the stone canvas." },
      { num: "02", title: "Draft", body: "Lay the compass arcs." },
      { num: "03", title: "Frame", body: "Hairline the structure." },
      { num: "04", title: "Deliver", body: "A quiet, exact record." },
    ],
  },
  matrix: {
    params: {
      headline: "Three approaches, one rule",
      criteria: ["Legible", "Durable", "Quiet"],
      caption: "Measured against the house rules, not against fashion",
    },
    children: [
      {
        label: "Convention",
        sublabel: "Heavy rules and drop shadows",
        cells: ["yes", "no", "no"],
      },
      {
        label: "Minimal",
        sublabel: "Restraint without a system",
        cells: ["no", "yes", "yes"],
      },
      {
        label: "The Standard",
        sublabel: "One hairline, stone and ink",
        cells: ["yes", "yes", "yes"],
        highlight: true,
      },
    ],
  },
  "pill-wall": {
    params: {
      headline: "The full collection",
      caption: "Holdings by department, as catalogued",
    },
    children: [
      { text: "Drawings" },
      { text: "Photography" },
      { text: "Ceramics" },
      { text: "Textiles" },
      { text: "Furniture" },
      { text: "Metalwork" },
      { text: "Glass" },
      { text: "Paint" },
      { text: "Pen & Ink" },
      { text: "Exotic" },
      { text: "Paper" },
    ],
  },
  team: {
    params: {
      headline: "Curatorial staff",
      caption: "Departmental leads, as listed in the catalogue",
    },
    children: [
      {
        name: "Eleanor Vance",
        role: "Head Curator",
        org: "Prints & Drawings",
        accent: "primary",
      },
      {
        name: "Marcus Bell",
        role: "Conservator",
        org: "Paper Conservation",
        accent: "secondary",
      },
      {
        name: "Ines Duarte",
        role: "Registrar",
        org: "Collections",
        accent: "accent-1",
      },
    ],
  },
  "trend-line": {
    params: {
      headline: "Visitors by season",
      caption: "Recorded admissions, in thousands",
    },
    children: [
      {
        labels: ["Spring", "Summer", "Autumn", "Winter"],
        values: [42, 68, 51, 29],
        max: 68,
        unitSuffix: "k",
      },
    ],
  },
  "cluster": {
    params: {
      headline: "One collection, many rooms",
      hub: "The Collection",
      caption: "Departments as catalogued",
    },
    children: [
      {
        label: "Drawings",
        detail: "2,400 works",
        index: 0,
        total: 5,
        accent: "primary",
      },
      {
        label: "Prints",
        detail: "1,100 works",
        index: 1,
        total: 5,
        accent: "secondary",
      },
      {
        label: "Ceramics",
        detail: "640 works",
        index: 2,
        total: 5,
        accent: "accent-1",
      },
      {
        label: "Textiles",
        detail: "390 works",
        index: 3,
        total: 5,
        accent: "accent-2",
      },
      {
        label: "Glass",
        detail: "210 works",
        index: 4,
        total: 5,
        accent: "primary",
      },
    ],
  },
  comparison: {
    params: {
      headline: "Two approaches",
      columns: ["Convention", "The Standard"],
    },
    children: [
      { label: "Border", a: "Heavy rule", b: "One hairline" },
      { label: "Depth", a: "Drop shadow", b: "Type contrast" },
      { label: "Colour", a: "Bright accent", b: "Stone and ink" },
    ],
  },
  "bar-chart": {
    params: {
      headline: "By quarter",
      caption: "Measured across the programme.",
    },
    children: [
      { value: 42, label: "Q1", max: 96, unitSuffix: "" },
      { value: 68, label: "Q2", max: 96, unitSuffix: "" },
      { value: 79, label: "Q3", max: 96, unitSuffix: "" },
      { value: 96, label: "Q4", max: 96, unitSuffix: "", leader: true },
    ],
  },
  "bar-ranking": {
    params: { headline: "What moves it", caption: "Ranked by contribution." },
    children: [
      {
        value: 88,
        label: "Expansion",
        max: 100,
        unitSuffix: "%",
        leader: true,
      },
      { value: 62, label: "New Logos", max: 100, unitSuffix: "%" },
      { value: 41, label: "Pricing", max: 100, unitSuffix: "%" },
    ],
  },
  agenda: {
    params: { headline: "Four considerations" },
    children: [
      { num: "01", title: "On Measure", detail: "The unit of restraint" },
      { num: "02", title: "On Margin", detail: "Room to breathe" },
      { num: "03", title: "On the Single Line", detail: "One rule, repeated" },
      { num: "04", title: "On Silence", detail: "Negative space" },
    ],
  },
};

// Standard's hero-frame decorations. This theme runs a `plain` backdrop, so its decorations
// ARE the atmosphere — which is also why its own rules cap them at TWO per frame, a ceiling
// the closer reaches and the cover and quote deliberately sit under. Brownstone (primary)
// draws the one lit instrument; Line (accent-3), the hairline stone, carries every mark
// meant to stay quiet on the sandstone canvas each frame grounds on. Each decoration takes a
// reveal cascade slot.
// `list` currently shares feature-cards' skin, so it shares its showcase example too —
// aliased rather than copied, so the two cannot drift into different copy while rendering
// identically. When the list-number rendering lands this becomes an entry of its own.
examples["list"] = examples["feature-cards"]!;

const decorationDefaults: NonNullable<ThemeTokens["decorationDefaults"]> = {
  // One brownstone dial on the right margin at the vertical centre, cropped by the edge —
  // the cover's single instrument, opposite the left-set headline.
  cover: [
    {
      name: "compass",
      params: {
        variant: "dial",
        x: 95,
        y: 50,
        size: 40,
        accent: "primary",
        layer: "back",
      },
    },
  ],
  // The same pivot twice, pinned to opposite corners (0,0 and 100,100) so each is quartered
  // by the frame edge — one instrument read as two cropped halves on the diagonal, which is
  // how the reference dresses a closer without adding a second shape to count.
  "outro": [
    {
      name: "azimuth",
      params: {
        variant: "pivot",
        x: 0,
        y: 0,
        size: 46,
        accent: "accent-3",
        layer: "back",
      },
    },
    {
      name: "azimuth",
      params: {
        variant: "pivot",
        x: 100,
        y: 100,
        size: 46,
        accent: "accent-3",
        layer: "back",
      },
    },
  ],
  // The oversized quotation mark, low-left of the centred statement — a real component now
  // rather than the `.qcard::before` the skin used to bake in, so a scene can move it,
  // resize it or drop it (see quote.css). The frame's only mark; it spends one of the two.
  statement: [
    {
      name: "sorts",
      params: {
        variant: "quotation",
        x: 13,
        y: 76,
        size: 18,
        accent: "accent-3",
        layer: "back",
      },
    },
  ],
};

export const standardTheme: ThemeTokens = {
  name: "standard",
  title: "Standard",
  description:
    "A quiet museum-catalog theme on warm stone. Brownstone uppercase labels. Single hairline border and compass ring. No colour, no shadows. Frame unit: 1920×1080, 16:9.",
  css: tokensCss,
  frameCss,
  // Every standard frame lands on the warm sandstone canvas: groundDefault REPLACES the shared
  // per-treatment grounds (which are block-flavoured) without pinning them, so a scene that
  // explicitly picks a ground still gets it — the thing a `background: … !important` makes
  // impossible. The reference reached the same monochrome result by mapping several roles onto one
  // stone hex; doing it here would have cost the accent cycle its colour, so the pin does the job
  // and --muted-2 stays free as the deeper-stone ground a data frame can ask for by name.
  groundDefault: "muted-1",
  // Standard's DEFAULT backdrop: `plain` — NO mask. Every other live theme grounds its decks on a
  // field (block dots, future constellation, capsule gradient, professional hatch, creative
  // sunburst); standard's design rules say the frame should breathe, and a full-bleed pattern
  // under a hairline system reads as noise competing with the one line weight. The bare stone IS
  // the backdrop. This is still a DEFAULT, not a refusal: every mask in the shared pool is
  // re-tinted for standard in frame.css (the ruled designs onto the Line brownstone), so a scene that
  // wants drafting paper under one slide only has to name it.
  backdrop: "plain",
  // Showcase/editor preview surface — the warm sandstone canvas standard's components are designed
  // against, so the tracing-paper fills and hairline borders read. Taken off the palette
  // (--muted-1) rather than repeated as a literal.
  previewBg: palette.find((p) => p.varName === "muted-1")!.hex.toLowerCase(),
  // …and standard is a LIGHT theme, stated outright (not inferred from previewBg).
  previewScheme: "light",
  // Standard's skins for every shared element it renders. The element trios carry no css; these are
  // the standard look.
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
  // No template overrides: standard reaches its whole look in CSS alone. The reference's compass
  // rings and its oversized quotation mark are decoration COMPONENTS here, not markup; and its stat
  // has no corner dot, so the shared node is styled away rather than removed (nothing animates it).
  palette,
  typography,
  rules,
  examples,
  // Standard's OWN decoration families (compass · sweep · azimuth · sorts) — the drafting table and
  // the type case, at the theme's single hairline weight, casting no shadow. The four are one page
  // split on KIND so no two ever read alike: compass CLOSES a curve (concentric ring pairs), sweep
  // leaves one OPEN (the arcs), azimuth strikes STRAIGHT radii (compass rose, protractor fan,
  // graduated dial), and sorts SETS a character — a single Playfair punctuation mark blown up to
  // watermark scale, which is the one decoration in the library made of a theme's own typography
  // rather than of geometry. Themes don't share decorations: this roster lists only standard's, and
  // every one is held out of the Components grid globally. Opt-in per scene via addDecorations() —
  // and with a `plain` backdrop these are the theme's only atmosphere, which is why the rules cap
  // them at two per frame.
  decorations: [...STANDARD_DECORATION_COMPONENTS],
  // …and how the hero frames wear them by default — see `decorationDefaults` above.
  decorationDefaults,
};
