// Professional's decoration engine — the consulting-grade counterpart to block's neobrutalist
// solids, future's luminous strokes and capsule's candy fills. Professional's marks are quiet
// GEOMETRIC LINE-ART in the single cobalt accent — concentric circles, concentric squares, framing
// corner marks, and dot fields — and, unlike every other engine, cast NO shadow (professional's
// one hard rule is "no drop shadows"). The four families are coherent, recognisable framing motifs
// (not abstract): ring · keyline · corner · grille. Positioned page-space flourishes any treatment
// can carry via addDecorations().
//
// PROFESSIONAL-ONLY by ROSTER, not by token: they paint with the shared 10 palette roles (every
// role is cobalt under professional, so the whole set reads as one restrained accent), so nothing
// in the markup is professional-specific. `decoration: true` holds every family out of the showcase
// Components grid under any theme, and only professionalTheme.decorations lists them.
//
// Constant-ink, like block/future/capsule: the STROKE weight is FIXED (does NOT scale with `size`)
// so a large mark keeps the same crisp hairline as a small one — computed per-shape in viewBox
// units (professionalDecoSvg). The filled dots (grille) DO scale, exactly as a fill should. Every
// default placement is CENTRED (x/y 50), matching capsule, so a decoration reads on-canvas in the
// showcase preview rather than hiding in a corner.
import { component } from "../runtime/component";
import { remGrid } from "../runtime/css";
import { decorationSchema, type DecoParams } from "./decoration-placement";

// The one constant hairline weight the whole set shares (a touch over the 0.125rem grid so it
// reads as a drawn line, never a container edge). Rendered at this rem at ANY size via the
// viewBox-unit maths in professionalDecoSvg.
const STROKE_REM = 0.1875;

// The four professional decoration component names (the showcase + professionalTheme reference these).
export const PROFESSIONAL_DECORATION_COMPONENTS = [
  "ring",
  "keyline",
  "corner",
  "grille",
] as const;
export type ProfessionalDecorationComponentName =
  (typeof PROFESSIONAL_DECORATION_COMPONENTS)[number];

/** Which shape variants belong to which family — the DISJOINT lists, declared once here and
 *  consumed by each family's `index.ts`, so the enum a component validates against and the list
 *  documented here can't drift. Tripwires in registry.test.ts assert the lists stay disjoint
 *  (within professional AND against block/future/capsule) and that every name draws a distinct
 *  shape. */
export const PROFESSIONAL_DECORATION_VARIANTS = {
  ring: ["halo", "target", "contour"],
  keyline: ["single", "double", "inset"],
  corner: ["corners", "elbow", "ticks"],
  grille: ["matrix", "scatter", "stack"],
} as const satisfies Record<ProfessionalDecorationComponentName, readonly string[]>;

// Each shape is authored in a square 0..100 viewBox so the box scales uniformly and the outline
// stays a true SVG stroke. A shape receives the accent as a solid role var (`color`) and the
// viewBox-unit stroke width (`sw`) that renders at the constant STROKE_REM. The `opacity`
// attributes are the per-mark restraint (a numeric attribute, not a colour), so the marks sit as
// quiet chrome behind content.
type ShapeAttrs = { color: string; sw: string };
type ShapeFn = (a: ShapeAttrs) => string;

const dot = (cx: number, cy: number, r: number, color: string, op: number): string =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${op}"></circle>`;
const ringC = (r: number, a: ShapeAttrs, op: number): string =>
  `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${a.color}" stroke-width="${a.sw}" opacity="${op}"></circle>`;
const box = (x: number, y: number, s: number, rx: number, a: ShapeAttrs, op: number): string =>
  `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${rx}" fill="none" stroke="${a.color}" stroke-width="${a.sw}" opacity="${op}"></rect>`;
const line = (d: string, a: ShapeAttrs, op: number): string =>
  `<path d="${d}" fill="none" stroke="${a.color}" stroke-width="${a.sw}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"></path>`;

