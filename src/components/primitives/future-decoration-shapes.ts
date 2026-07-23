// Future's decoration engine — the sci-fi counterpart to the neobrutalist
// decoration-shapes.ts. Where block's decorations are ink-bordered, hard-shadowed
// solids, future's are LUMINOUS: thin accent strokes on a transparent element,
// hollow forms, and a soft colored glow (a `filter: drop-shadow` with no offset) —
// the language of the constellation backdrop and the glass panels. There are FOUR
// families — node · reticle · glyph · signal — each with its OWN disjoint variant
// list (so no two future decorations render the same shape), sharing this one
// var-driven element + a square-viewBox SVG shape set. A treatment carries any mix
// of them via addDecorations(); a scene positions them in page-space with x/y/size/
// rotate/layer, and tints them with one of the 10 shared palette roles (--primary …).
//
// These are FUTURE-ONLY by ROSTER, not by token: they paint with the shared palette
// roles every theme defines, so nothing in the markup is future-specific — but
// `decoration: true` holds every family out of the showcase Components grid, and only
// futureTheme.decorations lists them (themes never share decorations).
import { z } from "zod";
import { component } from "../runtime/component";
import { remGrid } from "../runtime/css";
import { PALETTE_VARS, type PaletteVar } from "../../types/palette";

// Stroke weight for every luminous line/outline, in rem. FIXED (does not scale with
// `size`): a large reticle keeps the same delicate hairline as a small node. Rendered
// via a per-shape SVG stroke-width computed in viewBox units (see futureDecoSvg), the
// same constant-ink trick block's polygons use.
const STROKE_REM = 0.5;
// Glow spread as a fraction of `size` (the drop-shadow blur radius). Scales with size so
// a big shape blooms proportionally; floored so a small one still reads as lit.
const GLOW_UNIT = 0.045;

// The four future decoration component names (the showcase + futureTheme reference these).
export const FUTURE_DECORATION_COMPONENTS = [
  "node",
  "reticle",
  "glyph",
  "signal",
] as const;
export type FutureDecorationComponentName =
  (typeof FUTURE_DECORATION_COMPONENTS)[number];

// Tint tokens — the shared palette roles (types/palette.ts). Under future --primary is
// the leading cyan; --secondary/--accent-1/--accent-2 are the quiet amber/green/violet;
// --light is the near-white. Any role is legal; the theme decides the hex.
const accentVar = (a: string): string => `var(--${a})`;

// Every shape is authored in a square 0..100 viewBox and drawn with a shared stroke
// attribute set (accent stroke, no fill, round joins) so the families read as one
// system; a few variants add a filled or translucent element for weight (node core,
// signal bars, the beam cone). `s` = the stroke attribute string, `c` = the accent var.
type ShapeFn = (s: string, c: string) => string;

