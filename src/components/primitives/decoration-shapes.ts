// Shared shape engine for the decoration family. There are THREE decoration
// components — starburst, slab, stripe — each with its OWN disjoint list of shape
// variants (so no two decorations can ever render the same shape). They share this
// one var-driven element + layout: `variant` picks the shape, and x/y/size/rotate/
// layer/accent place + style it in page-space. A treatment carries any mix of them
// via addDecorations().
import { z } from "zod";
import { component } from "../runtime/component";
import { remGrid } from "../runtime/css";

// Ink weights for decorations. Two independent knobs:
//   EDGE_REM   — the outline weight (box border + polygon SVG stroke). FIXED: it does
//                NOT scale with `size`, so a large slab/shield keeps the same crisp edge
//                as a small one. Was `size × 0.042rem`; pinned to the default-size look.
//   SHADOW_UNIT — the hard drop-shadow OFFSET, as a fraction of `size`. This one SCALES
//                with size so the shadow never drifts too far from a small shape nor reads
//                too thin when enlarged (~0.6rem at the default size 16).
const EDGE_REM = 0.625;
const SHADOW_UNIT = 0.0375;

// The four decoration component names (the showcase + blockTheme reference these).
export const DECORATION_COMPONENTS = [
  "starburst",
  "slab",
  "stripe",
  "badge",
] as const;
export type DecorationComponentName = (typeof DECORATION_COMPONENTS)[number];

// clip-path polygons (percent coords). Box shapes use border/radius; pattern
// shapes use a repeating-gradient fill.
const STAR =
  "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";
const BURST =
  "polygon(50% 0%, 60% 22%, 84% 12%, 78% 38%, 100% 50%, 78% 62%, 84% 88%, 60% 78%, 50% 100%, 40% 78%, 16% 88%, 22% 62%, 0% 50%, 22% 38%, 16% 12%, 40% 22%)";
const TRIANGLE = "polygon(50% 2%, 98% 98%, 2% 98%)";
const RHOMBUS = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
const HEXAGON = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
const CROSS =
  "polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)";
const SHIELD = "polygon(50% 0%, 100% 18%, 100% 62%, 50% 100%, 0% 62%, 0% 18%)";
const TAG = "polygon(0% 0%, 78% 0%, 100% 50%, 78% 100%, 0% 100%)";

type ShapeCfg = {
  clip?: string;
  radius?: string;
  box?: boolean;
  pattern?: "stripe" | "bars" | "grid";
  h?: number;
};
const SHAPES: Record<string, ShapeCfg> = {
  // starburst family — pointed & round bursts
  star: { clip: STAR },
  burst: { clip: BURST },
  triangle: { clip: TRIANGLE },
  circle: { radius: "50%", box: true },
  // slab family — angular blocks
  square: { box: true },
  rectangle: { box: true, h: 0.6 },
  rhombus: { clip: RHOMBUS },
  hexagon: { clip: HEXAGON },
  cross: { clip: CROSS },
  // stripe family — repeating-gradient fills
  stripe: { pattern: "stripe", h: 0.42 },
  bars: { pattern: "bars", h: 0.42 },
  grid: { pattern: "grid" },
  // badge family — rounded / tag shapes
  shield: { clip: SHIELD },
  tag: { clip: TAG },
  ticket: { box: true, radius: "2.5rem", h: 0.6 },
  capsule: { box: true, radius: "999px", h: 0.5 },
};

/** Convert a CSS `polygon(50% 0%, …)` clip string to SVG `<polygon points>` (viewBox 0 0 100). */
const svgPoints = (clip: string): string =>
  clip
    .replace(/polygon\(|\)|%/g, "")
    .split(",")
    .map((pt) => pt.trim().replace(/\s+/g, ","))
    .join(" ");

const patternBg = (kind: "stripe" | "bars" | "grid", color: string): string => {
  if (kind === "stripe") {
    return `repeating-linear-gradient(45deg, var(--black), var(--black) 1rem, ${color} 1rem, ${color} 2.875rem)`;
  }
  if (kind === "bars") {
    return `repeating-linear-gradient(90deg, var(--black), var(--black) 1.125rem, ${color} 1.125rem, ${color} 3.25rem)`;
  }
  // grid: black crosshatch lines over the color fill
  return (
    `repeating-linear-gradient(0deg, var(--black) 0 0.5rem, transparent 0.5rem 3.125rem), ` +
    `repeating-linear-gradient(90deg, var(--black) 0 0.5rem, transparent 0.5rem 3.125rem), ` +
    `linear-gradient(${color}, ${color})`
  );
};

/** The shared, var-driven decoration element (one `.deco`, styled entirely by
 *  inline custom properties from decorationLayout). */
export const DECO_TEMPLATE = `<div class="deco" data-anim="item"><i class="deco-shape" data-html="shape"></i></div>`;
export const DECO_CSS = `.deco {
  position: absolute;
  left: var(--d-x, 50%);
  top: var(--d-y, 50%);
  width: var(--d-w, 19.2rem);
  height: var(--d-h, 19.2rem);
  transform: translate(-50%, -50%) rotate(var(--d-rot, 0deg));
  background: var(--d-bg, transparent);
  border: var(--d-border, none);
  border-radius: var(--d-radius, 0);
  /* Rectangular shapes (box + pattern) get a crisp box-shadow — painted in the same
     layer as the border, so it never seams against the background under fractional
     preview scaling. Polygon shapes have no box-shadow and instead cast an alpha-
     following filter drop-shadow (set inline) so the shadow hugs the SVG silhouette. */
  box-shadow: var(--d-boxshadow, none);
  filter: var(--d-filter, none);
  z-index: var(--d-z, 1);
  pointer-events: none;
}
.deco-shape { position: absolute; inset: 0; }
.deco-shape svg { display: block; width: 100%; height: 100%; overflow: visible; }`;

