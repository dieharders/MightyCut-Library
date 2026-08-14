// Creative theme — the neo-brutalist punk-zine frame system: a ROTATION of full-bleed colour
// planes (cream · orange · green · pink · oat · yellow), one constant ink outline on everything,
// the signature ORANGE+ink hard offset shadow, Archivo Black uppercase at 0.92 line-height, and a
// JetBrains Mono taxonomy carrying every label. Ported from
// video-assets/themes/creative/frame-showcase.html + frame.css + FRAME.md onto the shared
// component system. Everything creative OWNS lives in this folder, imported as text:
//   frame.css        the `.mc-frame` base (frame ground, body wrapper, h3, the inverted ink
//                    KICKER-BLOCK eyebrow) + the four backdrop ink hooks
//   <element>.css    creative's SKIN for each shared primitive/treatment (structure + behavior
//                    are shared; creative styles the standard class names here)
// The `:root` tokens are DERIVED from the 10-role `palette` below (see `tokensCss`), the same
// shape block, future, capsule and professional use. The reference's `--cr-*` / `--ink` /
// `--orange` identity layer does NOT exist here: every colour a skin needs is one of the ten
// roles, and anything lighter/darker/translucent is derived per-use with color-mix().
//
// WHAT MAKES CREATIVE STRUCTURALLY DIFFERENT FROM EVERY OTHER LIVE THEME: it declares NO
// `groundDefault`. Professional pins one cream canvas; future pins one navy. Creative deliberately
// does not — each treatment lands on its OWN shared canonical ground, so a deck reads as the plane
// rotation the source design is built on ("lay the colour planes, swap the ground"). Every skin in
// this folder is therefore authored AGAINST ITS OWN GROUND, and an explicit scene ground still
// wins over all of it.
import { CREATIVE_DECORATION_COMPONENTS } from "../../primitives/creative-decoration-shapes";
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

// Palette — creative's colour for each of the 10 shared palette roles (types/palette.ts). The
// SINGLE source of truth: it drives the showcase Palette section AND generates the `:root` custom
// properties below.
//
// The four ACCENTS are the four saturated planes, in ACCENT_CYCLE order
// (primary→secondary→accent-1→accent-2), so a repeated row of icon badges or stat dots walks
// pink→orange→yellow→green — the reference deck's own rotation, for free. Each is ALSO a
// treatment ground: quote/closing sit on the pink, feature-cards on the orange, comparison on the
// yellow, stat-grid on the green. That double duty is the point; creative has no "accent that is
// only an accent".
//
// Orange carries one extra job no other role has: it is THE HARD-SHADOW COLOUR. The reference's
// signature offset is `1.25cqw 1.25cqw 0 orange` under a `0.2cqw` ink spread, and every skin +
// the decoration engine names `var(--secondary)` for it. That is why orange is `secondary` and
// not an accent-N — the role a skin reaches for most after the ink.

const palette: NonNullable<ThemeTokens["palette"]> = [
  {
    name: "Pink",
    hex: "#F06CA8",
    note: "quote + closing ground",
    varName: "primary",
  },
  {
    name: "Orange",
    hex: "#E85A1F",
    note: "the hard-shadow colour",
    varName: "secondary",
  },
  {
    name: "Yellow",
    hex: "#F5C518",
    note: "ledger ground",
    varName: "accent-1",
  },
  {
    name: "Green",
    hex: "#1F8A4C",
    note: "stat ground + the answer",
    varName: "accent-2",
  },
  { name: "Teal", hex: "#1f818a", note: "depth", varName: "accent-3" },
  {
    name: "Milk",
    hex: "#f4e3b5",
    note: "canvas & light ink",
    varName: "muted-1",
  },
  {
    name: "Oat",
    hex: "#EFE9D9",
    note: "canvas",
    varName: "muted-2",
  },
  {
    name: "Ink",
    hex: "#2f2f2f",
    note: "secondary body text",
    varName: "muted-3",
  },
  {
    name: "Paper",
    hex: "#EFE9D9",
    note: "light type on saturated + ink grounds",
    varName: "light",
  },
  {
    name: "Dark",
    hex: "#2f2f2f",
    note: "borders + all display type",
    varName: "dark",
  },
];

