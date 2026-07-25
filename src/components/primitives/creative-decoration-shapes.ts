// Creative's decoration engine — the punk-zine counterpart to block's neobrutalist
// decoration-shapes.ts, future's luminous future-decoration-shapes.ts, capsule's candy
// capsule-decoration-shapes.ts and professional's hairline professional-decoration-shapes.ts.
// Where block's marks are ink-shadowed solids, future's hollow neon strokes, capsule's
// soft-lifted candy and professional's shadowless line-art, creative's are ZINE COLLAGE: a SOLID
// accent fill wearing the theme's ONE constant INK outline and casting the SIGNATURE ORANGE HARD
// OFFSET — the reference's `box-shadow: 1.25cqw 1.25cqw 0 orange` (video-assets/themes/creative,
// FRAME.md · marker-block), ported to a `drop-shadow` so it hugs the silhouette of a torn edge or
// a lightning bolt rather than a bounding box. Zero blur, always: creative's depth is a solid
// same-direction duplicate, never light.
//
// There are FOUR families — stamp · marker · zag · cutout — each drawn from creative's OWN
// component vocabulary (FRAME.md names them: stamp, marker-block, decorative-circle,
// badge-rotated), each with its OWN disjoint variant list (so no two creative decorations render
// the same shape, and none collides with another theme's name). They share this one var-driven
// element plus the SVG shape set below. A treatment carries any mix of them via addDecorations();
// a scene positions them in page-space with x/y/size/rotate/layer and tints them with one of the
// 10 shared palette roles (--primary … --dark).
//
// CREATIVE-ONLY by ROSTER, not by token: they paint with the shared palette roles every theme
// defines, so nothing in the markup is creative-specific — but `decoration: true` holds every
// family out of the showcase Components grid under any theme, and only creativeTheme.decorations
// lists them (themes never share decorations).
//
// THE OFFSET COLOUR IS AN ATOM, NOT A VARIABLE — it is fixed PER FAMILY and never follows the
// instance accent. Under creative "the hard shadow" is a specific colour the way the outline is
// always --dark (FRAME.md: orange is THE hard-shadow colour); an accent-coloured offset would read
// as a second copy of the mark rather than as the theme's depth device.
//
// Three families take the signature ORANGE (--secondary). `cutout` is the ONE exception and takes
// GREEN (--accent-2), because its own accentDefault IS --secondary: an orange scrap casting an
// orange offset is the one combination where the shadow disappears into the shape and the mark
// reads as nothing but a displaced outline. Green is the palette's other saturated plane, so the
// torn scrap keeps a hard, legible offset on every ground creative rotates through. See
// SHADOW_ROLE below — this is a per-family constant, not a knob a scene can turn.
//
// A NOTE ON RESTRAINT. FRAME.md rations the hard offset to ONE featured block per frame. A
// decoration is a flourish, not a block, and the offset is precisely what identifies it as
// creative's — but a scene that already spends its hard shadow on a marker-block should keep its
// decorations few, or the frame stops reading as a punk-zine spread and starts reading as noise.
//
// THREE INK KNOBS — the same constant-ink/scaling-shadow split all four sibling engines draw,
// answered in creative's vocabulary (which, unlike theirs, has TWO authored border weights):
//   INK_REM     — the structural outline. FIXED: it does NOT scale with `size`, so a 40%-wide
//                 zag band carries the same crisp edge as a small stamp. Rendered via a per-shape
//                 SVG stroke-width computed in viewBox units (see creativeDecoSvg).
//   RULE_REM    — the INNER-RULE weight, the second half of creative's border pair. Same
//                 constant-ink treatment, used only for detail drawn INSIDE a solid (medallion's
//                 concentric ring). Stated here so a decoration's inner rule matches the inner
//                 rules of every card, cell and table in the theme.
//   SHADOW_UNIT — the hard offset, as a fraction of `size`. This one SCALES so the offset stays
//                 proportional: 0.08 × the stamp's default size 18 = 1.44rem → 1.5rem on the
//                 0.125rem grid, which IS the reference 1.25cqw (× 1.2). Floored at size 8 so a
//                 small mark still reads as offset rather than flat.
import { component } from "../runtime/component";
import { remGrid } from "../runtime/css";
import { decorationSchema, type DecoParams } from "./decoration-placement";