const SHAPES: Record<string, ShapeFn> = {
  // node — luminous constellation points (echo the backdrop's particle network).
  ring: (s) => `<circle cx="50" cy="50" r="33" ${s}></circle>`,
  core: (s, c) =>
    `<circle cx="50" cy="50" r="33" ${s} opacity="0.4"></circle>` +
    `<circle cx="50" cy="50" r="14" fill="${c}"></circle>`,
  orbit: (s, c) =>
    `<circle cx="50" cy="50" r="33" ${s}></circle>` +
    `<circle cx="50" cy="50" r="4.5" fill="${c}"></circle>` +
    `<circle cx="83" cy="50" r="7" fill="${c}"></circle>`,
  pulse: (s) =>
    `<circle cx="50" cy="50" r="17" ${s}></circle>` +
    `<circle cx="50" cy="50" r="36" ${s} opacity="0.5"></circle>`,

  // reticle — HUD targeting frames (brackets, crosshair, dial, clipped-corner frame).
  brackets: (s) =>
    `<path d="M18 32 L18 18 L32 18" ${s}></path>` +
    `<path d="M68 18 L82 18 L82 32" ${s}></path>` +
    `<path d="M82 68 L82 82 L68 82" ${s}></path>` +
    `<path d="M32 82 L18 82 L18 68" ${s}></path>`,
  crosshair: (s, c) =>
    `<path d="M50 10 L50 38 M50 62 L50 90 M10 50 L38 50 M62 50 L90 50" ${s}></path>` +
    `<circle cx="50" cy="50" r="9" ${s}></circle>` +
    `<circle cx="50" cy="50" r="2.5" fill="${c}"></circle>`,
  gauge: (s, c) =>
    `<path d="M26 74 A34 34 0 1 1 74 74" ${s}></path>` +
    `<circle cx="26" cy="74" r="4.5" fill="${c}"></circle>` +
    `<circle cx="74" cy="74" r="4.5" fill="${c}"></circle>`,
  frame: (s) =>
    `<path d="M30 16 L70 16 L84 30 L84 70 L70 84 L30 84 L16 70 L16 30 Z" ${s}></path>`,

  // glyph — hollow geometric emblems (hex, diamond, double chevron, triangle).
  hexagon: (s) => `<path d="M50 14 L81 32 L81 68 L50 86 L19 68 L19 32 Z" ${s}></path>`,
  diamond: (s) => `<path d="M50 12 L88 50 L50 88 L12 50 Z" ${s}></path>`,
  chevron: (s) =>
    `<path d="M32 24 L58 50 L32 76" ${s}></path>` +
    `<path d="M52 24 L78 50 L52 76" ${s}></path>`,
  triangle: (s) => `<path d="M50 16 L84 80 L16 80 Z" ${s}></path>`,

  // signal — data/transmission motifs (waveform, equalizer bars, a broadcast beam).
  waveform: (s) =>
    `<path d="M8 50 L22 30 L36 68 L50 26 L64 68 L78 32 L92 50" ${s}></path>`,
  bars: (_s, c) =>
    `<rect x="13.5" y="54" width="9" height="30" rx="1.5" fill="${c}"></rect>` +
    `<rect x="29.5" y="32" width="9" height="52" rx="1.5" fill="${c}"></rect>` +
    `<rect x="45.5" y="16" width="9" height="68" rx="1.5" fill="${c}"></rect>` +
    `<rect x="61.5" y="40" width="9" height="44" rx="1.5" fill="${c}"></rect>` +
    `<rect x="77.5" y="60" width="9" height="24" rx="1.5" fill="${c}"></rect>`,
  beam: (s, c) =>
    `<path d="M50 84 L28 16 L72 16 Z" ${s} fill="${c}" fill-opacity="0.16"></path>` +
    `<circle cx="50" cy="84" r="5" fill="${c}"></circle>`,
};

// Which variant belongs to which family — the disjoint lists (a tripwire guards it).
const NODE = ["ring", "core", "orbit", "pulse"] as const;
const RETICLE = ["brackets", "crosshair", "gauge", "frame"] as const;
const GLYPH = ["hexagon", "diamond", "chevron", "triangle"] as const;
const SIGNAL = ["waveform", "bars", "beam"] as const;
export const FUTURE_DECORATION_VARIANTS: Record<
  FutureDecorationComponentName,
  readonly string[]
> = { node: NODE, reticle: RETICLE, glyph: GLYPH, signal: SIGNAL };

type DecoParams = {
  variant: string;
  x: number;
  y: number;
  size: number;
  rotate: number;
  layer: "back" | "front";
  accent: PaletteVar;
};

/** The shared, var-driven future decoration element (one `.fx-deco`, styled entirely by
 *  inline custom properties from futureDecorationLayout). Transparent box — the SVG carries
 *  the luminous shape and the div casts the accent glow via `--fd-glow`. */
