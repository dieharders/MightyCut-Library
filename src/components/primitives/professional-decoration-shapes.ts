// Professional's decoration engine — the consulting-grade counterpart to block's neobrutalist
// solids, future's luminous strokes and capsule's candy fills. Where those shout, professional
// WHISPERS: every family is a single-cobalt hairline stroke or a faint (single-digit-percent)
// tint fill, and — unlike every other engine — casts NO shadow at all (professional's one hard
// rule is "no drop shadows"). The four families reproduce the four decorative marks the
// professional showcase uses as chrome — the diagonal accent PANEL, the cobalt dot GRILLE, the
// concentric RING, and the thin accent RULE — as positioned page-space flourishes any treatment
// can carry via addDecorations().
//
// PROFESSIONAL-ONLY by ROSTER, not by token: they paint with the shared 10 palette roles (every
// role is cobalt under professional, so the whole set reads as one restrained accent — the
// theme's signature), so nothing in the markup is professional-specific. `decoration: true`
// holds every family out of the showcase Components grid under any theme, and only
// professionalTheme.decorations lists them (themes never share decorations).
//
// Constant-ink, like block/future/capsule: the STROKE weight is FIXED (does NOT scale with
// `size`) so a large panel keeps the same crisp hairline as a small rule — computed per-shape in
// viewBox units (professionalDecoSvg). The "solids" that DO scale are the filled dots and the
// faint panel fill, exactly as a fill should.
import { component } from "../runtime/component";
import { remGrid } from "../runtime/css";
import { decorationSchema, type DecoParams } from "./decoration-placement";

// The one constant hairline weight the whole set shares (a touch over the 0.125rem grid so it
// reads as a drawn line, never a container edge). Rendered at this rem at ANY size via the
// viewBox-unit maths in professionalDecoSvg.
const STROKE_REM = 0.1875;

// The four professional decoration component names (the showcase + professionalTheme reference these).
export const PROFESSIONAL_DECORATION_COMPONENTS = [
  "panel",
  "grille",
  "ring",
  "rule",
] as const;
export type ProfessionalDecorationComponentName =
  (typeof PROFESSIONAL_DECORATION_COMPONENTS)[number];

/** Which shape variants belong to which family — the DISJOINT lists, declared once here and
 *  consumed by each family's `index.ts`, so the enum a component validates against and the list
 *  documented here can't drift. Tripwires in registry.test.ts assert the lists stay disjoint
 *  (within professional AND against block/future/capsule) and that every name draws a distinct
 *  shape. */
export const PROFESSIONAL_DECORATION_VARIANTS = {
  panel: ["wedge", "slice", "flank"],
  grille: ["matrix", "scatter", "stack"],
  ring: ["halo", "target", "contour"],
  rule: ["hairline", "notch", "ladder"],
} as const satisfies Record<ProfessionalDecorationComponentName, readonly string[]>;

// Each shape is authored in a square 0..100 viewBox so the box scales uniformly and the outline
// stays a true SVG stroke. A shape receives the accent as a solid role var (`color`), a faint
// tint of the same role (`tint`, a color-mix — never a literal), and the viewBox-unit stroke
// width (`sw`) that renders at the constant STROKE_REM. The `opacity` attributes are the per-mark
// restraint (a numeric attribute, not a colour), so the marks sit as quiet chrome behind content.
type ShapeAttrs = { color: string; tint: string; sw: string };
type ShapeFn = (a: ShapeAttrs) => string;

const dot = (cx: number, cy: number, r: number, color: string, op: number): string =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${op}"></circle>`;

