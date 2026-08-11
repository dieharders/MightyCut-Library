// Professional theme — the consulting-grade frame system: a warm cream canvas, a SINGLE saturated
// cobalt carrying every accent, near-black Libre Baskerville headlines, muted-gray IBM Plex Sans
// body, soft cobalt-TINTED cards, and NO drop shadows. Ported from video-assets/themes/professional/
// frame-showcase.html + frame.css onto the shared component system. Everything professional OWNS
// lives in this folder, imported as text:
//   frame.css        the `.mc-frame` base (frame ground, body wrapper, h3, the cobalt eyebrow pill)
//   <element>.css    professional's SKIN for each shared primitive/treatment (structure + behavior
//                    are shared; professional styles the standard class names here)
// The `:root` tokens are DERIVED from the 10-role `palette` below (see `tokensCss`), the same shape
// block, future and capsule use. The showcase's `--pf-*` identity layer does NOT exist here: the
// "single accent" is the PALETTE (all five accent roles are the one cobalt), and every tint/border
// shade a skin needs is derived per-use with color-mix() from the ten roles. Professional is the
// first theme whose content faces are ENTIRELY its own — Libre Baskerville (--disp) and IBM Plex
// Sans (--body/--mono), NEITHER of which is in the core chrome set — so it ships an add-on sheet
// (assets/fonts/professional-fonts.css) and register-professional.ts injects only that, not core.
import { PROFESSIONAL_DECORATION_COMPONENTS } from "../../primitives/professional-decoration-shapes";
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
import chartCss from "./chart.css" with { type: "text" };
import closingPlateCss from "./closing-plate.css" with { type: "text" };
import comparisonCss from "./comparison.css" with { type: "text" };
import coverCss from "./cover.css" with { type: "text" };
import featureCardsCss from "./feature-cards.css" with { type: "text" };
import matrixCss from "./matrix.css" with { type: "text" };
import pillWallCss from "./pill-wall.css" with { type: "text" };
import teamCss from "./team.css" with { type: "text" };
import lineChartCss from "./line-chart.css" with { type: "text" };
import nodeClusterCss from "./node-cluster.css" with { type: "text" };
import quoteCss from "./quote.css" with { type: "text" };
import statGridCss from "./stat-grid.css" with { type: "text" };
import timelineCss from "./timeline.css" with { type: "text" };

// Palette — professional's colour for each of the 10 shared palette roles (types/palette.ts). The
// SINGLE source of truth: it drives the showcase Palette section AND generates the `:root` custom
// properties below. The five accent roles are ALL the one cobalt — that IS the "single accent that
// carries every emphasis", stated in the palette so the accent cycle (icon badges, stat figures,
// bar fills) resolves to cobalt everywhere WITHOUT a per-skin !important. The two ground roles are
// cream (canvas); muted-3 is the body gray. The UI de-dupes on hex to professional's 5 colours.
const palette: NonNullable<ThemeTokens["palette"]> = [
  { name: "Cobalt", hex: "#323fea", note: "the accent", varName: "primary" },
  { name: "Cobalt", hex: "#323fea", varName: "secondary" },
  { name: "Cobalt", hex: "#323fea", varName: "accent-1" },
  // Ice — a soft cool periwinkle surface. It sits on accent-2, the LAST slot of the ACCENT_CYCLE
  // (primary→secondary→accent-1→accent-2), which 3-item rows never reach — so auto-cycled card
  // icons / stat figures stay cobalt, and ice only appears where a scene asks for it (a quiet
  // panel or an alternate slide ground). A light surface, not an icon-fill accent.
  {
    name: "Ice",
    hex: "#C9CAEA",
    note: "soft cool surface",
    varName: "accent-2",
  },
  // Ember — the one saturated non-cobalt hue: a true warm COMPLEMENT to the cobalt (opposite side
  // of the wheel), reserved for the LEADING value (chart/rank leader) and any deliberate "positive".
  // It also picks up the cream canvas's warmth, so the winning bar reads as a deliberate pairing
  // rather than a second brand colour. accent-3 is OUTSIDE the accent cycle, so the orange only
  // appears where a skin/scene asks for it.
  {
    name: "Ember",
    hex: "#fa752d",
    note: "leader / positive",
    varName: "accent-3",
  },
  { name: "Cream", hex: "#FDFAE7", note: "canvas", varName: "muted-1" },
  // Tint — a warm neutral-gray surface (alternate slide ground / panel fill). muted-1 stays the
  // cream canvas; nothing in the skins pins muted-2, so this is a free surface a scene can pick.
  { name: "Tint", hex: "#EBEAE7", note: "warm surface", varName: "muted-2" },
  { name: "Slate", hex: "#6B6B6B", note: "body text", varName: "muted-3" },
  { name: "White", hex: "#FFFFFF", note: "cards", varName: "light" },
  { name: "Ink", hex: "#111111", note: "text + headlines", varName: "dark" },
];

