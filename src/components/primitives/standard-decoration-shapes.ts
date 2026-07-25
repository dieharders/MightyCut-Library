// Standard's decoration engine — the museum-catalog counterpart to block's neobrutalist solids,
// future's luminous strokes, capsule's candy fills, professional's cobalt line-art and creative's
// zine collage. Standard's marks are COMPASS-DRAFTED GEOMETRY: concentric rings (solid + dashed),
// open compass arcs, ruled hairlines, and translucent tracing-paper planes — every one drawn at
// the theme's single 1px-class hairline weight, in stone, and casting NO shadow (standard's rule
// is "no shadows, no elevated cards, circles only"). Ported from the reference's `.geo-ring`,
// `.ha` accent rule and tracing-paper card (video-assets/themes/standard/frame.css).
//
// WHY THIS ISN'T PROFESSIONAL'S ENGINE. Professional also draws quiet line-art, so the boundary
// has to be real rather than nominal, and it is drawn on three axes:
//   • WEIGHT — professional's stroke is 0.1875rem (a drawn line); standard's is 0.125rem, the
//     grid floor, because "the hairline IS the identity" and every rule in the theme is that one
//     weight. Standard also owns a DASH rhythm (the compass ring's dashed inner) that no other
//     engine has, computed in rem so the dash length is constant at every `size`.
//   • FORM — professional's vocabulary is concentric circles / concentric squares / corner marks
//     / dot fields. Standard's is the drafting instrument: a ring PAIR, an OPEN arc, a ruled
//     line, and a translucent PLANE. Only the ring family is a near-neighbour, and standard's
//     answers it with the reference's own solid-outer/dashed-inner pair.
//   • FILL — professional never fills (dots aside). `vellum` is standard's one filled family, and
//     what it fills with is the theme's signature "tracing paper": var(--light) at 30%, which
//     lets the stone canvas read straight through it.
//
// STANDARD-ONLY by ROSTER, not by token: they paint with the shared 10 palette roles, so nothing
// in the markup is standard-specific. `decoration: true` holds every family out of the showcase
// Components grid under ANY theme, and only standardTheme.decorations lists them.
//
// CONSTANT INK, like every sibling engine: the stroke weight (and the dash rhythm) is FIXED and
// does NOT scale with `size`, so a 40%-wide compass ring keeps exactly the same crisp edge as a
// small one — computed per-shape in viewBox units (see standardDecoSvg). The one thing that DOES
// scale is the box, which is the whole point of a drafted mark.
import { component } from "../runtime/component";
import { remGrid } from "../runtime/css";
import { decorationSchema, type DecoParams } from "./decoration-placement";

/** THE hairline — the single weight every rule, border and ring in standard is drawn at, and the
 *  grid floor (0.125rem = 2px at the 1920 design size). Stated once here so a decoration's edge
 *  is the same object as a card's border. */
const HAIRLINE_REM = 0.125;

/** The one heavier rule standard allows — the reference's `.ha` ink accent bar under a closing
 *  headline (`height: 0.12cqw`). 3× the hairline, still constant-ink. */
const RULE_REM = 0.375;

/** The dash rhythm of the compass ring's inner circle, in rem: dash then gap. Constant at every
 *  size for the same reason the stroke is — a ring that re-rhythms as it grows reads as a
 *  different object rather than a bigger one. */
const DASH_REM = 1;
const GAP_REM = 0.75;

// The four standard decoration component names (the showcase + standardTheme reference these).
export const STANDARD_DECORATION_COMPONENTS = [
  "compass",
  "sweep",
  "hairline",
  "vellum",
] as const;
export type StandardDecorationComponentName =
  (typeof STANDARD_DECORATION_COMPONENTS)[number];

/** Which shape variants belong to which family — the DISJOINT lists, declared once here and
 *  consumed by each family's `index.ts`, so the enum a component validates against and the list
 *  documented here can't drift. Tripwires in registry.test.ts assert the NAMES stay disjoint
 *  (within standard AND against block/future/capsule/professional/creative) and that every one
 *  draws a DISTINCT shape; that every name actually HAS a drawing is enforced by the type below. */
export const STANDARD_DECORATION_VARIANTS = {
  compass: ["dial", "lens", "eclipse"],
  sweep: ["quadrant", "crescent", "bow"],
  hairline: ["axis", "ladder", "margin"],
  vellum: ["sheet", "band", "folio"],
} as const satisfies Record<StandardDecorationComponentName, readonly string[]>;

/** Every standard shape name, flattened — the key type `SHAPES` is checked against, so a variant
 *  listed above with no drawing (or a typo'd SHAPES key) is a COMPILE error rather than a silent
 *  fall back to `dial` at render time. Same discipline professional's and creative's engines draw. */
