// Standard's decoration engine — the museum-catalog counterpart to block's neobrutalist solids,
// future's luminous strokes, capsule's candy fills, professional's cobalt line-art and creative's
// zine collage. Standard's marks are THE DRAFTING TABLE AND THE TYPE CASE: concentric rings
// (solid + dashed), open compass arcs, radial bearings, and single punctuation SORTS set enormous
// in the theme's own display face. Everything drawn is at the theme's single 1px-class hairline
// weight, in stone, and nothing casts a shadow (standard's rule is "no shadows, no elevated cards,
// circles only"). Ported from the reference's `.geo-ring`, `.ha` accent rule and its display-scale
// Playfair quote mark (video-assets/themes/standard/frame.css).
//
// THE FOUR FAMILIES ARE ONE PAGE, ANSWERED FOUR WAYS, and the split is formal rather than thematic
// so no two ever read as the same mark: `compass` CLOSES a curve, `sweep` leaves one OPEN,
// `azimuth` strikes STRAIGHT radii, and `sorts` SETS a character. Curve-closed, curve-open,
// straight, and type — a set that stays legible at any size because the distinction is in the kind
// of object, not in a detail you have to be close enough to see.
//
// WHY THIS ISN'T PROFESSIONAL'S ENGINE. Professional also draws quiet line-art, so the boundary
// has to be real rather than nominal, and it is drawn on three axes:
//   • WEIGHT — professional's stroke is 0.1875rem (a drawn line); standard's is 0.125rem, the
//     grid floor, because "the hairline IS the identity" and every rule in the theme is that one
//     weight. Standard also owns a DASH rhythm (the compass ring's dashed inner) that no other
//     engine has, computed in rem so the dash length is constant at every `size`.
//   • FORM — professional's vocabulary is concentric circles / concentric squares / corner marks
//     / dot fields. Standard's is the taxonomy above. Only the ring family is a near-neighbour,
//     and standard's answers it with the reference's own solid-outer/dashed-inner pair.
//   • MEDIUM — professional's marks are all drawings. `sorts` is not a drawing of anything: it is
//     a real glyph of Playfair Display, which no other decoration engine in the library does. On a
//     theme with no colour, no fill and one line weight, the typography is most of what there is
//     to spend, and the reference already spends it this way behind its pull quote.
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
 *  headline (`height: 0.12cqw`). 3× the hairline, still constant-ink. In this engine it is spent
 *  ONLY on the cardinals of an `azimuth` mark: a radial figure whose strokes are all one weight
 *  has no orientation, and the cardinals are what turn sixteen equal ticks into a bearing. */
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
  "azimuth",
  "sorts",
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
  azimuth: ["rose", "fan", "pivot"],
  sorts: ["query", "semicolon", "brace", "quotation"],
} as const satisfies Record<StandardDecorationComponentName, readonly string[]>;

/** Every standard shape name, flattened — the key type `SHAPES` is checked against, so a variant
 *  listed above with no drawing (or a typo'd SHAPES key) is a COMPILE error rather than a silent
 *  fall back to `dial` at render time. Same discipline professional's and creative's engines draw. */
export type StandardDecorationVariant =
  (typeof STANDARD_DECORATION_VARIANTS)[StandardDecorationComponentName][number];

// ------------------------------------------------------------------- shape geometry ---
// Shapes are authored in a 0..100 WIDE viewBox whose HEIGHT is 100 × the shape's `h` ratio, so the
// element box and the viewBox always share an aspect and the SVG scales UNIFORMLY on both axes —
// which is what keeps the constant-ink maths a one-liner. Every family here happens to be square
// today; the ratio stays because a mark that wants to be wide is one path edit away, and dropping
// it would make that edit a refactor.

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

/** A RADIUS drawn between two distances from the centre of a square viewBox — the `azimuth`
 *  family's whole vocabulary. `r0 > 0` leaves the hub open, which is what stops a radial mark
 *  reading as a filled star. */
const spoke = (r0: number, r1: number, deg: number): string => {
  const [x0, y0] = at(r0, deg);
  const [x1, y1] = at(r1, deg);
  return `M${n2(x0)} ${n2(y0)} L${n2(x1)} ${n2(y1)}`;
};