/** Font tokens — the only `:root` entries that aren't colours. All three faces are already in the
 *  CORE chrome set (assets/fonts.css), so creative ships NO add-on sheet and register-creative.ts
 *  injects core alone — unlike capsule (Bodoni) and professional (Baskerville + Plex).
 *
 *  Archivo Black (--disp) carries EVERY display voice: headlines, stat figures, step numerals,
 *  card and agenda titles, ledger heads, the CTA numeral. It ships a SINGLE weight (400), which
 *  is why no skin in this folder declares a font-weight on display type — asking for 700/900
 *  would render a synthetic bold on a face that has none.
 *  Space Grotesk (--body) carries the reading ramp: card bodies, step bodies, ledger cells.
 *  JetBrains Mono (--mono) carries the TAXONOMY: every eyebrow, label, counter and caption
 *  kicker, uppercase and widely tracked. */
const fontTokens: Record<string, string> = {
  disp: '"Archivo Black", sans-serif',
  body: '"Space Grotesk", sans-serif',
  mono: '"JetBrains Mono", monospace',
};

const sizeTokens: Record<string, string> = {
  "font-size-xs": "1.375rem",
  "font-size-sm": "1.75rem",
  "font-size-md": "2rem",
  "font-size-lg": "2.625rem",
  "font-size-xl": "3.375rem",
  "font-size-2xl": "4.375rem",
  "font-size-3xl": "5rem",
  "font-size-4xl": "7.5rem",
  "font-size-max": "12rem",
};

/** :root, DERIVED from `palette` + `fontTokens` + `sizeTokens` — every hex and every size written
 *  down exactly once (matching block, future, capsule and professional). */
const tokensCss = `:root {\n${[
  ...palette.map((p) => `  --${p.varName}: ${p.hex.toLowerCase()};`),
  ...Object.entries(fontTokens).map(
    ([name, value]) => `  --${name}: ${value};`,
  ),
  ...Object.entries(sizeTokens).map(
    ([name, value]) => `  --${name}: ${value};`,
  ),
].join("\n")}\n}\n`;

// Typography — the type roles (frame-showcase.html TYPOGRAPHY section, and FRAME.md's ramp).
// `style` is the self-contained inline CSS the showcase renders each live sample with (px is fine
// here — a sample is not a skin). Every display role is the SAME face at the same case and the
// same leading ratio; only the size changes. That single-voice discipline is the theme.
const displayBase =
  "font-family: var(--disp); text-transform: uppercase; color: var(--dark);";
const typography: ThemeTokens["typography"] = [
  {
    token: "display-hero",
    spec: "Archivo Black · uppercase · line 0.86 · −0.02em — the cover word and nothing else",
    sample: "Loud.",
    style: `${displayBase} line-height: 0.86; letter-spacing: -0.02em; font-size: 128px;`,
  },
  {
    token: "display-md",
    spec: "Archivo Black · uppercase · line 0.92 · −0.01em — section headlines on every content frame",
    sample: "Make It Move",
    style: `${displayBase} line-height: 0.92; letter-spacing: -0.01em; font-size: 76px;`,
  },
  {
    token: "stat-num",
    spec: "Archivo Black · line 0.88 — the figure on a stat plate, a step numeral, a bar value",
    sample: "240%",
    style: `${displayBase} line-height: 0.88; font-size: 88px;`,
  },
  {
    token: "body-lg",
    spec: "Space Grotesk 400 · line 1.4 · left-aligned — the reading ramp; it explains while the display declares",
    sample:
      "Body copy sits in Space Grotesk — left-aligned, never centred. It explains while the display type declares.",
    style:
      "font-family: var(--body); font-weight: 400; font-size: 24px; line-height: 1.4; max-width: 760px; color: var(--muted-3);",
  },
  {
    token: "mono-kicker",
    spec: "JetBrains Mono · uppercase · 0.14em · cream on an ink plate — the inverted kicker-block that opens a frame",
    sample: "Fig. 02 — Type Specimen",
    style:
      "display: inline-block; background: var(--dark); color: var(--muted-1); padding: 8px 18px; font-family: var(--mono); text-transform: uppercase; letter-spacing: 0.14em; font-size: 22px;",
  },
];