const SHAPES: Record<string, ShapeFn> = {
  // panel — diagonal accent panels (the showcase's `.deco` clip-path): a faint cobalt tint fill
  // edged by a slightly stronger hairline, so the plane reads as a soft field, never a block.
  wedge: (a) =>
    `<polygon points="100,0 100,100 0,100" fill="${a.tint}" stroke="${a.color}" stroke-width="${a.sw}" stroke-opacity="0.35" stroke-linejoin="round"></polygon>`,
  slice: (a) =>
    `<polygon points="34,0 100,0 66,100 0,100" fill="${a.tint}" stroke="${a.color}" stroke-width="${a.sw}" stroke-opacity="0.35" stroke-linejoin="round"></polygon>`,
  flank: (a) =>
    `<polygon points="46,0 100,0 100,100 54,100" fill="${a.tint}" stroke="${a.color}" stroke-width="${a.sw}" stroke-opacity="0.35" stroke-linejoin="round"></polygon>`,

  // grille — cobalt dot fields (the showcase's `.dots`): filled discs, quietly translucent.
  matrix: (a) =>
    [20, 50, 80]
      .flatMap((cx) => [20, 50, 80].map((cy) => dot(cx, cy, 6, a.color, 0.4)))
      .join(""),
  scatter: (a) =>
    dot(22, 26, 6, a.color, 0.45) +
    dot(58, 16, 4.5, a.color, 0.3) +
    dot(80, 38, 6.5, a.color, 0.4) +
    dot(38, 58, 5, a.color, 0.35) +
    dot(72, 74, 6, a.color, 0.45) +
    dot(24, 84, 4.5, a.color, 0.3),
  stack: (a) =>
    [14, 32, 50, 68, 86].map((cy) => dot(50, cy, 6, a.color, 0.42)).join(""),

  // ring — concentric rings (the showcase's `.rings`): hairline strokes, no fill.
  halo: (a) =>
    `<circle cx="50" cy="50" r="46" fill="none" stroke="${a.color}" stroke-width="${a.sw}" opacity="0.5"></circle>` +
    `<circle cx="50" cy="50" r="30" fill="none" stroke="${a.color}" stroke-width="${a.sw}" opacity="0.5"></circle>`,
  target: (a) =>
    `<circle cx="50" cy="50" r="46" fill="none" stroke="${a.color}" stroke-width="${a.sw}" opacity="0.5"></circle>` +
    `<circle cx="50" cy="50" r="32" fill="none" stroke="${a.color}" stroke-width="${a.sw}" opacity="0.5"></circle>` +
    `<circle cx="50" cy="50" r="18" fill="none" stroke="${a.color}" stroke-width="${a.sw}" opacity="0.5"></circle>`,
  contour: (a) =>
    `<circle cx="50" cy="50" r="44" fill="none" stroke="${a.color}" stroke-width="${a.sw}" opacity="0.5"></circle>` +
    dot(50, 50, 7, a.color, 0.5),

  // rule — thin accent lines (the showcase's `.aline`): round-capped hairline strokes.
  hairline: (a) =>
    `<line x1="4" y1="50" x2="96" y2="50" stroke="${a.color}" stroke-width="${a.sw}" stroke-linecap="round" opacity="0.7"></line>`,
  notch: (a) =>
    `<path d="M12 88 L12 30 L70 30" fill="none" stroke="${a.color}" stroke-width="${a.sw}" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"></path>`,
  ladder: (a) =>
    [30, 50, 70]
      .map(
        (cy) =>
          `<line x1="14" y1="${cy}" x2="86" y2="${cy}" stroke="${a.color}" stroke-width="${a.sw}" stroke-linecap="round" opacity="0.6"></line>`,
      )
      .join(""),
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

/** Inline SVG for a variant — a hairline stroke (and, for panels, a faint tint fill) in the
 *  instance accent, in a square 0..100 viewBox. stroke-width is chosen in viewBox units so it
 *  RENDERS at the constant STROKE_REM at any size: rendered = strokeWidth × (size×1.2 / 100) =
 *  STROKE_REM (the box is size×1.2 rem square). */
const professionalDecoSvg = (p: DecoParams): string => {
  const shape = SHAPES[p.variant] ?? SHAPES.wedge!;
  const color = `var(--${p.accent})`;
  const tint = `color-mix(in srgb, var(--${p.accent}) 10%, transparent)`;
  const sw = ((STROKE_REM * 100) / (p.size * 1.2)).toFixed(3);
  return (
    `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">` +
    shape({ color, tint, sw }) +
    `</svg>`
  );
};

/** Build one professional decoration component: a hairline shape family (its own `variant` enum)
 *  over the shared placement props + stroke engine. Flagged `decoration: true`.
 *
 *  The family NAME is the only key a caller passes — its variant list is looked up from
 *  PROFESSIONAL_DECORATION_VARIANTS here, so a family can't be wired to another's shapes, and
 *  `example.variant` is typed to that family's own list. `sizeDefault` differs per family — a
 *  panel wants area, a rule barely any — but the accent default is always `primary` (cobalt),
 *  the single accent every professional mark shares. */
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
      accentDescription: "Stroke / tint colour — a palette role of the active theme",
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