const INK_REM = 0.5;
const RULE_REM = 0.375;
const SHADOW_UNIT = 0.08;

// The four creative decoration component names (the showcase + creativeTheme reference these).
export const CREATIVE_DECORATION_COMPONENTS = [
  "stamp",
  "marker",
  "zag",
  "cutout",
] as const;
export type CreativeDecorationComponentName =
  (typeof CREATIVE_DECORATION_COMPONENTS)[number];

/** The hard-offset colour, PER FAMILY — a palette role, fixed at authoring time and never the
 *  instance accent (see the header note). Orange is creative's signature offset and carries three
 *  of the four families; `cutout` takes green because its own accent default is that same orange,
 *  and an orange-on-orange offset vanishes into the scrap. Exhaustively typed, so adding a family
 *  without deciding its offset colour is a compile error rather than a silent fall-through. */
const SHADOW_ROLE: Record<CreativeDecorationComponentName, string> = {
  stamp: "secondary",
  marker: "secondary",
  zag: "secondary",
  cutout: "accent-2",
};

/** Which shape variants belong to which family — the DISJOINT lists, declared once here and
 *  consumed by each family's `index.ts`, so the enum a component validates against and the list
 *  documented here can't drift. Tripwires in registry.test.ts assert the NAMES stay disjoint
 *  (within creative AND against block/future/capsule/professional) and that every one draws a
 *  DISTINCT shape; that every name actually HAS a drawing is enforced by the type below. */
export const CREATIVE_DECORATION_VARIANTS = {
  stamp: ["seal", "rosette", "medallion"],
  marker: ["bolt", "blade", "caret"],
  zag: ["zigzag", "sawtooth", "wave"],
  cutout: ["torn", "notch", "sprocket"],
} as const satisfies Record<CreativeDecorationComponentName, readonly string[]>;

/** Every creative shape name, flattened — the key type `SHAPES` is checked against, so a variant
 *  listed above with no drawing (or a typo'd SHAPES key) is a COMPILE error rather than a silent
 *  fall back to `seal` at render time. Same discipline professional's engine draws. */
export type CreativeDecorationVariant =
  (typeof CREATIVE_DECORATION_VARIANTS)[CreativeDecorationComponentName][number];

// ------------------------------------------------------------------- shape geometry ---
// Shapes are authored in a 0..100 WIDE viewBox whose HEIGHT is 100 × the shape's `h` ratio, so
// the box and the viewBox always share an aspect and the SVG scales UNIFORMLY on both axes — see
// creativeDecoSvg for why that is what keeps the constant-ink maths a one-liner even for the
// wide-and-short zag bands.

/** Trim a computed coordinate to 2dp — path data, not a design token, so it is not on the rem
 *  grid (the rem grid governs the element box; the viewBox is unitless). */
const n2 = (n: number): string => `${Math.round(n * 100) / 100}`;

/** A point on a circle centred in a SQUARE (100×100) viewBox. Angles in degrees, 0 = due right,
 *  increasing clockwise on screen (SVG's y runs down). */
const at = (r: number, deg: number): [number, number] => {
  const t = (deg * Math.PI) / 180;
  return [50 + r * Math.cos(t), 50 + r * Math.sin(t)];
};