/** A RAY from an arbitrary pivot — the protractor swing `fan` is built from, which cannot use
 *  `spoke` because its origin is a corner rather than the centre. */
const ray = (px: number, py: number, len: number, deg: number): string => {
  const t = (deg * Math.PI) / 180;
  return `M${n2(px)} ${n2(py)} L${n2(px + len * Math.cos(t))} ${n2(py + len * Math.sin(t))}`;
};

// Every shape receives a ready-made attribute set rather than raw colours, so the constant-ink
// maths lives in ONE place (standardDecoSvg):
//   `line`   the hairline stroke — the theme's one weight, hollow. The default standard mark.
//   `rule`   the same stroke at the heavier accent-rule weight (the reference's `.ha`).
//   `dash`   the hairline stroke, dashed at a constant rem rhythm — the compass ring's inner.
//   `paper`  a low-opacity FILL of the accent — the compass pivot's disc.
type ShapeAttrs = { line: string; rule: string; dash: string; paper: string };
type ShapeFn = (a: ShapeAttrs) => string;

/** A DRAWN mark — geometry, plus an optional HEIGHT RATIO: the element box is `size×1.2` rem wide
 *  and `size×1.2×h` rem tall, and the viewBox matches. Omitted ⇒ 1, a square box, which every
 *  radial mark needs since a squashed rose is a rose no longer. */
type DrawnShape = { draw: ShapeFn; h?: number };

/** A SET mark — a real character from the theme's display face, not a drawing of one. See the
 *  `sorts` block in SHAPES for why the family exists.
 *
 *  THE TWO NUMBERS ARE MEASURED, NOT CHOSEN, and they have to be, because nothing about where a
 *  glyph's INK sits can be inferred from its font-size. Punctuation is the worst case of this: a
 *  quotation mark's ink is entirely ABOVE the baseline and barely a quarter of the em tall, a brace
 *  is nearly the whole em, a semicolon straddles the baseline. Setting four such glyphs at one size
 *  and one baseline gives four marks of wildly different weight, none of them centred.
 *
 *    `em` — font-size as a multiple of the box width. Chosen so the glyph's LARGER ink dimension
 *           is FIT_UNITS, which both equalises the four optically and guarantees none overflows.
 *    `dy` — the ALPHABETIC BASELINE, in viewBox units from the box centre (positive = down), placed
 *           so the ink box straddles the centre. Values run from ~23 to ~146 precisely because the
 *           ink-to-baseline relationship is per-glyph.
 *
 *  Both come from `ctx.measureText(char).actualBoundingBox*` on Playfair at a known size — the ink
 *  extents, which is the one thing SVG's own `getBBox()` will not give you for text (it returns the
 *  line box, identical for every character). Re-measure rather than eyeball if a sort is added:
 *      em = FIT / max(inkH, inkW)        dy = em × (ascent − descent) / 2
 *  where ascent/descent/inkH/inkW are per font-size 1, and descent is NEGATIVE for a glyph whose
 *  ink never reaches the baseline (which is exactly how the quotation mark lands correctly).
 *
 *  No `dx`: measurement puts all four within half a unit of the advance's centre, so `text-anchor:
 *  middle` alone centres them horizontally. Nor `dominant-baseline` — its `central` value centres
 *  the EM BOX, which is the thing that isn't where the ink is; the default alphabetic baseline plus
 *  a measured `dy` is fully determined by numbers in this file. */
type GlyphShape = { char: string; em: number; dy: number };

type ShapeSpec = DrawnShape | GlyphShape;

/** Narrow the union. `in` rather than a `kind` tag: the discriminant is the payload itself, so a
 *  spec can't claim to be a glyph without carrying one. */