const SHAPES: Record<string, ShapeFn> = {
  // ring — concentric circles (the showcase's `.rings`): hairline strokes, no fill. The reference
  // motif the whole set is a variation on.
  halo: (a) => ringC(46, a, 0.5) + ringC(30, a, 0.5),
  target: (a) => ringC(46, a, 0.5) + ringC(32, a, 0.5) + ringC(18, a, 0.5),
  contour: (a) => ringC(44, a, 0.5) + dot(50, 50, 7, a.color, 0.5),

  // keyline — concentric SQUARES: the ring motif answered with right angles. A clean nested-frame
  // border, the kind that keylines a slide region in an editorial deck.
  single: (a) => box(10, 10, 80, 10, a, 0.5),
  double: (a) => box(6, 6, 88, 12, a, 0.5) + box(26, 26, 48, 8, a, 0.5),
  inset: (a) => box(6, 6, 88, 10, a, 0.5) + box(17, 17, 66, 7, a, 0.3),

  // corner — framing CORNER MARKS: L-brackets and edge ticks that frame a region, like a
  // viewfinder or print crop marks. Recognisable, structural, not abstract.
  corners: (a) =>
    line("M10 32 L10 10 L32 10", a, 0.55) +
    line("M68 10 L90 10 L90 32", a, 0.55) +
    line("M90 68 L90 90 L68 90", a, 0.55) +
    line("M32 90 L10 90 L10 68", a, 0.55),
  elbow: (a) =>
    line("M10 40 L10 10 L40 10", a, 0.55) + line("M60 90 L90 90 L90 60", a, 0.55),
  ticks: (a) =>
    line("M50 8 L50 24", a, 0.55) +
    line("M92 50 L76 50", a, 0.55) +
    line("M50 92 L50 76", a, 0.55) +
    line("M8 50 L24 50", a, 0.55),

  // grille — cobalt DOT fields (the showcase's `.dots`): filled discs, bold enough to read as a
  // deliberate grid rather than dust. Two matrices and a column.
  matrix: (a) =>
    [22, 50, 78].flatMap((cx) => [22, 50, 78].map((cy) => dot(cx, cy, 8, a.color, 0.6))).join(""),
  scatter: (a) =>
    dot(24, 28, 9, a.color, 0.62) +
    dot(60, 18, 6.5, a.color, 0.4) +
    dot(82, 40, 9.5, a.color, 0.55) +
    dot(40, 60, 7.5, a.color, 0.5) +
    dot(74, 76, 9, a.color, 0.6) +
    dot(26, 82, 6.5, a.color, 0.42),
  stack: (a) => [14, 32, 50, 68, 86].map((cy) => dot(50, cy, 8, a.color, 0.6)).join(""),
};

/** The shared, var-driven professional decoration element (one `.pd-deco`, styled entirely by
 *  inline custom properties from the layout). Transparent box — the SVG carries the shape; there
 *  is NO shadow layer (professional casts none), which is what sets this engine apart from the
 *  other three. */
export const PD_DECO_TEMPLATE = `<div class="pd-deco" data-anim="item"><i class="pd-deco-shape" data-html="shape"></i></div>`;
export const PD_DECO_CSS = `.pd-deco {
  position: absolute;
  left: var(--pd-x, 50%);
  top: var(--pd-y, 50%);
  width: var(--pd-w, 26.4rem);
  height: var(--pd-h, 26.4rem);
  transform: translate(-50%, -50%) rotate(var(--pd-rot, 0deg));
  z-index: var(--pd-z, 1);
  pointer-events: none;
}
.pd-deco-shape { position: absolute; inset: 0; }
.pd-deco-shape svg { display: block; width: 100%; height: 100%; overflow: visible; }`;

const professionalDecorationLayout = (p: DecoParams): Record<string, string> => {
  const w = remGrid(p.size * 1.2);
  return {
    "--pd-x": `${p.x}%`,
    "--pd-y": `${p.y}%`,
    "--pd-w": w,
    "--pd-h": w, // square box → square viewBox scales uniformly (constant ink)
    "--pd-rot": `${p.rotate}deg`,
    "--pd-z": p.layer === "front" ? "5" : "1",
  };
};

/** Inline SVG for a variant — a hairline stroke (or, for grille, filled dots) in the instance
 *  accent, in a square 0..100 viewBox. stroke-width is chosen in viewBox units so it RENDERS at
 *  the constant STROKE_REM at any size: rendered = strokeWidth × (size×1.2 / 100) = STROKE_REM
 *  (the box is size×1.2 rem square). */
const professionalDecoSvg = (p: DecoParams): string => {
  const shape = SHAPES[p.variant] ?? SHAPES.halo!;
  const color = `var(--${p.accent})`;
  const sw = ((STROKE_REM * 100) / (p.size * 1.2)).toFixed(3);
  return (
    `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">` +
    shape({ color, sw }) +
    `</svg>`
  );
};

/** Build one professional decoration component: a geometric line-art family (its own `variant`
 *  enum) over the shared placement props + stroke engine. Flagged `decoration: true`.
 *
 *  The family NAME is the only key a caller passes — its variant list is looked up from
 *  PROFESSIONAL_DECORATION_VARIANTS here, so a family can't be wired to another's shapes, and
 *  `example.variant` is typed to that family's own list. `sizeDefault` differs per family — corner
 *  marks want to frame a larger area than a dot cluster — but the accent default is always
 *  `primary` (cobalt), the single accent every professional mark shares. */
export const professionalDecorationComponent = <N extends ProfessionalDecorationComponentName>(
  name: N,
  sizeDefault: number,
  example: DecoParams & { variant: (typeof PROFESSIONAL_DECORATION_VARIANTS)[N][number] },
) => {
  const variants: readonly string[] = PROFESSIONAL_DECORATION_VARIANTS[name];
  return component({
    name,
    // Intrinsic decoration — held out of the showcase Components grid under any theme.
    decoration: true,
    schema: decorationSchema({
      variants,
      sizeDefault,
      accentDefault: example.accent,
      accentDescription: "Stroke / dot colour — a palette role of the active theme",
    }),
    template: PD_DECO_TEMPLATE,
    css: PD_DECO_CSS,
    example,
    // Every professional variant is inline SVG, so the data-html slot is always filled.
    rawFill: (p) => ({ shape: professionalDecoSvg(p) }),
    layout: professionalDecorationLayout,
    // A quiet fade IS the entrance (an assigned animIn REPLACES it) — professional's mood is
    // restraint, so the marks arrive without the scale-pop block and capsule use.
    animIn: "fade",
  });
};