/** A closed polygon as path data (`M… L… Z`). */
const poly = (pts: readonly [number, number][]): string =>
  `${pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${n2(x)} ${n2(y)}`).join(" ")} Z`;

/** A COGGED disc: `teeth` straight-sided teeth alternating between an outer and an inner radius —
 *  the die-cut edge of a postage seal, drawn with corners rather than curves so it stays inside
 *  creative's no-rounding rule everywhere except the silhouette itself. */
const cog = (teeth: number, outer: number, inner: number): string =>
  poly(
    Array.from({ length: teeth * 2 }, (_, i): [number, number] =>
      at(i % 2 === 0 ? outer : inner, (i * 180) / teeth - 90),
    ),
  );

/** A SCALLOPED disc: `lobes` semicircular lobes bulging out of a base circle of radius `r`. The
 *  arc radius is exactly half the chord between adjacent base points, which makes each lobe a true
 *  semicircle; points run clockwise and sweep-flag 1 therefore bulges outward. */
const scallop = (lobes: number, r: number): string => {
  const step = 360 / lobes;
  const rr = n2(r * Math.sin(Math.PI / lobes));
  const [sx, sy] = at(r, -90);
  const arcs = Array.from({ length: lobes }, (_, i) => {
    const [x, y] = at(r, -90 + (i + 1) * step);
    return `A${rr} ${rr} 0 0 1 ${n2(x)} ${n2(y)}`;
  });
  return `M${n2(sx)} ${n2(sy)} ${arcs.join(" ")} Z`;
};

/** A closed BAND with two PARALLEL edges: walk `top` left→right, then back right→left `t` units
 *  lower. Parallel edges keep the band's weight even along its whole run, which is what makes a
 *  zag read as a ruled zine divider rather than as a row of triangles. */
const ribbon = (top: readonly [number, number][], t: number): string =>
  poly([...top, ...[...top].reverse().map(([x, y]): [number, number] => [x, y + t])]);

/** A closed band with a PROFILED top edge and a FLAT base at `base` — the ragged-top silhouette. */
const crest = (top: readonly [number, number][], base: number): string =>
  poly([...top, [100, base], [0, base]]);

/** One punched rectangle, appended to an outer path under `fill-rule="evenodd"` so it renders as a
 *  HOLE (capsule's `tunnel` uses the same trick) — the ink outline then strokes the punch too. */
const punch = (x: number, y: number, w: number, h: number): string =>
  poly([
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ]);

// Every shape receives a ready-made attribute set rather than raw colours, so the constant-ink
// maths lives in ONE place (creativeDecoSvg):
//   `solid`  accent fill + the STRUCTURAL ink outline — the default creative mark.
//   `rule`   hollow, at creative's thinner INNER-RULE weight — detail drawn inside a solid.
type ShapeAttrs = { solid: string; rule: string };
type ShapeFn = (a: ShapeAttrs) => string;
/** A shape is its drawing plus an optional HEIGHT RATIO (block's engine calls this `h`): the
 *  element box is `size×1.2` rem wide and `size×1.2×h` rem tall, and the viewBox matches. Omitted
 *  ⇒ 1, a square box. Creative needs it because the zag family is a wide-and-short RULE band —
 *  professional's engine, which forces a square box, could not draw one. */
type ShapeSpec = { draw: ShapeFn; h?: number };

const SHAPES: Record<CreativeDecorationVariant, ShapeSpec> = {
  // stamp — the rotated closing SEAL (FRAME.md · stamp: "~18cqw square, rotate(-6deg), cream
  // circular inner ring"). ROUND silhouettes: the stamp and the decorative-circle are the one
  // place creative allows a curve, everything structural stays square-cornered.
  seal: { draw: (a) => `<path d="${cog(20, 47, 40)}" ${a.solid}></path>` },
  rosette: { draw: (a) => `<path d="${scallop(10, 36)}" ${a.solid}></path>` },
  medallion: {
    // The reference's inner ring is cream because that stamp sits on the green closing plate; the
    // port draws it in INK at the inner-rule weight instead, so a medallion is legible on every
    // ground creative rotates through rather than on one of them.
    draw: (a) =>
      `<circle cx="50" cy="50" r="46" ${a.solid}></circle>` +
      `<circle cx="50" cy="50" r="30" ${a.rule}></circle>`,
  },

  // marker — the bold editorial CALLOUT mark (FRAME.md · marker-block, the one hard-offset
  // featured element). POINTED and angular: every vertex is a corner, nothing is eased.
  bolt: { draw: (a) => `<path d="M58 4 L20 54 L44 54 L36 96 L80 42 L54 42 Z" ${a.solid}></path>` },
  // A sheared parallelogram reads as a slash, so it is authored wide-and-short rather than square.
  blade: { h: 0.5, draw: (a) => `<path d="M30 4 L96 4 L70 46 L4 46 Z" ${a.solid}></path>` },
  caret: { draw: (a) => `<path d="M18 6 L86 50 L18 94 L18 66 L46 50 L18 34 Z" ${a.solid}></path>` },

  // zag — the zine RULE: a band running the full width of the box. All three share the 0.375
  // height ratio so the family reads as one divider system with three profiles.
  zigzag: {
    h: 0.375,
    draw: (a) =>
      `<path d="${ribbon(
        [
          [0, 19],
          [20, 4],
          [40, 19],
          [60, 4],
          [80, 19],
          [100, 4],
        ],
        14,
      )}" ${a.solid}></path>`,
  },
  sawtooth: {
    h: 0.375,
    draw: (a) =>
      `<path d="${crest(
        [
          [0, 26],
          [20, 7],
          [20, 26],
          [40, 7],
          [40, 26],
          [60, 7],
          [60, 26],
          [80, 7],
          [80, 26],
          [100, 7],
        ],
        33,
      )}" ${a.solid}></path>`,
  },
  wave: {
    h: 0.375,
    draw: (a) =>
      `<path d="${ribbon(
        [
          [0, 6],
          [25, 6],
          [25, 18],
          [50, 18],
          [50, 6],
          [75, 6],
          [75, 18],
          [100, 18],
        ],
        14,
      )}" ${a.solid}></path>`,
  },

  // cutout — TORN-PAPER collage scraps: the pasted-up sheet a zine is made of. Rectangles that
  // have been damaged, never rectangles that have been softened — the tear is jagged, the bite is
  // square, the punches are square. Slightly landscape (0.75 / 0.625) so they read as scraps of a
  // page rather than as tiles.
  torn: {
    h: 0.75,
    draw: (a) =>
      `<path d="M4 5 L96 5 L96 54 L87 66 L78 53 L69 67 L60 54 L51 68 L42 54 L33 66 L24 53 L15 67 L4 55 Z" ${a.solid}></path>`,
  },
  notch: {
    h: 0.75,
    draw: (a) => `<path d="M4 5 L60 5 L60 26 L96 26 L96 70 L4 70 Z" ${a.solid}></path>`,
  },
  sprocket: {
    h: 0.625,
    draw: (a) => {
      // Two rows of four 10×10 perforations, CENTRED in the 4..96 × 4..58 body: pitch 21 puts
      // 11 units between holes and (92 − (3×21 + 10)) / 2 = 9.5 at each end, so the strip reads
      // as machine-punched rather than as a row that drifted right. Rows sit 5 in from top and
      // bottom for the same reason.
      const holes = [9, 43]
        .flatMap((y) => [13.5, 34.5, 55.5, 76.5].map((x) => punch(x, y, 10, 10)))
        .join(" ");
      const body = poly([
        [4, 4],
        [96, 4],
        [96, 58],
        [4, 58],
      ]);
      return `<path d="${body} ${holes}" ${a.solid} fill-rule="evenodd"></path>`;
    },
  },
};