// Frame Rules — Do / Don't bullets (frame-showcase.html PRINCIPLES section), restated against
// what the PORTED CSS actually does. The reference's "reserve the green ground for the closing
// plate" is gone on purpose: under the shared contract the ground comes from the treatment (see
// the note on `groundDefault` at the top of this file), so green belongs to the stat grid and a
// deck that wants a green closer sets that scene's ground explicitly.
const rules: ThemeTokens["rules"] = {
  do: [
    "Lay the colour planes: every treatment lands on its own full-bleed ground — cream, orange, green, pink, oat, yellow — and the deck reads as that rotation.",
    "One constant ink outline: 0.5rem on structural blocks, 0.375rem on inner rules and chrome. Square corners, always.",
    "Spend the signature orange-and-ink hard offset on ONE featured block per frame; repeated cards and cells take the quiet ink-only offset.",
    "Archivo Black uppercase at 0.86–0.92 line-height for every display voice; JetBrains Mono, uppercase and widely tracked, for every label, eyebrow and counter.",
    "Open a frame with the inverted ink kicker-block — a label is a plate or it is nothing.",
    "Cream is the light ink: cream type on the orange and green planes, ink type on cream, oat, yellow and pink.",
  ],
  dont: [
    "No rounded corners — 0 radius on every structural element; 50% is reserved for the stat's corner dot and the decorative discs.",
    "No gradients, no blurred shadows, no glow.",
    "No sentence-case Archivo Black, and never a declared bold weight — the face ships exactly one.",
    "No fifth accent in the cycle — the violet is off-cycle depth, reached only by name, never auto-assigned. And no pure-white ground.",
    "Don't blow a headline edge-to-edge — size it to the line.",
  ],
};