export const FX_DECO_TEMPLATE = `<div class="fx-deco" data-anim="item"><i class="fx-deco-shape" data-html="shape"></i></div>`;
export const FX_DECO_CSS = `.fx-deco {
  position: absolute;
  left: var(--fd-x, 50%);
  top: var(--fd-y, 50%);
  width: var(--fd-w, 19.2rem);
  height: var(--fd-h, 19.2rem);
  transform: translate(-50%, -50%) rotate(var(--fd-rot, 0deg));
  /* No offset — a 0,0 drop-shadow is a soft accent halo hugging the stroked silhouette
     (the neon glow), the light-on-dark counterpart to block's hard ink offset. */
  filter: var(--fd-glow, none);
  z-index: var(--fd-z, 1);
  pointer-events: none;
}
.fx-deco-shape { position: absolute; inset: 0; }
/* overflow visible so the stroke + glow are never clipped by the shape box. */
.fx-deco-shape svg { display: block; width: 100%; height: 100%; overflow: visible; }`;

const futureDecorationLayout = (p: DecoParams): Record<string, string> => {
  const color = accentVar(p.accent);
  const w = remGrid(p.size * 1.2);
  // Glow blur scales with size (floored so small shapes still read as lit).
  const blur = remGrid(Math.max(p.size, 8) * GLOW_UNIT, 0.25);
  return {
    "--fd-x": `${p.x}%`,
    "--fd-y": `${p.y}%`,
    "--fd-w": w,
    "--fd-h": w, // square box → square viewBox scales uniformly (constant stroke)
    "--fd-rot": `${p.rotate}deg`,
    "--fd-z": p.layer === "front" ? "5" : "1",
    "--fd-glow": `drop-shadow(0 0 ${blur} ${color})`,
  };
};

/** Inline SVG for a variant — accent stroke (or fill, per shape) in a square 0..100 viewBox.
 *  stroke-width is chosen in viewBox units so it RENDERS at the constant STROKE_REM at any
 *  size: rendered = strokeWidth × (size×1.2 / 100) = STROKE_REM (box is size×1.2 rem square). */
const futureDecoSvg = (p: DecoParams): string => {
  const shape = SHAPES[p.variant] ?? SHAPES.ring!;
  const color = accentVar(p.accent);
  const strokeWidth = ((STROKE_REM * 100) / (p.size * 1.2)).toFixed(3);
  const strokeAttrs = `fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"`;
  return (
    `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">` +
    shape(strokeAttrs, color) +
    `</svg>`
  );
};

/** Build one future decoration component: a sci-fi shape family (its own `variant` enum)
 *  over the shared placement props + luminous shape engine. Flagged `decoration: true`. */
export const futureDecorationComponent = (
  name: string,
  variants: readonly string[],
  example: DecoParams,
) =>
  component({
    name,
    // Intrinsic decoration — held out of the showcase Components grid under any theme.
    decoration: true,
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
        .default(18)
        .describe(
          "Size as a percent of the 1920 design width (18 = 18%, emitted as rem)",
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
      // Default comes from the family's own `example` so each family carries a
      // DISTINCT signature tint — node --primary (cyan) · reticle --secondary (amber) ·
      // glyph --accent-2 (violet) · signal --accent-1 (green) — so an unparameterised
      // deck/showcase render never repeats a colour.
      accent: z
        .enum(PALETTE_VARS)
        .default(example.accent)
        .describe("Glow / stroke colour — a palette role (--primary … --dark)"),
    }),
    template: FX_DECO_TEMPLATE,
    css: FX_DECO_CSS,
    example,
    // Every future variant is inline SVG (unlike block, none are CSS-drawn), so shape is
    // always a string — the data-html slot is always filled.
    rawFill: (p) => ({ shape: futureDecoSvg(p) }),
    layout: futureDecorationLayout,
    // A quiet fade IS the entrance (an assigned animIn REPLACES it) — the recessive,
    // negative-space-forward future mood, vs block's pop-in scale.
    animIn: "fade",
  });