/** The shared, var-driven creative decoration element (one `.cr-deco`, styled entirely by inline
 *  custom properties from creativeDecorationLayout). Transparent box — the SVG carries the accent
 *  solid and its ink outline, and the div casts the hard orange offset.
 *
 *  EVERY ENGINE OWNS ITS OWN CLASS + VAR NAMESPACE, and that is load-bearing rather than tidy:
 *  `.deco`/`--d-*` (block) · `.fx-deco`/`--fd-*` (future) · `.cd-deco`/`--cd-*` (capsule) ·
 *  `.pd-deco`/`--pd-*` (professional) · `.cr-deco`/`--cr-*` (here). scopeCss prefixes each scene's
 *  CSS with its own `.<compId>-root`, so two THEMES never collide — but two ENGINES inside ONE
 *  scene would. `addDecorations()` takes any registered component (the per-theme roster is a
 *  showcase/editor boundary, not a runtime one), so a treatment CAN be handed a capsule blob and a
 *  creative stamp together; both `.<engine>-deco` blocks then land under the same root. Sharing a
 *  prefix there would be silently destructive, because the same var means different things in
 *  different engines — capsule's `--cd-shadow` is a whole `drop-shadow(…)` function while this
 *  engine's `--cr-shadow` is a bare offset+colour list, so whichever stylesheet lost the cascade
 *  would render its marks unshadowed (or with an invalid filter). Distinct prefixes make that
 *  combination merely unusual instead of broken. Keep the prefix unique when adding an engine. */