/** Font tokens — the only `:root` entries that aren't colours. Libre Baskerville (--disp) carries
 *  the SERIF prose voice: headlines, section/card/step/agenda titles and the pull-quote statement.
 *  IBM Plex Sans carries everything structural — paragraphs & supporting copy (--body) and the
 *  labels / eyebrows / numerals / values / chrome (--mono). Both are professional's OWN add-on
 *  faces (assets/fonts/professional-fonts.css, injected by engine/register-professional); NEITHER
 *  is in the core chrome set, so professional loads only these two. */
const fontTokens: Record<string, string> = {
  disp: '"Libre Baskerville", serif',
  body: '"IBM Plex Sans", sans-serif',
  mono: '"IBM Plex Sans", sans-serif',
};

/** Type-SIZE tokens — professional's own type scale. This is to `font-size` what `palette` is to
 *  colour: a skin NAMES a step, it never writes a number. The steps are PROFESSIONAL's — every
 *  theme derives its own from its own ramp, and only the SHAPE (the step vocabulary, ascending,
 *  on the 0.125rem grid, no adjacent pair closer than 1.10x) is shared. Professional's is the most
 *  compressed of the six: its `max` is 7rem where creative's is 12rem, because a consulting deck
 *  states things rather than shouts them.
 *
 *  The top of the ramp is ANCHORED, not chosen: `3xl` IS the content-frame h3 (the seven-treatment
 *  normalisation 8fb19d7 landed, which the pull quote already sat on), `4xl` IS the stat figure,
 *  and `max` IS the cover and closing plate. */
const sizeTokens: Record<string, string> = {
  "font-size-xs": "1.25rem",
  "font-size-sm": "1.5rem",
  "font-size-md": "1.75rem",
  "font-size-lg": "2rem",
  "font-size-xl": "2.375rem",
  "font-size-2xl": "3.25rem",
  "font-size-3xl": "4rem",
  "font-size-4xl": "5rem",
  "font-size-max": "7rem",
};