export type StandardDecorationVariant =
  (typeof STANDARD_DECORATION_VARIANTS)[StandardDecorationComponentName][number];

// ------------------------------------------------------------------- shape geometry ---
// Shapes are authored in a 0..100 WIDE viewBox whose HEIGHT is 100 × the shape's `h` ratio, so the
// element box and the viewBox always share an aspect and the SVG scales UNIFORMLY on both axes —
// which is what keeps the constant-ink maths a one-liner even for the wide-and-short rule bands
// (`hairline`) and the landscape planes (`vellum`).

/** Trim a computed coordinate to 2dp — path data, not a design token, so it is not on the rem
 *  grid (the rem grid governs the element box; the viewBox is unitless). */
const n2 = (n: number): string => `${Math.round(n * 100) / 100}`;

/** A point on a circle centred in a SQUARE (100×100) viewBox. Angles in degrees, 0 = due right,
 *  increasing clockwise on screen (SVG's y runs down). */
const at = (r: number, deg: number): [number, number] => {
  const t = (deg * Math.PI) / 180;
  return [50 + r * Math.cos(t), 50 + r * Math.sin(t)];
};

/** An OPEN arc of radius `r` from `from`° to `to`° — the compass sweep. Open on purpose: a closed
 *  circle is the `compass` family's job, and the whole point of `sweep` is the instrument's
 *  unfinished stroke. */
const arc = (r: number, from: number, to: number): string => {
  const [sx, sy] = at(r, from);
  const [ex, ey] = at(r, to);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `M${n2(sx)} ${n2(sy)} A${r} ${r} 0 ${large} 1 ${n2(ex)} ${n2(ey)}`;
};

// Every shape receives a ready-made attribute set rather than raw colours, so the constant-ink
// maths lives in ONE place (standardDecoSvg):
//   `line`   the hairline stroke — the theme's one weight, hollow. The default standard mark.
//   `rule`   the same stroke at the heavier accent-rule weight (the reference's `.ha`).
//   `dash`   the hairline stroke, dashed at a constant rem rhythm — the compass ring's inner.
//   `paper`  the tracing-paper fill (var(--light) at 30%) under a hairline edge — `vellum` only.
type ShapeAttrs = { line: string; rule: string; dash: string; paper: string };
type ShapeFn = (a: ShapeAttrs) => string;
/** A shape is its drawing plus an optional HEIGHT RATIO: the element box is `size×1.2` rem wide
 *  and `size×1.2×h` rem tall, and the viewBox matches. Omitted ⇒ 1, a square box. Standard needs
 *  it because `hairline` is a wide-and-short RULE band and `vellum`'s planes are landscape. */
type ShapeSpec = { draw: ShapeFn; h?: number };