export const CR_DECO_TEMPLATE = `<div class="cr-deco" data-anim="item"><i class="cr-deco-shape" data-html="shape"></i></div>`;
export const CR_DECO_CSS = `.cr-deco {
  position: absolute;
  left: var(--cr-x, 50%);
  top: var(--cr-y, 50%);
  width: var(--cr-w, 21.625rem);
  height: var(--cr-h, 21.625rem);
  transform: translate(-50%, -50%) rotate(var(--cr-rot, 0deg));
  /* The signature hard offset. A drop-shadow rather than a box-shadow so it follows the ALPHA of
     the silhouette — a torn edge, a bolt, a punched sprocket — the way the reference's box-shadow
     only ever followed a rectangle. 0 blur, always: creative has no halo and no glow.
     Note the layout emits only the OFFSET + COLOUR (--cr-shadow: 1.5rem 1.5rem 0 var(--secondary)),
     not the whole filter function as capsule does: under creative the offset is unconditional, so
     the function is an atom stated once here and the markup carries only the part that varies. */
  filter: drop-shadow(var(--cr-shadow, 1.5rem 1.5rem 0 var(--secondary)));
  z-index: var(--cr-z, 1);
  pointer-events: none;
}
.cr-deco-shape { position: absolute; inset: 0; }
/* overflow visible so the outline stroke and the hard offset are never clipped by the box. */
.cr-deco-shape svg { display: block; width: 100%; height: 100%; overflow: visible; }`;

/** Look up a variant's spec, widening the read (`p.variant` is a plain string on the shared
 *  DecoParams). The MAP itself stays exhaustively typed, which is where drift would happen. */
const specOf = (variant: string): ShapeSpec =>
  (SHAPES as Record<string, ShapeSpec | undefined>)[variant] ?? SHAPES.seal;

/** Curried on the family's offset ROLE (SHADOW_ROLE), because `layout` only ever sees the
 *  instance params — the family is known at build time, not at render time. */
const creativeDecorationLayout =
  (shadowRole: string) =>
  (p: DecoParams): Record<string, string> => {
  const spec = specOf(p.variant);
  // The offset scales with size so it stays proportional (floored so a small mark still reads as
  // offset rather than flat on the ground).
  const off = remGrid(Math.max(p.size, 8) * SHADOW_UNIT);
  return {
    "--cr-x": `${p.x}%`,
    "--cr-y": `${p.y}%`,
    "--cr-w": remGrid(p.size * 1.2),
    // Non-square shapes (the zag bands, the cutout scraps) take the ratio; the viewBox below takes
    // the SAME ratio, so the box and the drawing stay in step at every size.
    "--cr-h": remGrid(p.size * (spec.h ?? 1) * 1.2),
    "--cr-rot": `${p.rotate}deg`,
    "--cr-z": p.layer === "front" ? "5" : "1",
    "--cr-shadow": `${off} ${off} 0 var(--${shadowRole})`,
  };
};