// Showcase sample copy — creative's OWN examples (a loud, editorial, zine voice), so its treatment
// cards read as Creative. Each entry's `params` seed the treatment's slots; `children` seed the
// child rows. SHOWCASE-ONLY — real decks use spec content. The key structure mirrors the other
// live themes so the showcase-parity tripwire passes (see registry.test.ts).
const examples: NonNullable<ThemeTokens["examples"]> = {
  cover: {
    params: {
      headline: "Loud, bordered, creative.",
      subtitle: "A neo-brutalist editorial theme.",
    },
  },
  statement: {
    params: {
      text: "Atoms are sacred. Composition is free.",
      attribution: "The Frame Manifesto",
      eyebrow: "The Manifesto",
    },
  },
  "outro": {
    params: { headline: "That's the end!", cta: "Book a Call" },
  },
  "feature-cards": {
    params: { headline: "What You Get" },
    children: [
      {
        title: "Block",
        body: "Lay the colour planes flat — one ground per frame, no half measures.",
        icon: "I",
        accent: "primary",
      },
      {
        title: "Stamp",
        body: "Drop the one hard shadow. Orange under ink, never blurred.",
        icon: "II",
        accent: "secondary",
      },
      {
        title: "Cut",
        body: "Swap the ground and end the beat. The rotation carries the deck.",
        icon: "III",
        accent: "accent-1",
      },
    ],
  },
  "stats": {
    params: { headline: "The Numbers Don't Whisper" },
    children: [
      { value: 240, label: "Output Lift", unitSuffix: "%", accent: "primary" },
      {
        value: 3.4,
        label: "Faster Cuts",
        unitSuffix: "x",
        decimals: 1,
        accent: "secondary",
      },
      { value: 98, label: "Templates", unitSuffix: "", accent: "accent-1" },
    ],
  },
  timeline: {
    params: { headline: "Four Steps" },
    children: [
      { num: "01", title: "Block", body: "Lay the colour planes." },
      { num: "02", title: "Set", body: "Lock the display caps." },
      { num: "03", title: "Stamp", body: "Drop the hard shadow." },
      { num: "04", title: "Cut", body: "Swap the ground." },
    ],
  },
  matrix: {
    params: {
      headline: "Pick Your Poison",
      criteria: ["Loud", "Fast", "Yours"],
      caption: "Three ways to make a thing; only one of them sings",
    },
    children: [
      { label: "Off The Shelf", sublabel: "Someone else's taste", cells: ["no", "yes", "no"] },
      { label: "Agency Route", sublabel: "Good work, long wait", cells: ["yes", "no", "no"] },
      { label: "Creative Mode", sublabel: "Ink, offset, full saturation", cells: ["yes", "yes", "yes"], highlight: true },
    ],
  },
  "pill-wall": {
    params: {
      headline: "The Whole Kit",
      caption: "Everything in the box, nothing to bolt on",
    },
    children: [
      { text: "Type" },
      { text: "Colour" },
      { text: "Grid" },
      { text: "Motion" },
      { text: "Print" },
      { text: "Web" },
      { text: "Signage" },
      { text: "Merch" },
    ],
  },
  team: {
    params: {
      headline: "The Crew",
      caption: "Three people, one studio, no handoffs",
    },
    children: [
      { name: "Rue Marchetti", role: "Art Director", org: "Riso Room", accent: "primary" },
      { name: "Kit Vance", role: "Type & Layout", org: "Riso Room", accent: "secondary" },
      { name: "Nils Brandt", role: "Print Lead", org: "Bindery", accent: "accent-1" },
    ],
  },
  "trend-line": {
    params: {
      headline: "The Line Goes Up",
      caption: "Print runs sold, by quarter",
    },
    children: [
      {
        labels: ["Q1","Q2","Q3","Q4"],
        values: [120,260,340,520],
        max: 520,
        unitSuffix: "",
      },
    ],
  },
  "cluster": {
    params: {
      headline: "One Press, Many Hands",
      hub: "The Studio",
      caption: "Every service under one roof",
    },
    children: [
      { label: "Riso", detail: "two colour", index: 0, total: 5, accent: "primary" },
      { label: "Letterpress", detail: "short runs", index: 1, total: 5, accent: "secondary" },
      { label: "Binding", detail: "by hand", index: 2, total: 5, accent: "accent-1" },
      { label: "Foil", detail: "hot stamp", index: 3, total: 5, accent: "accent-2" },
      { label: "Deliver", detail: "next day", index: 4, total: 5, accent: "primary" },
    ],
  },
  comparison: {
    params: {
      headline: "Frame vs Slide",
      columns: ["Status Quo", "Creative Mode"],
    },
    children: [
      { label: "Border", a: "Thin gray", b: "Constant ink" },
      { label: "Shadow", a: "Soft blur", b: "Hard offset" },
      { label: "Accents", a: "Muted", b: "Full saturation" },
    ],
  },
  "bar-chart": {
    params: { headline: "By Quarter", caption: "Measured across the program." },
    children: [
      { value: 42, label: "Q1", max: 96, unitSuffix: "" },
      { value: 68, label: "Q2", max: 96, unitSuffix: "" },
      { value: 79, label: "Q3", max: 96, unitSuffix: "" },
      { value: 96, label: "Q4", max: 96, unitSuffix: "", leader: true },
    ],
  },
  "bar-ranking": {
    params: { headline: "What Moves It", caption: "Ranked by contribution." },
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
    params: { headline: "Four Considerations" },
    children: [
      { num: "01", title: "Lay the Planes", detail: "One ground per frame" },
      {
        num: "02",
        title: "Set the Caps",
        detail: "Archivo, uppercase, always",
      },
      { num: "03", title: "Drop the Shadow", detail: "One block per frame" },
      { num: "04", title: "Cut the Ground", detail: "Swap it and end" },
    ],
  },
};

// Creative's hero-frame decorations — zine furniture: printer's stamps, a hand-cut bolt, a
// torn zigzag, all knocked a few degrees off square. Creative rotates the GROUND per
// treatment (see the header note), so each set is picked against the ground that frame
// actually paints: cream for the cover, pink for quote/closing. Yellow (accent-1) does most
// of the drawing — it is the one accent that holds on both of those grounds. Two per frame:
// each takes a reveal cascade slot.
// `list` currently shares feature-cards' skin, so it shares its showcase example too —
// aliased rather than copied, so the two cannot drift into different copy while rendering
// identically. When the list-number rendering lands this becomes an entry of its own.
examples["list"] = examples["feature-cards"]!;