/** :root, DERIVED from `palette` + `fontTokens` + `sizeTokens` — every hex and every size written
 *  down exactly once (matching block, future and capsule). */
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
// self-contained inline CSS the showcase renders each live sample with (px is fine here — a sample
// is not a skin). Cobalt is the ONE accent, so it meets type on the metric figure, the eyebrow and
// the CTA; headlines stay near-black.
const typography: ThemeTokens["typography"] = [
  {
    token: "display",
    spec: "Libre Baskerville 700 · serif · near-black — hero titles & the biggest line on a frame",
    sample: "Measured.",
    style:
      "font-family: var(--disp); font-weight: 700; letter-spacing: 0; line-height: 1.16; font-size: 76px; color: var(--dark);",
  },
  {
    token: "eyebrow",
    spec: "IBM Plex Sans 600 · uppercase · 0.08em · cobalt — section kickers over a heading",
    sample: "Executive Summary",
    style:
      "display: inline-block; border-radius: 9999px; background: color-mix(in srgb, var(--primary) 6%, transparent); padding: 8px 20px; font-family: var(--mono); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; font-size: 15px; color: var(--primary);",
  },
  {
    token: "metric-value",
    spec: "IBM Plex Sans 600 · tabular · cobalt — the ONE place colour meets type: stats, counts, prices",
    sample: "$24.3M",
    style:
      "font-family: var(--mono); font-variant-numeric: tabular-nums; font-weight: 600; line-height: 1; letter-spacing: -0.02em; font-size: 64px; color: var(--primary);",
  },
  {
    token: "body",
    spec: "IBM Plex Sans 400 · line 1.6 · muted gray — paragraphs & supporting copy, never competing",
    sample:
      "IBM Plex Sans carries every paragraph in muted gray — readable, premium, never competing with the cobalt accent or the serif headline.",
    style:
      "font-family: var(--body); font-weight: 400; font-size: 17px; line-height: 1.6; max-width: 660px; color: var(--muted-3);",
  },
  {
    token: "cta",
    spec: "IBM Plex Sans 600 · solid cobalt pill · cream label — the one saturated call to action",
    sample: "Book a Briefing",
    style:
      "display: inline-block; border-radius: 9999px; background: var(--primary); padding: 12px 30px; font-family: var(--mono); font-weight: 600; letter-spacing: 0.02em; font-size: 17px; color: var(--light);",
  },
];

// Frame Rules — Do / Don't bullets (frame-showcase.html PRINCIPLES section), restated against what
// the ported CSS actually does (rem tints derived from the one cobalt, no shadows anywhere).
const rules: ThemeTokens["rules"] = {
  do: [
    "Start every frame on warm cream; a single cobalt carries every accent.",
    "Set headlines near-black at neutral tracking (a text serif cramps under negative); eyebrows cobalt, uppercase, 0.08em.",
    "Render every numeral in cobalt IBM Plex Sans 600, tabular.",
    "Lift content with soft cobalt-TINTED cards — 5% fill, 22% hairline border, gently rounded.",
    "Body in IBM Plex Sans 400, muted gray, line 1.6; the one saturated CTA is a solid cobalt pill.",
    "The ember orange is the ONE complement — reserved for the leading/positive value (chart & rank leader); never a decorative accent.",
  ],
  dont: [
    "No decorative second accent; cobalt carries emphasis and the ember orange is leader/positive-only. No cobalt headlines.",
    "No drop shadows anywhere.",
    "No square corners; no opaque cobalt borders.",
    "No font substitutes; no uppercase body.",
    "Don't fill space with heavier borders — add substance, not noise.",
  ],
};