/** Inline SVG for a variant — an accent-filled silhouette wearing the theme's ink outline.
 *
 *  CONSTANT INK, including for the non-square shapes. The viewBox is `0 0 100 (100×h)` and the box
 *  is `size×1.2` by `size×1.2×h` rem, so the SVG's scale factor is `size×1.2 / 100` on BOTH axes
 *  whatever `h` is — the shape never gets squashed and a stroke never gets thicker in one
 *  direction. That is why the stroke width is the same one-liner professional uses, with no `h`
 *  term: rendered = strokeWidth × (size×1.2 / 100) = INK_REM. `preserveAspectRatio="none"` on the
 *  non-square shapes only absorbs the sub-0.125rem drift the rem grid introduces when width and
 *  height quantize independently; the square shapes keep `meet` so a stamp is never an ellipse. */
const creativeDecoSvg = (p: DecoParams): string => {
  const spec = specOf(p.variant);
  const h = spec.h ?? 1;
  const color = `var(--${p.accent})`;
  const scale = 100 / (p.size * 1.2);
  const edge = `stroke="var(--dark)" stroke-linejoin="miter" stroke-miterlimit="6"`;
  const solid = `fill="${color}" ${edge} stroke-width="${(INK_REM * scale).toFixed(3)}"`;
  const rule = `fill="none" ${edge} stroke-width="${(RULE_REM * scale).toFixed(3)}"`;
  const par = h === 1 ? "xMidYMid meet" : "none";
  return (
    `<svg viewBox="0 0 100 ${n2(100 * h)}" preserveAspectRatio="${par}" xmlns="http://www.w3.org/2000/svg">` +
    spec.draw({ solid, rule }) +
    `</svg>`
  );
};

/** Build one creative decoration component: a zine-collage family (its own `variant` enum) over
 *  the shared placement props + the accent-solid shape engine. Flagged `decoration: true`.
 *
 *  The family NAME is the only key a caller passes — its variant list is looked up from
 *  CREATIVE_DECORATION_VARIANTS here, so a family can't be wired to another's shapes, and
 *  `example.variant` is typed to that family's own list. `sizeDefault` differs per family (a wide
 *  zag band needs far more width than a stamp to read as a rule), which is why creative's helper
 *  takes it explicitly the way professional's does rather than pinning one number for the set. */
export const creativeDecorationComponent = <N extends CreativeDecorationComponentName>(
  name: N,
  sizeDefault: number,
  example: DecoParams & { variant: (typeof CREATIVE_DECORATION_VARIANTS)[N][number] },
) => {
  const variants: readonly string[] = CREATIVE_DECORATION_VARIANTS[name];
  return component({
    name,
    // Intrinsic decoration — held out of the showcase Components grid under any theme.
    decoration: true,
    // The variant + placement + accent vocabulary is shared with every other engine
    // (decoration-placement.ts). The accent DEFAULT comes from the family's own `example` so each
    // carries a distinct signature tint — stamp --primary (pink) · marker --accent-1 (yellow) ·
    // zag --accent-2 (green) · cutout --secondary (orange) — and an unparameterised deck or
    // showcase render never collapses the four families onto one hue.
    schema: decorationSchema({
      variants,
      sizeDefault,
      accentDefault: example.accent,
      accentDescription: "Fill colour — a palette role of the active theme",
    }),
    template: CR_DECO_TEMPLATE,
    css: CR_DECO_CSS,
    example,
    // Every creative variant is inline SVG (the outline has to be a stroke to stay constant across
    // sizes), so shape is always a string — the data-html slot is always filled.
    rawFill: (p) => ({ shape: creativeDecoSvg(p) }),
    layout: creativeDecorationLayout(SHADOW_ROLE[name]),
    // A POP is the entrance (an assigned animIn REPLACES it) — scaleIn on a `back.out(2)`
    // overshoot, so the mark lands like a stamp being pressed. Block scales, capsule scales
    // gently, future and professional fade; creative's mood is punchy, and the overshoot is the
    // motion equivalent of the hard offset — arrival with weight, no easing into place.
    animIn: "pop",
  });
};