const SHAPES: Record<StandardDecorationVariant, ShapeSpec> = {
  // compass — the drafted RING PAIR. `dial` is the reference's own `.geo-ring` verbatim: a solid
  // outer circle with a dashed inner at 70% of its radius (the showcase's `inset: 15%`), which is
  // the single most recognisable mark in the theme.
  dial: {
    draw: (a) =>
      `<circle cx="50" cy="50" r="46" ${a.line}></circle>` +
      `<circle cx="50" cy="50" r="32" ${a.dash}></circle>`,
  },
  lens: {
    draw: (a) =>
      `<circle cx="50" cy="50" r="46" ${a.line}></circle>` +
      `<circle cx="50" cy="50" r="24" ${a.line}></circle>`,
  },
  // The one place a compass mark is allowed a FILL: a small disc reading as the instrument's
  // pivot point, at a low opacity so it stays chrome rather than becoming a dot.
  eclipse: {
    draw: (a) =>
      `<circle cx="50" cy="50" r="46" ${a.line}></circle>` +
      `<circle cx="50" cy="50" r="15" ${a.paper}></circle>`,
  },

  // sweep — the OPEN arc, the stroke a compass actually leaves. Three lengths of the same gesture:
  // a quarter, a half, and a nested pair (the instrument's bow).
  quadrant: { draw: (a) => `<path d="${arc(46, -90, 0)}" ${a.line}></path>` },
  crescent: { draw: (a) => `<path d="${arc(46, -90, 90)}" ${a.line}></path>` },
  bow: {
    draw: (a) =>
      `<path d="${arc(46, -120, 30)}" ${a.line}></path>` +
      `<path d="${arc(32, -120, 30)}" ${a.line}></path>`,
  },

  // hairline — the ruled MARK: straight lines at the theme's one weight. Wide-and-short boxes,
  // because a rule is a proportion, not a square.
  // `axis` is the drafting cross — a full-width baseline with a vertical raised on it.
  axis: {
    h: 0.5,
    draw: (a) =>
      `<path d="M0 38 L100 38" ${a.line}></path><path d="M50 0 L50 50" ${a.line}></path>`,
  },
  // A ruled LADDER of five hairlines, each shorter than the last — the catalogue's ranged index.
  ladder: {
    h: 0.5,
    draw: (a) =>
      [
        [4, 100],
        [14, 84],
        [24, 68],
        [34, 52],
        [44, 36],
      ]
        .map(([y, w]) => `<path d="M0 ${y} L${w} ${y}" ${a.line}></path>`)
        .join(""),
  },
  // The reference's `.ha` — the ONE heavier rule the theme allows, under a closing headline.
  // Drawn at RULE_REM over a full-width hairline so the pair reads as "the rule and its margin".
  margin: {
    h: 0.125,
    draw: (a) =>
      `<path d="M0 4 L64 4" ${a.rule}></path><path d="M0 10 L100 10" ${a.line}></path>`,
  },

  // vellum — the TRACING-PAPER plane: standard's one filled mark. A 30%-white wash under a
  // hairline edge, so the stone canvas reads straight through it exactly as it does through a
  // feature card. This is the family that keeps the set from collapsing into "more line-art".
  sheet: {
    draw: (a) => `<rect x="3" y="3" width="94" height="94" ${a.paper}></rect>`,
  },
  band: {
    h: 0.375,
    draw: (a) =>
      `<rect x="0" y="3" width="100" height="31.5" ${a.paper}></rect>`,
  },
  // The turned page: a plane with its top-right corner cut away — the catalogue's folio mark.
  folio: {
    h: 0.75,
    draw: (a) =>
      `<path d="M3 3 L72 3 L97 28 L97 72 L3 72 Z" ${a.paper}></path>` +
      `<path d="M72 3 L72 28 L97 28" ${a.line}></path>`,
  },
};

/** The shared, var-driven standard decoration element (one `.sd-deco`, styled entirely by inline
 *  custom properties from standardDecorationLayout). Transparent box — the SVG carries the
 *  hairline and the tracing-paper wash — and there is NO shadow layer at all, because standard's
 *  design rules ban shadows outright (as professional's do).
 *
 *  EVERY ENGINE OWNS ITS OWN CLASS + VAR NAMESPACE, and that is load-bearing rather than tidy:
 *  `.deco`/`--d-*` (block) · `.fx-deco`/`--fd-*` (future) · `.cd-deco`/`--cd-*` (capsule) ·
 *  `.pd-deco`/`--pd-*` (professional) · `.cr-deco`/`--cr-*` (creative) · `.sd-deco`/`--sd-*`
 *  (here). scopeCss prefixes each scene's CSS with its own `.<compId>-root`, so two THEMES never
 *  collide — but two ENGINES inside ONE scene would, and `addDecorations()` takes any registered
 *  component, so a treatment CAN be handed a capsule blob and a standard compass together. Keep
 *  the prefix unique when adding an engine. */
export const SD_DECO_TEMPLATE = `<div class="sd-deco" data-anim="item"><i class="sd-deco-shape" data-html="shape"></i></div>`;
export const SD_DECO_CSS = `.sd-deco {
  position: absolute;
  left: var(--sd-x, 50%);
  top: var(--sd-y, 50%);
  width: var(--sd-w, 24.5rem);
  height: var(--sd-h, 24.5rem);
  transform: translate(-50%, -50%) rotate(var(--sd-rot, 0deg));
  z-index: var(--sd-z, 1);
  pointer-events: none;
}
.sd-deco-shape { position: absolute; inset: 0; }
.sd-deco-shape svg { display: block; width: 100%; height: 100%; overflow: visible; }`;

/** Look up a variant's spec, widening the read (`p.variant` is a plain string on the shared
 *  DecoParams). The MAP itself stays exhaustively typed, which is where drift would happen. */
const specOf = (variant: string): ShapeSpec =>
  (SHAPES as Record<string, ShapeSpec | undefined>)[variant] ?? SHAPES.dial;

const standardDecorationLayout = (p: DecoParams): Record<string, string> => {
  const spec = specOf(p.variant);
  return {
    "--sd-x": `${p.x}%`,
    "--sd-y": `${p.y}%`,
    "--sd-w": remGrid(p.size * 1.2),
    // Non-square shapes (the rule bands, the planes) take the ratio; the viewBox below takes the
    // SAME ratio, so the box and the drawing stay in step at every size.
    "--sd-h": remGrid(p.size * (spec.h ?? 1) * 1.2),
    "--sd-rot": `${p.rotate}deg`,
    "--sd-z": p.layer === "front" ? "5" : "1",
  };
};