// Showcase sample copy — professional's OWN examples (a measured, consulting voice), so its
// treatment cards read as Professional. Each entry's `params` seed the treatment's slots;
// `children` seed the child rows. SHOWCASE-ONLY — real decks use spec content. Key structure mirrors
// the other live themes so the showcase-parity tripwire passes (see registry.test.ts).
const examples: NonNullable<ThemeTokens["examples"]> = {
  cover: {
    params: {
      headline: "Strong, committed, consultation.",
      subtitle:
        "A consulting-grade theme — one saturated cobalt, soft tinted cards that never shout.",
    },
  },
  quote: {
    params: {
      text: "Quiet is the most expensive thing on the page.",
      attribution: "Managing Partner",
      eyebrow: "In Their Words",
    },
  },
  "closing-plate": {
    params: { headline: "Let's talk.", cta: "Book a Briefing" },
  },
  "feature-cards": {
    params: { headline: "What you get" },
    children: [
      {
        title: "Single Accent",
        body: "One cobalt carries every emphasis across the deck.",
        icon: "I",
        accent: "primary",
      },
      {
        title: "Soft Tints",
        body: "Cards lift on a faint cobalt fill — no borders that shout, no shadows.",
        icon: "II",
        accent: "secondary",
      },
      {
        title: "Quiet Density",
        body: "Substance over noise: measured type, generous margins.",
        icon: "III",
        accent: "accent-1",
      },
    ],
  },
  "stat-grid": {
    params: { headline: "Q3 at a glance" },
    children: [
      {
        value: 24.3,
        label: "Annual revenue",
        unitSuffix: "M",
        decimals: 1,
        accent: "primary",
      },
      {
        value: 94,
        label: "Net retention",
        unitSuffix: "%",
        accent: "secondary",
      },
      { value: 18, label: "Growth YoY", unitSuffix: "%", accent: "accent-1" },
    ],
  },
  timeline: {
    params: { headline: "Four steps" },
    children: [
      { num: "01", title: "Survey", body: "Establish the baseline." },
      { num: "02", title: "Tint", body: "Lift cards with a soft cobalt fill." },
      { num: "03", title: "Accent", body: "One cobalt carries the emphasis." },
      { num: "04", title: "Deliver", body: "An executive-ready briefing." },
    ],
  },
  matrix: {
    params: {
      headline: "Options against the criteria",
      criteria: ["Speed", "Assurance", "Cost"],
      caption: "Assessed against the evaluation criteria agreed at kickoff",
    },
    children: [
      { label: "Do nothing", sublabel: "Retain the current process", cells: ["no", "yes", "yes"] },
      { label: "Incumbent vendor", sublabel: "Extend the existing contract", cells: ["yes", "no", "no"] },
      { label: "Our approach", sublabel: "The recommended option", cells: ["yes", "yes", "yes"], highlight: true },
    ],
  },
  "pill-wall": {
    params: {
      headline: "Coverage across the estate",
      caption: "Systems in scope for the initial phase",
    },
    children: [
      { text: "ERP" },
      { text: "CRM" },
      { text: "Payroll" },
      { text: "Treasury" },
      { text: "Procurement" },
      { text: "Data Lake" },
      { text: "Identity" },
      { text: "Reporting" },
    ],
  },
  team: {
    params: {
      headline: "Engagement team",
      caption: "Named leads for the duration of the engagement",
    },
    children: [
      { name: "Helen Marsh", role: "Engagement Partner", org: "Advisory", accent: "primary" },
      { name: "Daniel Osei", role: "Delivery Lead", org: "Transformation", accent: "secondary" },
      { name: "Priya Raman", role: "Data Lead", org: "Analytics", accent: "accent-1" },
    ],
  },
  "line-chart": {
    params: {
      headline: "Cost per transaction",
      caption: "Trailing twelve months, indexed",
    },
    children: [
      {
        labels: ["Q1","Q2","Q3","Q4"],
        values: [100,86,71,58],
        max: 100,
        unitSuffix: "",
      },
    ],
  },
  "node-cluster": {
    params: {
      headline: "A single operating core",
      hub: "Core platform",
      caption: "Systems in scope for phase one",
    },
    children: [
      { label: "ERP", detail: "finance", index: 0, total: 5, accent: "primary" },
      { label: "CRM", detail: "pipeline", index: 1, total: 5, accent: "secondary" },
      { label: "Payroll", detail: "HR", index: 2, total: 5, accent: "accent-1" },
      { label: "Treasury", detail: "cash", index: 3, total: 5, accent: "accent-2" },
      { label: "Reporting", detail: "board", index: 4, total: 5, accent: "primary" },
    ],
  },
  comparison: {
    params: {
      headline: "What moves the number",
      columns: ["Status Quo", "Our Approach"],
    },
    children: [
      { label: "Speed", a: "Weeks", b: "Days" },
      { label: "Cost", a: "Opaque", b: "Fixed" },
      { label: "Risk", a: "Carried", b: "Managed" },
    ],
  },
  chart: {
    params: { headline: "By quarter", caption: "Measured across the program." },
    children: [
      { value: 42, label: "Q1", max: 96, unitSuffix: "M" },
      { value: 68, label: "Q2", max: 96, unitSuffix: "M" },
      { value: 79, label: "Q3", max: 96, unitSuffix: "M" },
      { value: 96, label: "Q4", max: 96, unitSuffix: "M", leader: true },
    ],
  },
  "bar-ranking": {
    params: {
      headline: "What moves the number",
      caption: "Ranked by contribution.",
    },
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
      { num: "03", title: "On the Line", detail: "One rule, repeated" },
      { num: "04", title: "On Silence", detail: "Negative space" },
    ],
  },
};