const isGlyph = (s: ShapeSpec): s is GlyphShape => "char" in s;

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

  // azimuth — the RADIAL mark: bearings struck out from a pivot. This is the family that answers
  // "where does the instrument point", where `compass` answers "what did it close" and `sweep`
  // "what did it draw". Every variant is straight radii and nothing else — no circle is closed
  // here, which is what keeps the three families legible as three.
  //
  // It replaces an earlier family of plain ruled lines (a cross, a stepped ladder, a rule + its
  // margin). Those were faithful to a drafting sheet and dead on the page: at decoration scale two
  // or three lone strokes read as a stray mark rather than as a drawn object, and the showcase tile
  // showed it plainly. A radial mark carries structure at every size because its own repetition IS
  // the structure — which is the thing a monochrome theme with no fills has to spend instead.
  //
  // The four CARDINALS are drawn at RULE_REM, the theme's one heavier weight (the reference's `.ha`
  // accent rule). That hierarchy is the whole reason a rose reads as an instrument rather than as a
  // starburst: without it the sixteen marks are equal and the eye finds no orientation.
  rose: {
    draw: (a) =>
      // 4 cardinals, long and heavy, struck from an open hub…
      [0, 90, 180, 270].map((d) => `<path d="${spoke(6, 47, d)}" ${a.rule}></path>`).join("") +
      // …4 ordinals at two-thirds their reach…
      [45, 135, 225, 315].map((d) => `<path d="${spoke(6, 33, d)}" ${a.line}></path>`).join("") +
      // …and 8 outer graduations that never reach the hub, so the rose has a RIM as well as a core.
      // They start at 36 — clear of where the ordinals stop at 33 — because a tick that begins
      // level with a longer ray beside it reads as part of that ray rather than as a graduation.
      [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5]
        .map((d) => `<path d="${spoke(36, 46, d)}" ${a.line}></path>`)
        .join(""),
  },
  // The protractor swing: nine bearings fanned through a quarter-turn from a CORNER pivot, with the
  // 45° bisector drawn heavy. Asymmetric and cornered on purpose — set beside the centred, radially
  // symmetric `rose`, the two never read as the same mark at a glance.
  fan: {
    draw: (a) =>
      Array.from({ length: 9 }, (_, i) => {
        const deg = -i * 11.25; // 0° (due right) up to −90° (due up); SVG's y runs down
        return `<path d="${ray(4, 96, 88, deg)}" ${i === 4 ? a.rule : a.line}></path>`;
      }).join(""),
  },
  // The graduated dial FACE, drawn without its dial: twenty-four ticks on a rim that is implied
  // rather than struck, with the four cardinals reaching further in and out. `compass` owns the
  // circles in this theme, so this one deliberately does not close one — the ring is left for the
  // eye to complete, which is also what lets a pivot sit UNDER a compass without doubling its edge.
  pivot: {
    draw: (a) =>
      Array.from({ length: 24 }, (_, i) => {
        const deg = i * 15;
        return deg % 90 === 0
          ? `<path d="${spoke(24, 46, deg)}" ${a.rule}></path>`
          : `<path d="${spoke(31, 42, deg)}" ${a.line}></path>`;
      }).join(""),
  },

  // sorts — a SORT is a single piece of type in a compositor's case, and that is literally what
  // these are: one character of Playfair Display, set enormous and hung behind the content as a
  // watermark. Nothing here is drawn. The other three families draw the instrument that ruled the
  // page; this one is a piece of the page itself.
  //
  // WHY THE FAMILY IS TYPE RATHER THAN GEOMETRY. Standard has no colour, no shadow, no fill and one
  // line weight, so almost everything it can say it has to say with the two faces it loads — and
  // the reference already reaches for exactly this move, hanging a display-scale Playfair quotation
  // mark behind its pull quote (`.qm`, ported to quote.css as a pseudo-element). A punctuation mark
  // at 30% of the frame is the most on-theme ornament this deck has, and it is the only decoration
  // in the library that IS the theme's typography rather than a shape that happens to sit beside
  // it. It replaces an earlier family of tracing-paper planes, which were competent and said
  // nothing a feature card doesn't already say.
  //
  // Playfair is a DIDONE: hairline-to-stem contrast, ball terminals, a vertical axis. Blown up to
  // watermark scale those become the drawing — which is why these read as ornament rather than as
  // text left on the page by accident, and why the family would not work in the theme's other face.
  //
  // Four sorts, chosen because each is a different KIND of mark rather than four of one kind: a
  // question (an interrogative), a semicolon (a joint), a brace (an enclosure) and a quotation (an
  // attribution). Every `em`/`dy` pair below is MEASURED from Playfair's own ink extents — see
  // `GlyphShape` for the formula and for why they cannot be guessed.
  query: { char: "?", em: 0.9788, dy: 37.47 },
  semicolon: { char: ";", em: 1.1609, dy: 22.67 },
  brace: { char: "{", em: 0.8052, dy: 23.9 },
  // The left DOUBLE QUOTATION MARK (U+201C) — the reference's own `.qm`, at page scale, and the
  // extreme case the measured approach exists for: its ink is a quarter of the em tall, sits
  // ENTIRELY above the baseline, and is wider than it is tall — so it takes by far the largest
  // font-size of the four, is fitted on its WIDTH rather than its height, and hangs its baseline
  // most of a box below the centre.
  quotation: { char: "“", em: 2.3771, dy: 143.0 },
};

