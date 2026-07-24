// Professional theme — the consulting-grade frame system: a warm cream canvas, a SINGLE saturated
// cobalt carrying every accent, near-black Space Grotesk headlines, muted-gray Inter body, soft
// cobalt-TINTED cards, and NO drop shadows. Ported from video-assets/themes/professional/
// frame-showcase.html + frame.css onto the shared component system. Everything professional OWNS
// lives in this folder, imported as text:
//   frame.css        the `.block-frame` base (frame ground, body wrapper, h3, the cobalt eyebrow pill)
//   <element>.css    professional's SKIN for each shared primitive/treatment (structure + behavior
//                    are shared; professional styles the standard class names here)
// The `:root` tokens are DERIVED from the 10-role `palette` below (see `tokensCss`), the same shape
// block, future and capsule use. The showcase's `--pf-*` identity layer does NOT exist here: the
// "single accent" is the PALETTE (all five accent roles are the one cobalt), and every tint/border
// shade a skin needs is derived per-use with color-mix() from the ten roles. Space Grotesk (--disp)
// and Inter (--body) both ride along in the always-staged core chrome set, so professional ships no
// add-on font (like block).
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

// Palette — professional's colour for each of the 10 shared palette roles (types/palette.ts). The
// SINGLE source of truth: it drives the showcase Palette section AND generates the `:root` custom
// properties below. The five accent roles are ALL the one cobalt — that IS the "single accent that
// carries every emphasis", stated in the palette so the accent cycle (icon badges, stat figures,
// bar fills) resolves to cobalt everywhere WITHOUT a per-skin !important. The two ground roles are
// cream (canvas); muted-3 is the body gray. The UI de-dupes on hex to professional's 5 colours.
const palette: NonNullable<ThemeTokens["palette"]> = [
  { name: "Cobalt", hex: "#1E2BFA", note: "the single accent", varName: "primary" },
  { name: "Cobalt", hex: "#1E2BFA", varName: "secondary" },
  { name: "Cobalt", hex: "#1E2BFA", varName: "accent-1" },
  { name: "Cobalt", hex: "#1E2BFA", varName: "accent-2" },
  { name: "Cobalt", hex: "#1E2BFA", varName: "accent-3" },
  { name: "Cream", hex: "#FDFAE7", note: "canvas", varName: "muted-1" },
  { name: "Cream", hex: "#FDFAE7", note: "canvas", varName: "muted-2" },
  { name: "Slate", hex: "#6B6B6B", note: "body text", varName: "muted-3" },
  { name: "White", hex: "#FFFFFF", note: "cards", varName: "light" },
  { name: "Ink", hex: "#111111", note: "text + headlines", varName: "dark" },
];

/** Font tokens — the only `:root` entries that aren't colours. Space Grotesk carries the display,
 *  headlines, numerals and labels; Inter carries the body. `mono` aliases the display face so a
 *  stray var(--mono) inherited from a shared idiom still lands on Space Grotesk. Both faces are in
 *  the always-staged core set, so professional needs no add-on woff2. */
const fontTokens: Record<string, string> = {
  disp: '"Space Grotesk", sans-serif',
  body: '"Inter", sans-serif',
  mono: '"Space Grotesk", sans-serif',
};

/** :root, DERIVED from `palette` + `fontTokens` — every hex written down exactly once (matching
 *  block, future and capsule). */
const tokensCss = `:root {\n${[
  ...palette.map((p) => `  --${p.varName}: ${p.hex.toLowerCase()};`),
  ...Object.entries(fontTokens).map(([name, value]) => `  --${name}: ${value};`),
].join("\n")}\n}\n`;

// Typography — the type roles (frame-showcase.html TYPOGRAPHY section). `style` is the
// self-contained inline CSS the showcase renders each live sample with (px is fine here — a sample
// is not a skin). Cobalt is the ONE accent, so it meets type on the metric figure, the eyebrow and
// the CTA; headlines stay near-black.
const typography: ThemeTokens["typography"] = [
  {
    token: "display",
    spec: "Space Grotesk 700 · −0.02em · near-black — hero titles & the biggest line on a frame",
    sample: "Measured.",
    style:
      "font-family: var(--disp); font-weight: 700; letter-spacing: -0.02em; line-height: 1.06; font-size: 82px; color: var(--dark);",
  },
  {
    token: "eyebrow",
    spec: "Space Grotesk 600 · uppercase · 0.08em · cobalt — section kickers over a heading",
    sample: "Executive Summary",
    style:
      "display: inline-block; border-radius: 9999px; background: color-mix(in srgb, var(--primary) 6%, transparent); padding: 8px 20px; font-family: var(--disp); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; font-size: 15px; color: var(--primary);",
  },
  {
    token: "metric-value",
    spec: "Space Grotesk 700 · cobalt — the ONE place colour meets type: stats, counts, prices",
    sample: "$24.3M",
    style:
      "font-family: var(--disp); font-weight: 700; line-height: 1; letter-spacing: -0.02em; font-size: 64px; color: var(--primary);",
  },
  {
    token: "body",
    spec: "Inter 400 · line 1.6 · muted gray — paragraphs & supporting copy, never competing",
    sample:
      "Inter carries every paragraph in muted gray — readable, premium, never competing with the cobalt accent or the near-black headline.",
    style:
      "font-family: var(--body); font-weight: 400; font-size: 17px; line-height: 1.6; max-width: 660px; color: var(--muted-3);",
  },
  {
    token: "cta",
    spec: "Space Grotesk 600 · solid cobalt pill · cream label — the one saturated call to action",
    sample: "Book a Briefing",
    style:
      "display: inline-block; border-radius: 9999px; background: var(--primary); padding: 12px 30px; font-family: var(--disp); font-weight: 600; letter-spacing: 0.02em; font-size: 17px; color: var(--light);",
  },
];