/** Inline SVG for a variant — a hairline drawing (plus, for `vellum`, a tracing-paper wash) in the
 *  instance accent.
 *
 *  CONSTANT INK, including for the non-square shapes. The viewBox is `0 0 100 (100×h)` and the box
 *  is `size×1.2` by `size×1.2×h` rem, so the SVG's scale factor is `size×1.2 / 100` on BOTH axes
 *  whatever `h` is — the shape never gets squashed and a stroke never gets thicker in one
 *  direction. That is why the stroke width (and the dash rhythm) is a single multiply with no `h`
 *  term: rendered = strokeWidth × (size×1.2 / 100) = HAIRLINE_REM. `preserveAspectRatio="none"` on
 *  the non-square shapes only absorbs the sub-0.125rem drift the rem grid introduces when width
 *  and height quantize independently; the square shapes keep `meet` so a ring is never an ellipse.
 *
 *  The marks sit at fractional OPACITY (a numeric attribute, never a colour), which is the
 *  reference's own instruction: "layer one or two compass rings at 20–50% behind content". */
const standardDecoSvg = (p: DecoParams): string => {
  const spec = specOf(p.variant);
  const h = spec.h ?? 1;
  const color = `var(--${p.accent})`;
  const scale = 100 / (p.size * 1.2);
  const sw = (HAIRLINE_REM * scale).toFixed(3);
  const stroke = `fill="none" stroke="${color}" stroke-linecap="butt" stroke-linejoin="miter"`;
  const a: ShapeAttrs = {
    line: `${stroke} stroke-width="${sw}" opacity="0.5"`,
    rule: `${stroke} stroke-width="${(RULE_REM * scale).toFixed(3)}" opacity="0.85"`,
    dash: `${stroke} stroke-width="${sw}" stroke-dasharray="${(DASH_REM * scale).toFixed(3)} ${(
      GAP_REM * scale
    ).toFixed(3)}" opacity="0.45"`,
    // The tracing paper: a 30% white wash carrying the same hairline edge as every card in the
    // theme. Derived from a palette role with color-mix, never a literal.
    paper: `fill="color-mix(in srgb, var(--light) 30%, transparent)" stroke="${color}" stroke-width="${sw}" opacity="0.65"`,
  };
  const par = h === 1 ? "xMidYMid meet" : "none";
  return (
    `<svg viewBox="0 0 100 ${n2(100 * h)}" preserveAspectRatio="${par}" xmlns="http://www.w3.org/2000/svg">` +
    spec.draw(a) +
    `</svg>`
  );
};

/** Build one standard decoration component: a compass-drafted family (its own `variant` enum) over
 *  the shared placement props + the hairline engine. Flagged `decoration: true`.
 *
 *  The family NAME is the only key a caller passes — its variant list is looked up from
 *  STANDARD_DECORATION_VARIANTS here, so a family can't be wired to another's shapes, and
 *  `example.variant` is typed to that family's own list. `sizeDefault` differs per family (a ruled
 *  band needs far more width than a plane to read as a rule), and the accent default comes from
 *  the family's own `example` so the four carry distinct signature tints — compass/vellum the
 *  Line, sweep the Brownstone, hairline the Ink — rather than collapsing onto one stone. */
export const standardDecorationComponent = <
  N extends StandardDecorationComponentName,
>(
  name: N,
  sizeDefault: number,
  example: DecoParams & {
    variant: (typeof STANDARD_DECORATION_VARIANTS)[N][number];
  },
) => {
  const variants: readonly string[] = STANDARD_DECORATION_VARIANTS[name];
  return component({
    name,
    // Intrinsic decoration — held out of the showcase Components grid under any theme.
    decoration: true,
    schema: decorationSchema({
      variants,
      sizeDefault,
      accentDefault: example.accent,
      accentDescription:
        "Hairline / wash colour — a palette role of the active theme",
    }),
    template: SD_DECO_TEMPLATE,
    css: SD_DECO_CSS,
    example,
    // Every standard variant is inline SVG (the hairline has to be a stroke to stay constant
    // across sizes), so the data-html slot is always filled.
    rawFill: (p) => ({ shape: standardDecoSvg(p) }),
    layout: standardDecorationLayout,
    // A quiet fade IS the entrance (an assigned animIn REPLACES it). Block scales, capsule scales
    // gently, creative pops; standard's whole mood is restraint, so a drafted mark is simply
    // already there — it never arrives with weight.
    animIn: "fade",
  });
};