type DecoParams = {
  variant: string;
  x: number;
  y: number;
  size: number;
  rotate: number;
  layer: "back" | "front";
  accent: "pink" | "blue" | "green" | "yellow" | "cream";
};

const decorationLayout = (p: DecoParams): Record<string, string> => {
  const s = SHAPES[p.variant] ?? SHAPES.square!;
  const color = `var(--${p.accent})`;
  // Hard shadow offset scales with size so it stays proportional at every scale.
  const off = remGrid(p.size * SHADOW_UNIT);
  const vars: Record<string, string> = {
    "--d-x": `${p.x}%`,
    "--d-y": `${p.y}%`,
    "--d-w": remGrid(p.size * 1.2),
    "--d-h": remGrid(p.size * (s.h ?? 1) * 1.2),
    "--d-rot": `${p.rotate}deg`,
    "--d-z": p.layer === "front" ? "5" : "1",
  };
  // Polygon shapes render as inline SVG (fill + stroke on the shape) — the div stays a
  // bare, transparent container and casts an alpha-following filter drop-shadow.
  // Box + pattern shapes are pure CSS rectangles (bg / border / radius) and take a crisp,
  // same-layer box-shadow instead (no filter seam against the background under scaling).
  if (!s.clip) {
    vars["--d-bg"] = s.pattern ? patternBg(s.pattern, color) : color;
    if (s.radius) vars["--d-radius"] = s.radius;
    // Fixed outline weight (does not scale with size) — matches the polygon variants'
    // constant SVG stroke so box, pattern, and polygon shapes all carry the same ink
    // weight everywhere. Pattern shapes (stripe/bars/grid) get it too so they're not
    // shadow-only; polygons already have their SVG stroke.
    if (s.box || s.pattern)
      vars["--d-border"] = `${EDGE_REM}rem solid var(--black)`;
    vars["--d-boxshadow"] = `${off} ${off} 0 0 var(--black)`;
  } else {
    vars["--d-filter"] = `drop-shadow(${off} ${off} 0 var(--black))`;
  }
  return vars;
};

/** Inline SVG for a clip-path (polygon) variant — accent fill + ink stroke border, so the
 *  container's clip-path is free (any clip-path transition, e.g. wipe, works on the shape). */
const decoSvg = (p: DecoParams): string => {
  const clip = SHAPES[p.variant]?.clip;
  if (!clip) return "";
  // Clip shapes are square (h defaults to 1), so the 0-100 viewBox scales uniformly to
  // the element (size×1.2 rem). Pick a stroke-width in viewBox units that renders at the
  // constant EDGE_REM regardless of size: rendered = strokeWidth × (size×1.2 / 100) = EDGE_REM.
  const strokeWidth = ((EDGE_REM * 100) / (p.size * 1.2)).toFixed(3);
  return (
    `<svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">` +
    `<polygon points="${svgPoints(clip)}" ` +
    `style="fill: var(--${p.accent}); stroke: var(--black); stroke-width: ${strokeWidth}; stroke-linejoin: miter; stroke-miterlimit: 6"></polygon>` +
    `</svg>`
  );
};

/** Build one decoration component: a shape family (its own `variant` enum) over
 *  the shared placement props + shape engine. */
export const decorationComponent = (
  name: string,
  variants: readonly string[],
  example: DecoParams,
) =>
  component({
    name,
    schema: z.object({
      variant: z
        .enum(variants as [string, ...string[]])
        .default(variants[0]!)
        .describe("Shape"),
      x: z
        .number()
        .min(0)
        .max(100)
        .default(50)
        .describe("X origin in page-space (0% = left … 100% = right)"),
      y: z
        .number()
        .min(0)
        .max(100)
        .default(50)
        .describe("Y origin in page-space (0% = top … 100% = bottom)"),
      size: z
        .number()
        .positive()
        .max(60)
        .default(16)
        .describe(
          "Size as a percent of the 1920 design width (16 = 16%, emitted as rem)",
        ),
      rotate: z
        .number()
        .min(-180)
        .max(180)
        .default(0)
        .describe("Rotation in degrees"),
      layer: z
        .enum(["back", "front"])
        .default("back")
        .describe("Behind content (back) or over top (front)"),
      accent: z
        .enum(["pink", "blue", "green", "yellow", "cream"])
        .default("pink")
        .describe("Fill color token"),
    }),
    template: DECO_TEMPLATE,
    css: DECO_CSS,
    example,
    // Polygon variants inject their shape as inline SVG; box/pattern variants leave the
    // slot empty (null ⇒ the shape span self-removes) and render via CSS on the div.
    rawFill: (p) => ({ shape: SHAPES[p.variant]?.clip ? decoSvg(p) : null }),
    layout: decorationLayout,
    // The whole-shape entrance IS the transition (so an assigned animIn REPLACES it
    // rather than doubling up). Default reproduces the old decorationAnim byte-for-byte.
    animIn: "scale",
    animInOpts: { from: 0.4 },
  });
