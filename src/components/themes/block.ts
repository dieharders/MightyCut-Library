// Block theme tokens — the palette/font `:root` block (replaces frame.css's
// :root) plus the shared frame-base CSS (the `.block-frame` ground, the `.body`
// content wrapper, the base `.pill`/`h3` type, and the CSS-only decorations).
// The frame base is inlined ONCE per scene by the treatment builder; the per-
// treatment look lives in each treatment's own trio CSS. Content fonts (Inter,
// Space Grotesk) are self-hosted and staged from video-assets/themes/block/assets.
import { DECORATION_COMPONENTS } from "../primitives/decoration-shapes";
import type { ThemeTokens } from "../runtime/types";

const tokensCss = `:root {
  --black: #000000;
  --white: #ffffff;
  --offwhite: #fffdf5;
  --pink: #fe90e8;
  --blue: #c0f7fe;
  --green: #99e885;
  --yellow: #f7cb46;
  --cream: #ffdc8b;
  --disp: "Inter", sans-serif;
  --mono: "Space Grotesk", sans-serif;
}`;

// The frame ground + shared structure. `.block-frame` is the page wrapper the
// emitter stamps the ground background onto; container-type:size makes 1cqw = 1%
// of the frame width so the same cqw numbers render identically in the gallery
// thumbnail and a full 1920x1080 scene.
const frameCss = `.block-frame {
  position: absolute;
  inset: 0;
  overflow: hidden;
  container-type: size;
  font-family: var(--disp);
  color: var(--black);
}
.block-frame > .body {
  position: absolute;
  inset: 0;
  z-index: 3;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.block-frame .pill {
  display: inline-block;
  align-self: flex-start;
  border: 0.25cqw solid var(--black);
  background: var(--white);
  box-shadow: 0.4cqw 0.4cqw 0 var(--black);
  padding: 0.5cqw 1.2cqw;
  font-family: var(--mono);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 1.5cqw;
  line-height: 1.2;
}
.block-frame h3 {
  font-family: var(--disp);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.03em;
  line-height: 0.95;
  margin: 0;
}
.block-frame .dg {
  position: absolute;
  inset: 0;
  opacity: 0.32;
  background-image: radial-gradient(circle, var(--black) 0.14cqw, transparent 0.14cqw);
  background-size: 3cqw 3cqw;
  z-index: 1;
  pointer-events: none;
}`;

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
  { name: "Black", hex: "#000000", note: "all borders", varName: "black" },
];

// Typography — the 5 type roles (frame-showcase.html TYPOGRAPHY section). `style`
// is the self-contained inline CSS the showcase applies to each live sample.
const displayBase = "font-family: var(--disp); text-transform: uppercase; line-height: 0.95;";
const typography: ThemeTokens["typography"] = [
  {
    token: "heading-xl",
    spec: "Inter 900 · uppercase · −0.03em — hero titles & the one biggest word on a frame",
    sample: "Maximal.",
    style: `${displayBase} font-weight: 900; letter-spacing: -0.03em; font-size: 80px;`,
  },
  {
    token: "heading-lg",
    spec: "Inter 800 · uppercase · −0.02em — section headlines & secondary titles",
    sample: "Bordered & Bold",
    style: `${displayBase} font-weight: 800; letter-spacing: -0.02em; font-size: 50px;`,
  },
  {
    token: "stat-number",
    spec: "Inter 900 · line 1 — big numeric callouts: stats, counts, prices",
    sample: "240",
    style: "font-family: var(--disp); font-weight: 900; line-height: 1; letter-spacing: -0.02em; font-size: 64px;",
  },
  {
    token: "body",
    spec: "Inter 500 · sentence case · line 1.6 — paragraphs & supporting copy",
    sample: "Body runs Inter at weight 500, sentence case — the calm against the heavy uppercase display.",
    style: "font-family: var(--disp); font-weight: 500; font-size: 18px; line-height: 1.6; max-width: 640px;",
  },
  {
    token: "label",
    spec: "Space Grotesk 600 · uppercase · 0.08em — eyebrows, tags & section kickers above a heading",
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