// Professional's hero-frame decorations — drafting marks, not ornament: hairlines and dot
// fields, never rotated (this theme owes its authority to the square). ONE per frame, the
// sparsest set of the six: cobalt is spent on type and chrome here, so the decoration draws
// in Ice (accent-2) — a tint barely off the cream ground, present as a watermark rather than
// as an accent. Each takes a reveal cascade slot.
const decorationDefaults: NonNullable<ThemeTokens["decorationDefaults"]> = {
  // One dot matrix on the right margin at the vertical centre, clear of the left-set
  // headline — the frame's only mark.
  cover: [
    {
      name: "grille",
      params: {
        variant: "matrix",
        x: 83,
        y: 50,
        size: 20,
        accent: "accent-2",
        layer: "back",
      },
    },
  ],
  // One large centred elbow behind the sign-off card — corner ticks scaled up until they
  // bracket the whole frame rather than a region of it.
  "closing-plate": [
    {
      name: "corner",
      params: {
        variant: "elbow",
        x: 50,
        y: 50,
        size: 59,
        accent: "accent-2",
        layer: "back",
      },
    },
  ],
  // The concentric rings the showcase floats behind a pull quote — the `halo` variant draws
  // the pair, centred behind the statement. This replaces the ::before/::after circles the
  // quote skin used to bake in, so a scene can now move, resize or delete them (quote.css).
  quote: [
    {
      name: "ring",
      params: {
        variant: "halo",
        x: 50,
        y: 50,
        size: 34,
        accent: "accent-2",
        layer: "back",
      },
    },
  ],
};

export const professionalTheme: ThemeTokens = {
  name: "professional",
  title: "Professional",
  description:
    "A consulting-grade theme on a warm canvas. A single saturated cobalt carries every accent. Soft tinted cards that never shout; no drop shadows. Frame unit: 1920×1080, 16:9.",
  css: tokensCss,
  frameCss,
  // Every professional frame lands on the cream canvas: groundDefault REPLACES the shared
  // per-treatment grounds (which are block-flavoured) without pinning them, so a scene that
  // explicitly picks a ground still gets it — the thing a `background: … !important` makes
  // impossible. Emphasis comes from the tinted cards + the single cobalt accent, not coloured
  // grounds.
  groundDefault: "muted-1",
  // Professional's DEFAULT backdrop: the shared `hatch` design — the angled vanishing stripes,
  // re-tinted cobalt through --hatch-ink in frame.css, with the soothing hue-drift. A default,
  // not ownership: a scene may pick any other design, and any theme may set this one.
  backdrop: "hatch",
  // Showcase/editor preview surface — the warm cream canvas professional's components are designed
  // against, so the tinted cards and cobalt read. Taken off the palette (--muted-1) rather than
  // repeated as a literal.
  previewBg: palette.find((p) => p.varName === "muted-1")!.hex.toLowerCase(),
  // …and professional is a LIGHT theme, stated outright (not inferred from previewBg).
  previewScheme: "light",
  // Professional's skins for every shared element it renders. The element trios carry no css; these
  // are the professional look.
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
  // No template overrides: professional reaches its whole look in CSS alone (the cover panel/dots
  // and the quote rings are decoration components, not markup; the quote mark is a pseudo-element).
  palette,
  typography,
  rules,
  examples,
  // Professional's OWN restrained decoration families (ring · keyline · corner · grille) — coherent
  // single-cobalt geometric line-art (concentric circles, concentric squares, framing corner marks,
  // dot fields), no shadow. Themes don't share decorations: this roster lists only professional's,
  // and every one is held out of the Components grid globally. Opt-in per scene via addDecorations().
  decorations: [...PROFESSIONAL_DECORATION_COMPONENTS],
  // …and how the hero frames wear them by default — see `decorationDefaults` above.
  decorationDefaults,
};
