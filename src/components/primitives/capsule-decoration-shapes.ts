// Capsule's decoration engine — the candy counterpart to block's neobrutalist
// decoration-shapes.ts and future's luminous future-decoration-shapes.ts. Where block's
// decorations are hard-edged solids on a hard ink shadow and future's are hollow neon
// strokes, capsule's are CANDY: a FILLED solid in the instance accent, wrapped in the
// theme's ONE universal ink outline, lifted off the cream canvas by a SOFT OFFSET shadow
// (hard-edged — 0 blur — never a blur halo). Silhouettes are fully round (the pill
// geometry) or organically curved (the blobs) — capsule has no corner and no point that
// isn't rounded off. There are FOUR families — blob · lozenge · arch · confetti — each
// with its OWN disjoint variant list (so no two capsule decorations render the same
// shape), sharing this one var-driven element + a square-viewBox SVG shape set. A
// treatment carries any mix of them via addDecorations(); a scene positions them in
// page-space with x/y/size/rotate/layer, and tints them with one of the 10 shared palette
// roles (--primary … --dark).
//
// These are CAPSULE-ONLY by ROSTER, not by token: they paint with the shared palette
// roles every theme defines, so nothing in the markup is capsule-specific — but
// `decoration: true` holds every family out of the showcase Components grid, and only
// capsuleTheme.decorations lists them (themes never share decorations).
//
// Two ink weights, two behaviours — the same split block draws, answered in capsule's
// vocabulary:
//   INK_REM     — the universal capsule outline. FIXED: it does NOT scale with `size`, so
//                 a big blob carries the same crisp 0.25rem stroke as a small confetti
//                 mark (rendered via a per-shape SVG stroke-width computed in viewBox
//                 units, see capsuleDecoSvg — the constant-ink trick both other engines use).
//   SHADOW_UNIT — the soft offset shadow's OFFSET, as a fraction of `size`. This one
//                 SCALES so the lift stays proportional: 0.375rem at the default size 17,
//                 which is rung 1 of the theme's shadow ladder AND exactly the legacy
//                 `.ffp` floating-pill shadow (0.35cqw in themes/capsule/frame.css). A
//                 decoration wears the same soft offset lift as any capsule (theme.ts
//                 rules) — that is what reads it as the same candy object as a card or pill.
//                 The lift is authored in exactly this one place. Note you can't flatten a
//                 decoration by zeroing this: remGrid floors the offset at the 0.125rem grid,
//                 so a truly flat decoration would mean not emitting `--cd-shadow` at all
//                 (the CSS defaults it to `none`).
import { component } from "../runtime/component";
import { remGrid } from "../runtime/css";
import { decorationSchema, type DecoParams } from "./decoration-placement";

const INK_REM = 0.25;
const SHADOW_UNIT = 0.025;
// Body width of an OPEN-stroke confetti mark (squiggle, plus), in viewBox units. Unlike
// the ink, this is the "solid" of the mark, so it scales with the element like a fill does.
const MARK_VB = 12;

// The four capsule decoration component names (the showcase + capsuleTheme reference these).
export const CAPSULE_DECORATION_COMPONENTS = [
  "blob",
  "lozenge",
  "arch",
  "confetti",
] as const;
export type CapsuleDecorationComponentName =
  (typeof CAPSULE_DECORATION_COMPONENTS)[number];

// Tint tokens — the shared palette roles (types/palette.ts). Under capsule --primary is
// coral, --secondary sky, --accent-1 yellow, --accent-2 mint, --accent-3 lavender,
// --light white and --dark the ink. Any role is legal; the theme decides the hex.
const accentVar = (a: string): string => `var(--${a})`;

// The candy shadow, derived (never a literal): the theme's ink at 12%, the one shadow
// colour the whole capsule system uses.
const SHADOW_COLOR = "color-mix(in srgb, var(--dark) 12%, transparent)";

// Every shape is authored in a square 0..100 viewBox so the box can scale uniformly and
// the outline stays a true SVG stroke. Shapes receive a ready-made attribute set rather
// than raw colours, so the constant-ink maths lives in ONE place (capsuleDecoSvg):
//   `solid`      accent fill + the ink outline — the default candy solid.
//   `filled(c)`  the same, filled with any palette role (two-tone parts, e.g. the slot track).
//   `under`/`mark`  the two passes of an OPEN stroke: a wider ink underlay, then the accent
//                   body on top — which is how a stroked mark gets the same ink edge a
//                   filled one gets from its outline.
type ShapeAttrs = {
  solid: string;
  filled: (color: string) => string;
  under: string;
  mark: string;
};
type ShapeFn = (a: ShapeAttrs) => string;