// Frame Rules — Do / Don't bullets (frame-showcase.html PRINCIPLES section), restated against what
// the ported CSS actually does (rem tints derived from the one cobalt, no shadows anywhere).
const rules: ThemeTokens["rules"] = {
  do: [
    "Start every frame on warm cream; a single cobalt carries every accent.",
    "Set headlines near-black with −0.02em tracking; eyebrows cobalt, uppercase, 0.08em.",
    "Render every numeral in cobalt Space Grotesk 600–700.",
    "Lift content with soft cobalt-TINTED cards — 5% fill, 22% hairline border, gently rounded.",
    "Body in Inter 400, muted gray, line 1.6; the one saturated CTA is a solid cobalt pill.",
  ],
  dont: [
    "No second accent colour; no cobalt headlines.",
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
      headline: "Strong, professional commitment.",
      subtitle: "A consulting-grade frame system — warm cream, one saturated cobalt, soft tinted cards that never shout.",
      eyebrow: "Frame System",
    },
  },
  quote: {
    params: {
      text: "Quiet is the most expensive thing on the page.",
      attribution: "Managing Partner",
      eyebrow: "In Their Words",
    },
  },
  "closing-plate": { params: { headline: "Let's talk.", cta: "Book a Briefing" } },
  "feature-cards": {
    params: { headline: "What you get" },
    children: [
      { title: "Single Accent", body: "One cobalt carries every emphasis across the deck.", icon: "I", accent: "primary" },
      { title: "Soft Tints", body: "Cards lift on a faint cobalt fill — no borders that shout, no shadows.", icon: "II", accent: "secondary" },
      { title: "Quiet Density", body: "Substance over noise: measured type, generous margins.", icon: "III", accent: "accent-2" },
    ],
  },
  "stat-grid": {
    params: { headline: "Q3 at a glance" },
    children: [
      { value: 24.3, label: "Annual revenue", unitSuffix: "M", decimals: 1, accent: "primary" },
      { value: 94, label: "Net retention", unitSuffix: "%", accent: "secondary" },
      { value: 18, label: "Growth YoY", unitSuffix: "%", accent: "accent-3" },
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
  comparison: {
    params: { headline: "What moves the number", columns: ["Status Quo", "Our Approach"] },
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
    params: { headline: "What moves the number", caption: "Ranked by contribution." },
    children: [
      { value: 88, label: "Expansion", max: 100, unitSuffix: "%", leader: true },
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

export const professionalTheme: ThemeTokens = {
  name: "professional",
  title: "ProfessionalFrame",
  description:
    "A consulting-grade theme on a warm cream canvas: a single saturated cobalt carries every accent, near-black Space Grotesk headlines sit against muted-gray Inter body, and content lifts on soft cobalt-tinted cards — no second colour, no drop shadows. Frame unit: 1920×1080, 16:9.",
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
  // The treatments' DEFAULT decorations are block's own (cover's star, closing's slab) — those
  // hard-shadowed neobrutalist shapes are off-theme here, so suppress them rather than let them
  // auto-render or shift the reveal cascade. Professional's own families (see `decorations` below)
  // are opt-in per scene via addDecorations(); the always-on atmosphere is the hatch backdrop.
  suppressDefaultDecorations: true,
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
  // No template overrides: professional reaches its whole look in CSS alone (the cover panel/dots
  // and the quote rings are decoration components, not markup; the quote mark is a pseudo-element).
  palette,
  typography,
  rules,
  examples,
  // Professional's OWN restrained decoration families (panel · grille · ring · rule) — single-cobalt
  // hairline strokes + faint tint fills, no shadow. Themes don't share decorations: this roster lists
  // only professional's, and every one is held out of the Components grid globally. Opt-in per scene
  // via addDecorations().
  decorations: [...PROFESSIONAL_DECORATION_COMPONENTS],
};
