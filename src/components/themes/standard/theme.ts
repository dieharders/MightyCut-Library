// Standard theme — the museum-catalog frame system: a warm sandstone canvas, near-black Playfair
// Display headlines in sentence case, warm-gray Inter paragraphs, brownstone uppercase labels, and a
// SINGLE hairline weight carrying every border, rule and compass ring in the deck. No shadows, no
// elevated cards, no rounded rectangles — 50% is the only radius, reserved for true circles.
// Ported from video-assets/themes/standard/frame-showcase.html + frame.css onto the shared
// component system. Everything standard OWNS lives in this folder, imported as text:
//   frame.css        the `.block-frame` base (frame ground, body wrapper, h3, the bare brownstone
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
import frameCss from "./frame.css" with { type: "text" };
// Component skins.
import agendaItemCss from "./agenda-item.css" with { type: "text" };
import barCss from "./bar.css" with { type: "text" };
import captionCss from "./caption.css" with { type: "text" };
import cardCss from "./card.css" with { type: "text" };
import ctaCss from "./cta.css" with { type: "text" };
import hudCss from "./hud.css" with { type: "text" };
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

/** :root, DERIVED from `palette` + `fontTokens` — every hex written down exactly once (matching
 *  block, future, capsule, professional and creative). */
const tokensCss = `:root {\n${[
  ...palette.map((p) => `  --${p.varName}: ${p.hex.toLowerCase()};`),
  ...Object.entries(fontTokens).map(
    ([name, value]) => `  --${name}: ${value};`,
  ),
].join("\n")}\n}\n`;

// Typography — the type roles (frame-showcase.html TYPOGRAPHY section). `style` is the
// self-contained inline CSS the showcase renders each live sample with (px is fine here — a sample
// is not a skin). The whole ramp is two faces and three colours: Playfair/ink for what declares,
// Inter/gray for what explains, Inter/brownstone for what labels. Colour never carries emphasis.
const typography: ThemeTokens["typography"] = [
  {
    token: "display",
    spec: "Playfair Display 700 · sentence case · line 1.04 — the cover and closing statement, and nothing else",
    sample: "Considered.",
    style:
      "font-family: var(--disp); font-weight: 700; letter-spacing: 0; line-height: 1.04; font-size: 92px; color: var(--dark);",
  },
  {
    token: "heading",
    spec: "Playfair Display 600 · sentence case · line 1.1 — the headline on every content frame",
    sample: "Drawn in one line",
    style:
      "font-family: var(--disp); font-weight: 600; letter-spacing: 0; line-height: 1.1; font-size: 56px; color: var(--dark);",
  },
  {
    token: "figure",
    spec: "Playfair Display 600 · ink · line 1 — a stat figure, a bar value, an agenda numeral; the serif does the numbers too",
    sample: "24.3",
    style:
      "font-family: var(--disp); font-weight: 600; line-height: 1; font-size: 76px; color: var(--dark);",
  },
  {
    token: "body",
    spec: "Inter 400 · line 1.55 · warm gray — paragraphs & supporting copy, recessive by design",
    sample:
      "Inter carries every paragraph in warm gray — readable, recessive, never competing with the serif statement above it.",
    style:
      "font-family: var(--body); font-weight: 400; font-size: 18px; line-height: 1.55; max-width: 680px; color: var(--muted-3);",
  },
  {
    token: "label",
    spec: "Inter 500 · uppercase · 0.22em · brownstone — every eyebrow, stat label, column head and counter; no chip, no fill",
    sample: "Section · Eyebrow",
    style:
      "font-family: var(--mono); font-weight: 500; text-transform: uppercase; letter-spacing: 0.22em; font-size: 15px; color: var(--primary);",
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
      eyebrow: "Standard",
    },
  },
  quote: {
    params: {
      text: "Nothing is bold. Nothing is loud.",
      attribution: "The System Voice",
      eyebrow: "On Measure",
    },
  },
  "closing-plate": {
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
  "stat-grid": {
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
  chart: {
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
// ARE the atmosphere — which is also why its own rules cap them at two per frame, and why
// these sets sit exactly at that cap. Brownstone (primary) draws the instrument; the pale
// stone (accent-3) keeps the second mark quiet against the sandstone canvas every frame
// grounds on. Each decoration takes a reveal cascade slot.
const decorationDefaults: NonNullable<ThemeTokens["decorationDefaults"]> = {
  // A dial off the top-right with a quiet quadrant sweep settling below it.
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
  // A compass rose holding the quiet upper-left, a crescent answering it low-right.
  "closing-plate": [
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
  // The quote card is centred: an oversized quotation sort low-left, a lens high-right.
  quote: [
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
  // No template overrides: standard reaches its whole look in CSS alone. The reference's compass
  // rings are decoration COMPONENTS here, not markup; its Playfair quote mark is a pseudo-element;
  // and its stat has no corner dot, so the shared node is styled away rather than removed (nothing
  // animates it).
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
