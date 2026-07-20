// Block theme — the palette/font `:root` tokens (block-tokens.css, replaces
// frame.css's :root) plus the shared frame-base CSS (block-frame.css: the
// `.block-frame` ground, the `.body` content wrapper, the base `.pill`/`h3`
// type, and the CSS-only decorations). Both live in sibling .css files imported
// as text, matching the treatment trio convention. The frame base is inlined
// ONCE per scene by the treatment builder; the per-treatment look lives in each
// treatment's own trio CSS. Content fonts (Inter, Space Grotesk) are self-hosted
// and staged from video-assets/themes/block/assets.
import { DECORATION_COMPONENTS } from "../primitives/decoration-shapes";
import type { ThemeTokens } from "../runtime/types";
import frameCss from "./block-frame.css" with { type: "text" };
import tokensCss from "./block-tokens.css" with { type: "text" };

// Showcase design data — the block styleguide extracted from
// video-assets/themes/block/frame-showcase.html (verbatim hex/labels/type-scale/
// rules), so the interactive showcase renders each section GENERICALLY from theme
// data. Other themes populate the same fields to standardize for free.

// Palette — the 8 block swatches (frame-showcase.html PALETTE section).
const palette: ThemeTokens["palette"] = [
  { name: "Pink", hex: "#FE90E8", varName: "pink" },
  { name: "Blue", hex: "#C0F7FE", varName: "blue" },
  { name: "Green", hex: "#99E885", varName: "green" },
  { name: "Yellow", hex: "#F7CB46", note: "CTA", varName: "yellow" },
  { name: "Cream", hex: "#FFDC8B", varName: "cream" },
  { name: "Off-White", hex: "#FFFDF5", note: "canvas", varName: "offwhite" },
  { name: "White", hex: "#FFFFFF", note: "cards", varName: "white" },
  { name: "Black", hex: "#000000", note: "borders", varName: "black" },
];

// Typography — the 5 type roles (frame-showcase.html TYPOGRAPHY section). `style`
// is the self-contained inline CSS the showcase applies to each live sample.
const displayBase =
  "font-family: var(--disp); text-transform: uppercase; line-height: 0.95;";
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
      "font-family: var(--disp); font-weight: 900; line-height: 1; letter-spacing: -0.02em; font-size: 64px;",
  },
  {
    token: "body",
    spec: "Inter 500 · sentence case · paragraphs & supporting copy",
    sample:
      "Body runs Inter at weight 500, sentence case — the calm against the heavy uppercase display.",
    style:
      "font-family: var(--disp); font-weight: 500; font-size: 18px; line-height: 1.6; max-width: 640px;",
  },
  {
    token: "label",
    spec: "Space Grotesk 600 · uppercase · eyebrows, tags & section kickers above a heading",
    sample: "Section Eyebrow",
    style:
      "display: inline-block; border: 3px solid var(--black); background: var(--white); box-shadow: 4px 4px 0 var(--black); padding: 6px 16px; font-family: var(--mono); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; font-size: 13px;",
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
  css: tokensCss,
  frameCss,
  fonts: {
    // Staged from video-assets/themes/block/assets/fonts by the scaffold.
    css: "assets/fonts/theme-fonts.css",
    files: ["inter.woff2", "space-grotesk.woff2", "theme-fonts.css"],
  },
  palette,
  typography,
  rules,
  // The decoration component families block offers (starburst · slab · stripe · badge).
  decorations: [...DECORATION_COMPONENTS],
};