const SHAPES: Record<string, ShapeFn> = {
  // blob — organic candy blobs: hand-drawn silhouettes with no straight edge and no corner.
  bean: (a) =>
    `<path d="M64 10 C84 10 94 28 94 50 C94 74 78 92 56 92 C34 92 18 78 18 62 C18 50 26 44 36 46 C46 48 50 40 46 30 C42 18 50 10 64 10 Z" ${a.solid}></path>`,
  pebble: (a) =>
    `<path d="M52 8 C74 6 94 22 94 44 C94 66 80 94 54 94 C30 94 8 76 8 52 C8 28 28 10 52 8 Z" ${a.solid}></path>`,
  cloud: (a) =>
    `<path d="M28 76 C16 76 8 67 8 55 C8 43 18 34 30 35 C34 20 46 10 60 10 C75 10 87 22 88 37 C95 41 98 48 98 56 C98 68 90 76 79 76 Z" ${a.solid}></path>`,
  drop: (a) =>
    `<path d="M50 6 C50 6 84 44 84 62 C84 80 69 94 50 94 C31 94 16 80 16 62 C16 44 50 6 50 6 Z" ${a.solid}></path>`,

  // lozenge — the pure pill geometry: fully round ends, struck straight (capsule's chips
  // sit level; the tilt is a placement choice, not a shape one).
  pill: (a) => `<rect x="4" y="32" width="92" height="36" rx="18" ${a.solid}></rect>`,
  stadium: (a) => `<rect x="32" y="4" width="36" height="92" rx="18" ${a.solid}></rect>`,
  disc: (a) => `<circle cx="50" cy="50" r="42" ${a.solid}></circle>`,
  // slot — the theme's track-and-fill motif (the rank bar, in miniature): a white outlined
  // capsule with an accent capsule seated inside it.
  slot: (a) =>
    `<rect x="4" y="32" width="92" height="36" rx="18" ${a.filled("var(--light)")}></rect>` +
    `<rect x="12" y="39" width="46" height="22" rx="11" ${a.solid}></rect>`,

  // arch — half-round doorway silhouettes: a true semicircle over a flat baseline.
  dome: (a) => `<path d="M8 84 A42 42 0 0 1 92 84 Z" ${a.solid}></path>`,
  gate: (a) =>
    `<path d="M14 92 L14 46 A36 36 0 0 1 86 46 L86 92 Z" ${a.solid}></path>`,
  // tunnel — the gate with its doorway punched out (evenodd on one path = a hole, so the
  // ink outline strokes BOTH silhouettes and the band reads as one candy piece).
  tunnel: (a) =>
    `<path d="M12 92 L12 46 A38 38 0 0 1 88 46 L88 92 Z M32 92 L32 46 A18 18 0 0 1 68 46 L68 92 Z" ${a.solid} fill-rule="evenodd"></path>`,
  // rainbow — a half-annulus: the same band with no legs, floating on the baseline.
  rainbow: (a) =>
    `<path d="M6 80 A44 44 0 0 1 94 80 L70 80 A20 20 0 0 0 30 80 Z" ${a.solid}></path>`,

  // confetti — small hand-drawn marks scattered as atmosphere. Two are round-capped
  // strokes (ink underlay + accent body), two are filled solids.
  squiggle: (a) => {
    const d = "M10 62 C26 30 38 30 50 50 C62 70 74 70 90 38";
    return `<path d="${d}" ${a.under}></path><path d="${d}" ${a.mark}></path>`;
  },
  plus: (a) => {
    const d = "M50 20 L50 80 M20 50 L80 50";
    return `<path d="${d}" ${a.under}></path><path d="${d}" ${a.mark}></path>`;
  },
  spark: (a) =>
    `<path d="M50 6 C56 34 66 44 94 50 C66 56 56 66 50 94 C44 66 34 56 6 50 C34 44 44 34 50 6 Z" ${a.solid}></path>`,
  comma: (a) =>
    `<path d="M62 8 C81 8 94 24 94 44 C94 70 76 84 54 92 C50 93 47 90 50 87 C60 78 66 68 67 58 C64 60 60 61 56 61 C40 61 30 49 30 34 C30 19 44 8 62 8 Z" ${a.solid}></path>`,
};

/** Which shape variants belong to which family — the DISJOINT lists, declared once here
 *  and consumed by each family's `index.ts`, so the enum a component validates against and
 *  the list documented here can't drift. Tripwires in registry.test.ts assert the lists
 *  stay disjoint and that every name resolves to a `SHAPES` entry. Disjoint from block's
 *  and future's names too, so the three engines' vocabularies never read as one set. */
export const CAPSULE_DECORATION_VARIANTS = {
  blob: ["bean", "pebble", "cloud", "drop"],
  lozenge: ["pill", "stadium", "disc", "slot"],
  arch: ["dome", "gate", "tunnel", "rainbow"],
  confetti: ["squiggle", "plus", "spark", "comma"],
} as const satisfies Record<CapsuleDecorationComponentName, readonly string[]>;

/** The shared, var-driven capsule decoration element (one `.cd-deco`, styled entirely by
 *  inline custom properties from capsuleDecorationLayout). Transparent box — the SVG
 *  carries the filled shape and its ink outline, and the div casts the offset shadow. */