const decorationDefaults: NonNullable<ThemeTokens["decorationDefaults"]> = {
  // On the cream ground: a small yellow seal top-right, and an oversized pink medallion
  // bleeding off the lower-right corner — the frame's one large shape, cropped by the edge
  // rather than floating, which is how the reference crops its discs.
  cover: [
    {
      name: "stamp",
      params: {
        variant: "seal",
        x: 85,
        y: 21,
        size: 16,
        rotate: -8,
        accent: "accent-1",
        layer: "back",
      },
    },
    {
      name: "stamp",
      params: {
        variant: "medallion",
        x: 95,
        y: 96,
        size: 43,
        rotate: -6,
        accent: "primary",
        layer: "back",
      },
    },
  ],
  // On the pink ground: two yellow marker cuts on the diagonal, a caret low-left and a bolt
  // high-right, both in FRONT so they read as marks made ON the frame rather than under it.
  "outro": [
    {
      name: "marker",
      params: {
        variant: "caret",
        x: 15,
        y: 77,
        size: 18,
        rotate: -5,
        accent: "accent-1",
        layer: "front",
      },
    },
    {
      name: "marker",
      params: {
        variant: "bolt",
        x: 84,
        y: 17,
        size: 15,
        rotate: -12,
        accent: "accent-1",
        layer: "front",
      },
    },
  ],
  // The quote card is centred: a wide yellow zigzag along the bottom-left, a yellow rosette
  // tilted high-right. The zigzag is the theme's one UNROTATED default — it carries its own
  // jaggedness, and a tilt on top of that just reads as a mistake.
  statement: [
    {
      name: "zag",
      params: {
        variant: "zigzag",
        x: 20,
        y: 88,
        size: 24,
        rotate: 0,
        accent: "accent-1",
        layer: "back",
      },
    },
    {
      name: "stamp",
      params: {
        variant: "rosette",
        x: 88,
        y: 22,
        size: 14,
        rotate: 10,
        accent: "accent-1",
        layer: "back",
      },
    },
  ],
};

export const creativeTheme: ThemeTokens = {
  name: "creative",
  title: "Creative",
  description:
    "A neo-brutalist punk-zine editorial theme. A rotation of full-bleed color planes, one constant ink outline on every block, a signature orange hard-offset shadow. Frame unit: 1920×1080, 16:9.",
  css: tokensCss,
  frameCss,
  // NO `groundDefault` — deliberately, and this note is the only record of it: an absent field
  // reads as an oversight otherwise. See the header note: the per-treatment ground rotation IS
  // creative's identity, so each treatment keeps its shared canonical ground and each skin is authored against it.
  //
  // Creative's DEFAULT backdrop: the shared `grid` design.
  backdrop: "grid",
  // Showcase/editor preview surface — the oat (--muted-2), NOT the milk the plates fill.
  //
  // It MUST be the role the plates do not use. Creative's plates fill muted-1, so deriving this
  // from muted-1 would make every component in the Components grid exactly the colour of the panel
  // behind it — the cards would look like they had lost their background, visible only by their ink
  // borders. That has shipped before. The oat also reproduces the real deck (a plate on a recessed
  // ground, which is precisely what the timeline and agenda frames show).
  previewBg: palette.find((p) => p.varName === "muted-2")!.hex.toLowerCase(),
  // …and creative is a LIGHT theme, stated outright (not inferred from previewBg).
  previewScheme: "light",
  // Creative's skins for every shared element it renders. The element trios carry no css; these
  // are the creative look.
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
  // No template overrides: creative reaches its whole look in CSS alone. The reference's
  // decorative corner disc and rotated stamp are decoration COMPONENTS here, not markup, and the
  // cover's redundant counter node does not exist in the shared template at all.
  palette,
  typography,
  rules,
  examples,
  // Creative's OWN decoration families (stamp · marker · zag · cutout) — accent-filled solids
  // wearing the constant ink outline and casting the signature ORANGE hard offset, which is what
  // separates them from block's ink-shadowed neobrutalist set. Themes don't share decorations:
  // this roster lists only creative's, and every one is held out of the Components grid globally.
  // Opt-in per scene via addDecorations().
  decorations: [...CREATIVE_DECORATION_COMPONENTS],
  // …and how the hero frames wear them by default — see `decorationDefaults` above.
  decorationDefaults,
};