/** The shared, var-driven standard decoration element (one `.sd-deco`, styled entirely by inline
 *  custom properties from standardDecorationLayout). Transparent box — the SVG carries the
 *  hairline, or the set character — and there is NO shadow layer at all, because standard's design
 *  rules ban shadows outright (as professional's do).
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
    // A non-square shape takes its ratio; the viewBox below takes the SAME ratio, so the box and
    // the drawing stay in step at every size. A `sorts` glyph is always square (its box is only an
    // anchor — the character overflows it freely, see SD_DECO_CSS).
    "--sd-h": remGrid(p.size * (isGlyph(spec) ? 1 : (spec.h ?? 1)) * 1.2),
    "--sd-rot": `${p.rotate}deg`,
    "--sd-z": p.layer === "front" ? "5" : "1",
  };
};

/** Inline SVG for a variant — a hairline drawing, or a set character, in the instance accent.
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
 *  reference's own instruction: "layer one or two compass rings at 20–50% behind content".
 *
 *  A `sorts` GLYPH takes the other branch, and constant ink does not apply to it: a letterform is
 *  not a stroked drawing, so its whole outline — hairlines, stems and all — scales with the box,
 *  exactly as type is supposed to. That is a real difference from the three drawn families and it
 *  is correct: shrink a compass and its edge must stay crisp, shrink a semicolon and it must become
 *  a smaller semicolon. Because the viewBox unit IS one hundredth of the box width, a font-size of
 *  `em × 100` viewBox units renders at `em ×` the box width with no further arithmetic. */
const standardDecoSvg = (p: DecoParams): string => {
  const spec = specOf(p.variant);
  const color = `var(--${p.accent})`;

  if (isGlyph(spec)) {
    // `font-family` goes in a STYLE attribute, not a presentation attribute: --disp is a custom
    // property, and var() substitution is only reliably supported in a declaration. `y` is the
    // ALPHABETIC baseline (SVG's default), placed by the measured `dy` — see GlyphShape. Escaping
    // the character is unnecessary (none of the four is markup-significant); the fill and the
    // opacity still follow the engine's rules — a role, and a number.
    return (
      `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">` +
      `<text x="50" y="${n2(50 + spec.dy)}" text-anchor="middle" ` +
      `style="font-family: var(--disp)" font-size="${n2(spec.em * 100)}" fill="${color}" opacity="0.5">` +
      spec.char +
      `</text></svg>`
    );
  }

  const h = spec.h ?? 1;
  const scale = 100 / (p.size * 1.2);
  const sw = (HAIRLINE_REM * scale).toFixed(3);
  const stroke = `fill="none" stroke="${color}" stroke-linecap="butt" stroke-linejoin="miter"`;
  const a: ShapeAttrs = {
    line: `${stroke} stroke-width="${sw}" opacity="0.5"`,
    rule: `${stroke} stroke-width="${(RULE_REM * scale).toFixed(3)}" opacity="0.85"`,
    dash: `${stroke} stroke-width="${sw}" stroke-dasharray="${(DASH_REM * scale).toFixed(3)} ${(
      GAP_REM * scale
    ).toFixed(3)}" opacity="0.45"`,
    // The compass pivot's disc — the one FILL among the drawn marks, kept low so it reads as the
    // instrument's centre point rather than as a dot. A role at an opacity, never a literal.
    paper: `fill="${color}" opacity="0.22"`,
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
 *  `example.variant` is typed to that family's own list. `sizeDefault` differs per family (a radial
 *  mark needs more area than a sort before its graduations separate), and the accent default comes
 *  from the family's own `example` so the four carry distinct signature tints — compass/sorts the
 *  Line, sweep the Brownstone, azimuth the Ink — rather than collapsing onto one stone. */
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