export const CD_DECO_TEMPLATE = `<div class="cd-deco" data-anim="item"><i class="cd-deco-shape" data-html="shape"></i></div>`;
export const CD_DECO_CSS = `.cd-deco {
  position: absolute;
  left: var(--cd-x, 50%);
  top: var(--cd-y, 50%);
  width: var(--cd-w, 20.375rem);
  height: var(--cd-h, 20.375rem);
  transform: translate(-50%, -50%) rotate(var(--cd-rot, 0deg));
  /* A hard 0-blur offset, cast through the ALPHA of the silhouette — so it hugs an
     organic blob or a punched-out arch the way a box-shadow only ever hugs a rectangle.
     Never blurred: capsule's lift is a paper-cut offset, not a glow. */
  filter: var(--cd-shadow, none);
  z-index: var(--cd-z, 1);
  pointer-events: none;
}
.cd-deco-shape { position: absolute; inset: 0; }
/* overflow visible so the outline stroke and the offset shadow are never clipped. */
.cd-deco-shape svg { display: block; width: 100%; height: 100%; overflow: visible; }`;

const capsuleDecorationLayout = (p: DecoParams): Record<string, string> => {
  const w = remGrid(p.size * 1.2);
  // Offset scales with size so the lift stays proportional (floored so a small mark still
  // reads as lifted rather than flat on the canvas).
  const off = remGrid(Math.max(p.size, 6) * SHADOW_UNIT);
  return {
    "--cd-x": `${p.x}%`,
    "--cd-y": `${p.y}%`,
    "--cd-w": w,
    "--cd-h": w, // square box → square viewBox scales uniformly (constant ink)
    "--cd-rot": `${p.rotate}deg`,
    "--cd-z": p.layer === "front" ? "5" : "1",
    "--cd-shadow": `drop-shadow(${off} ${off} 0 ${SHADOW_COLOR})`,
  };
};

/** Inline SVG for a variant — an accent-filled silhouette with the theme's ink outline, in
 *  a square 0..100 viewBox. stroke-width is chosen in viewBox units so it RENDERS at the
 *  constant INK_REM at any size: rendered = strokeWidth × (size×1.2 / 100) = INK_REM (the
 *  box is size×1.2 rem square). An open-stroke mark gets the same edge from a wider ink
 *  underlay: its band shows INK_REM either side of the MARK_VB accent body. */
const capsuleDecoSvg = (p: DecoParams): string => {
  const shape = SHAPES[p.variant] ?? SHAPES.pill!;
  const color = accentVar(p.accent);
  const inkVB = (INK_REM * 100) / (p.size * 1.2);
  const ink = inkVB.toFixed(3);
  const filled = (fill: string): string =>
    `fill="${fill}" stroke="var(--dark)" stroke-width="${ink}" stroke-linejoin="round"`;
  const capped = `stroke-linecap="round" stroke-linejoin="round"`;
  const under = `fill="none" stroke="var(--dark)" stroke-width="${(MARK_VB + 2 * inkVB).toFixed(3)}" ${capped}`;
  const mark = `fill="none" stroke="${color}" stroke-width="${MARK_VB.toFixed(3)}" ${capped}`;
  return (
    `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">` +
    shape({ solid: filled(color), filled, under, mark }) +
    `</svg>`
  );
};

/** Build one capsule decoration component: a candy shape family (its own `variant` enum)
 *  over the shared placement props + filled-solid shape engine. Flagged `decoration: true`.
 *
 *  The family NAME is the only key a caller passes — its variant list is looked up from
 *  CAPSULE_DECORATION_VARIANTS here, so a family can't be wired to another's shapes, and
 *  `example.variant` is typed to that family's own list. */
export const capsuleDecorationComponent = <N extends CapsuleDecorationComponentName>(
  name: N,
  example: DecoParams & { variant: (typeof CAPSULE_DECORATION_VARIANTS)[N][number] },
) => {
  const variants: readonly string[] = CAPSULE_DECORATION_VARIANTS[name];
  return component({
    name,
    // Intrinsic decoration — held out of the showcase Components grid under any theme.
    decoration: true,
    // The variant + placement + accent vocabulary is shared with block's and future's
    // engines (decoration-placement.ts); capsule differs only in the default size its
    // filled solids want (between block's 16 and future's 18 — a candy solid carries its
    // own weight, so it needs less area than a hairline but reads heavier than a slab).
    // The accent DEFAULT comes from the family's own `example` so each carries a distinct
    // signature tint — blob --primary (coral) · lozenge --secondary (sky) · arch
    // --accent-3 (lavender) · confetti --accent-1 (yellow) — so an unparameterised
    // deck/showcase render never collapses the four families onto one hue.
    schema: decorationSchema({
      variants,
      sizeDefault: 17,
      accentDefault: example.accent,
      accentDescription: "Fill colour — a palette role of the active theme",
    }),
    template: CD_DECO_TEMPLATE,
    css: CD_DECO_CSS,
    example,
    // Every capsule variant is inline SVG (the outline has to be a stroke to stay constant
    // across sizes), so shape is always a string — the data-html slot is always filled.
    rawFill: (p) => ({ shape: capsuleDecoSvg(p) }),
    layout: capsuleDecorationLayout,
    // A soft pop IS the entrance (an assigned animIn REPLACES it) — gentler than block's
    // 0.4 snap, since capsule's mood is bouncy-but-calm rather than punchy.
    animIn: "scale",
    animInOpts: { from: 0.6 },
  });
};
