// Backdrop MASK designs — a small, theme-agnostic registry of full-bleed overlays
// painted on top of a scene's ground COLOUR (behind the content). This is the
// counterpart to the ground: `ground` sets the base fill (var(--<ground>) on the
// page wrapper), a backdrop paints a pattern/texture OVER it. Designs are shared
// across themes and recoloured by theme tokens (block's dots use var(--dark)); a
// theme picks its canonical design (ThemeTokens.backdrop) and a scene may override
// it (BuildContext.backdrop / storyboard options.backdrop).
//
// Shape mirrors decoration-shapes.ts: a design's `build` returns a mini-dom node +
// a scoped-later CSS string + anim descriptors. Static designs return `anims: []`;
// the field is kept so an animated mask (e.g. a seeded constellation driven off the
// scene timeline) drops in later without changing this interface or its callers.
import type { ElementNode } from "../../pipeline/mini-dom";
import type { BackdropName, FrameGround } from "../../types/storyboard";
import { rootElement } from "../runtime/dom";
import type { AnimDescriptor, BuildContext, ThemeTokens } from "../runtime/types";

export type BackdropInput = {
  /** The scene's resolved ground colour token (a design may tint against it). */
  ground: FrameGround;
  /** The active theme (tokens/skin the mask recolours from). */
  theme: ThemeTokens;
  /** Scene build context (compId is a stable per-scene seed for animated designs). */
  ctx: BuildContext;
};

export type BackdropResult = {
  /** The full-bleed overlay element, inserted behind the content (z-index 0). */
  node: ElementNode;
  /** Timeline hooks for animated masks (empty for static designs). */
  anims: AnimDescriptor[];
};

export type BackdropDesign = {
  name: string;
  /**
   * The design's authored CSS — a STATIC module constant, deliberately NOT produced by
   * `build`. Every design's rules are per-scene invariant (each addresses its inner parts
   * structurally, e.g. `> div` / `svg` / `canvas`, precisely so the sheet dedupes by name
   * across scenes), and this shape makes that a type-level fact instead of a convention a
   * future edit could quietly break: there is no `ctx` in scope here to interpolate.
   *
   * It is collected into `BACKDROPS_CSS` and staged as a project's read-only
   * `assets/backdrops.css`. It is NOT emitted into the scene sub-composition — see
   * BACKDROPS_CSS for why that matters.
   */
  css: string;
  build: (input: BackdropInput) => BackdropResult;
};

// Shared overlay base + the per-design modifier. `.mc-backdrop` pins the layer
// full-bleed behind the content (the page wrapper is position:absolute/inset:0, so
// z-index 0 sits above the wrapper's ground bg and below back-decorations at z1).
const BACKDROP_BASE = `.mc-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}`;

/** dots — block's neobrutalist ink dot-grid (was the dead `.dg` in block/frame.css),
 *  now a shareable, theme-recoloured mask. Static (pure CSS radial-gradient). */
const dots: BackdropDesign = {
  name: "dots",
  css: `.mc-backdrop--dots {
  opacity: 0.32;
  /* --dots-ink lets a theme repaint the grid: block's ink dots vanish on a dark ground
     (future's --dark abyss on navy is invisible), so future re-points it to cyan. */
  background-image: radial-gradient(circle, var(--dots-ink, var(--dark)) 0.125rem, transparent 0.125rem);
  background-size: 3.625rem 3.625rem;
}`,
  build: () => ({
    node: rootElement(`<div class="mc-backdrop mc-backdrop--dots"></div>`),
    anims: [],
  }),
};

// --- The three masks ported off the root chrome ------------------------------
// `gradient`, `grid` and `hatch` were `.mc-bg--gradient` / `.mc-bg--grid` /
// `.mc-bg--pattern` in root/chrome.css: a SECOND, deck-wide backdrop system painted with
// the retired theme-css tokens (--grad-page / --bg / --grid), which no palette role could
// address. They are per-scene designs now, recoloured like every other mask through an
// `--<design>-ink` hook (the `dots` convention above) so a theme repaints them from its own
// frame.css without forking the design. (`gradient` is two-tone, so it takes a second hook,
// `--gradient-ink-2`, which falls back through the first.)
//
// The two root kinds with no entry here are deliberate: `.mc-bg--solid` IS `plain` (a bare
// ground, no overlay), and `.mc-bg--particles` IS `constellation` — the same MC.particleBg
// FX, already animated and already tinted from the theme's --primary.

/** gradient — a SLOW-TURNING TWO-TONE atmospheric wash (was the old `.mc-bg--gradient`'s
 *  static vertical fade, minus the hardcoded --grad-page). Two soft radial glows sit toward
 *  opposite corners — a leading tone from `--gradient-ink`, a counter from `--gradient-ink-2` —
 *  over whatever ground the scene carries, and the pair turns a few degrees across the scene
 *  so the field breathes instead of sitting dead still. ANIMATED: one `backdrop` descriptor
 *  driving MC.washSpin, the second animated design after `constellation`.
 *
 *  WHY THE INNER ELEMENT. `.mc-backdrop--gradient` is the full-bleed layer (position:absolute,
 *  inset:0), so rotating IT would swing its own corners into frame and expose bare ground at
 *  the edges. The gradients therefore live on an oversized inner div — 150% in both axes at
 *  offset -25%, comfortably past the sqrt(2) (141%) a centre-origin rotation needs — which the
 *  layer clips with `overflow: hidden`. The 150%/-25% geometry and the `transform-origin` are
 *  load-bearing: shrink either and a corner shows.
 *
 *  WHY THE SCOPED CLASS. Same reason constellation scopes its canvas: `backdrop` anims are NOT
 *  run through qualifyAnim, and the render's `q` is document-wide (sub-composition.ts) — an
 *  unscoped `.wash` would let one scene's rotation tween grab a different scene's element in
 *  the shared render DOM. The CSS addresses the div STRUCTURALLY (`> div`) so the stylesheet
 *  itself carries no per-scene class and stays dedupe-able by name across scenes.
 *
 *  Deterministic: the geometry is fixed, the class derives from compId, and the motion is a
 *  pure function of timeline time (no seed, no clock) — so the build is byte-identical for a
 *  given compId and seeking any frame lands on the same angle. */
const gradient: BackdropDesign = {
  name: "gradient",
  css: `.mc-backdrop--gradient {
  overflow: hidden;
}
.mc-backdrop--gradient > div {
  position: absolute;
  left: -25%;
  top: -25%;
  width: 150%;
  height: 150%;
  transform-origin: 50% 50%;
  /* TWO TONES, TWO HOOKS. --gradient-ink is the leading glow (each theme's own warm/ink
     shade); --gradient-ink-2 is the counter glow toward the opposite corner and FALLS BACK
     THROUGH it, so a theme that states only the one hook still gets a coherent single-tone
     wash rather than an unthemed ink blob.

     THE TWO GLOWS MUST OVERLAP. This shipped at 8%/10% with a "transparent 36%" stop and
     measured, on cream, as a warm/cool swing of ~12/255 with a completely flat band through
     the middle — i.e. two faint dots rather than one field, which reads as a smudge and not
     as a two-tone at all. The stop is what fixes it: at 70% each glow reaches well past
     centre, so the tones MEET and the eye gets a continuous warm-to-cool traverse instead of
     two isolated blooms. The alphas then carry the hue.

     Still atmosphere, not a tint — the ground must read as itself underneath, which is why
     these are alphas over the ground rather than opaque stops. Both are deliberately
     restrained; a theme that wants more turns the hooks at a stronger role, it does not need
     this file.

     The percentages are stated against the 150% box, so they land where the frame wants
     them: 25%/23% of the box is 12.5%/9.5% of the FRAME and 75%/74% is 87.5%/86% — the same
     opposite-corner pair the legacy capsule wash used. */
  background-image:
    radial-gradient(
      ellipse at 25% 23%,
      color-mix(in srgb, var(--gradient-ink, var(--dark)) 16%, transparent),
      transparent 70%
    ),
    radial-gradient(
      ellipse at 75% 74%,
      color-mix(in srgb, var(--gradient-ink-2, var(--gradient-ink, var(--dark))) 20%, transparent),
      transparent 70%
    );
}`,
  build: ({ ctx }) => {
    // idPrefix === compId for a treatment root (children never build the backdrop).
    const washClass = `${ctx.idPrefix}-wash`;
    return {
      node: rootElement(
        `<div class="mc-backdrop mc-backdrop--gradient"><div class="${washClass}"></div></div>`,
      ),
      anims: [
        {
          kind: "backdrop",
          target: washClass,
          time: { at: "seconds", t: 0 },
          // One ease-less sweep across the whole scene. 10 degrees over a typical slide is
          // well under a degree a second — felt at the edge of vision, never watched. `deg`
          // is a TOTAL, not a rate, so a long slide turns more gently rather than further.
          opts: { fn: "washSpin", deg: 10 },
        },
      ],
    };
  },
};

/** grid — a 4rem ruled line grid (the old `.mc-bg--grid`). Static. */
const grid: BackdropDesign = {
  name: "grid",
  css: `.mc-backdrop--grid {
  opacity: 0.14;
  /* --grid-ink: the rule colour. 0.125rem keeps the hairline on the authoring grid. */
  background-image:
    linear-gradient(var(--grid-ink, var(--dark)) 0.125rem, transparent 0.125rem),
    linear-gradient(90deg, var(--grid-ink, var(--dark)) 0.125rem, transparent 0.125rem);
  background-size: 4rem 4rem;
}`,
  build: () => ({
    node: rootElement(`<div class="mc-backdrop mc-backdrop--grid"></div>`),
    anims: [],
  }),
};

/** hatch — ANGLED VANISHING STRIPES with a SOOTHING COLOUR SHIFT (was a flat 45° repeating
 *  gradient, the old `.mc-bg--pattern`). A ladder of parallel diagonal stripes marches across
 *  the frame THICK+OPAQUE on one edge and TAPERING to a thin, faint hairline on the other, so
 *  the field reads as stripes receding into the distance — the "vanishing stripes" look ported
 *  from the source SVG, minus its baked navy ground and hardcoded colour ramp so it stays
 *  theme-neutral. Every stripe paints through `var(--hatch-ink, var(--dark))` (the design's one
 *  themeable hook — a theme re-points it in frame.css: professional runs it cobalt on cream),
 *  and the "colours" the SVG hand-authored as a ramp are reproduced by the single ink at
 *  ramping OPACITY, so one hook still recolours the whole design.
 *
 *  ANIMATED: one `backdrop` descriptor drives MC.hueShift, which turns a slow `hue-rotate()` on
 *  the layer across the scene — a gentle drift of the ink's hue (cobalt → indigo → violet under
 *  professional; a no-op for a hueless near-black ink, so block/capsule's hatch is unaffected).
 *  This is the "soothing colour shift" the source SVG's programmatic colours invited. Like the
 *  gradient wash it is deterministic — a pure function of timeline position, no seed, no clock.
 *
 *  WHY THE SCOPED CLASS. Same reason as gradient/constellation: a `backdrop` anim is NOT run
 *  through qualifyAnim and the render's `q` is document-wide, so the filter target carries a
 *  compId-scoped class (`${ctx.idPrefix}-hue`) — otherwise one scene's hue tween would grab
 *  another scene's layer in the shared render DOM. The CSS stays structural (no per-scene class)
 *  so it dedupes by name across scenes.
 *
 *  The stripe geometry is generated ONCE at module load (a pure loop, no randomness), so the
 *  markup is byte-identical every build. The viewBox is 16:9 (192×108) with
 *  preserveAspectRatio="none", which fills the 1920×1080 frame at a uniform 10× scale (the
 *  aspect ratios match), so the −22° stripe angle renders true rather than sheared. */
const hatch: BackdropDesign = {
  name: "hatch",
  css: `.mc-backdrop--hatch {
  opacity: 0.18;
  overflow: hidden;
}
.mc-backdrop--hatch svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
/* --hatch-ink: the stripe colour (the design's one themeable hook). The per-stripe opacity in
   the markup carries the vanish; the hue-rotate FX carries the soothing colour shift. */
.mc-backdrop--hatch rect {
  fill: var(--hatch-ink, var(--dark));
}`,
  build: ({ ctx }) => {
    // idPrefix === compId for a treatment root (children never build the backdrop).
    const hueClass = `${ctx.idPrefix}-hue`;
    return {
      node: rootElement(
        `<div class="mc-backdrop mc-backdrop--hatch ${hueClass}"><svg viewBox="0 0 192 108" preserveAspectRatio="none"><g transform="rotate(-22 96 54)">${HATCH_STRIPES}</g></svg></div>`,
      ),
      anims: [
        {
          kind: "backdrop",
          target: hueClass,
          time: { at: "seconds", t: 0 },
          // One ease-less hue drift across the whole scene. `deg` is a TOTAL, not a rate, so a
          // long slide drifts more gently rather than further — atmosphere, felt not watched.
          opts: { fn: "hueShift", deg: 28 },
        },
      ],
    };
  },
};

/** The vanishing-stripe ladder, generated once: parallel vertical bars stepping across x, each
 *  THINNER and FAINTER than the last (the receding "vanish"). The parent `<g>` rotates them to
 *  the stripe angle and the parent layer clips the overflow.
 *
 *  ASYMMETRIC BY DESIGN: the ladder is concentrated in the LEFT two-thirds — it marches from the
 *  left edge (x=-44, oversized so the rotation leaves no bare left/top/bottom corner) and fades
 *  out by ~x=104 of the 192-wide viewBox. After the −22° rotation about centre that lands the
 *  field's right extent just short of the frame's 2/3 line, so the RIGHT THIRD stays clear (open
 *  negative space, no stripes). Fewer stripes than a full-bleed ladder, and none on the right.
 *  Pure maths, no randomness — byte-identical every build. */
const HATCH_STRIPES: string = (() => {
  const N = 18; // fewer stripes; none reach the right third
  const X_START = -44; // past the left edge so the rotation leaves no bare corner there
  const X_SPAN = 148; // ends ~x=104 → rendered right extent stays left of the frame's 2/3 line
  const parts: string[] = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const x = (X_START + t * X_SPAN).toFixed(2);
    const w = (6.4 * (1 - t) + 0.6).toFixed(2); // taper thick → thin, completing by the cutoff
    const op = (0.92 * (1 - t) + 0.06).toFixed(3); // fade opaque → faint
    parts.push(`<rect x="${x}" y="-80" width="${w}" height="268" opacity="${op}"></rect>`);
  }
  return parts.join("");
})();
/** sunburst — a RADIAL SPIRAL BURST ("sun tornado"): a soft central glow with a fan of long spiral
 *  arms sweeping out of it, the arms turning slowly and continuously across the scene while the
 *  glow stays put. Creative's signature design, contributed to the shared pool like every other.
 *  ANIMATED: one `backdrop` descriptor driving MC.sunburstBg — the one design that needed an FX of
 *  its own, so it IS an addition to mc.js's BACKDROP_FX allowlist.
 *
 *  IT PAINTS INTO A CANVAS, NOT AN SVG, and that is the whole point of the design's current shape.
 *  It shipped first as inline SVG turned by MC.washSpin — both by turning the layer and by turning
 *  a group inside it — and neither was viable: an SVG transform DIRTIES THE PAINT of the scaled
 *  slide around it, so every frame re-rastered the whole thing. A canvas owns its backing surface.
 *  The full argument, including what was tried and why cutting the fill count didn't help, lives on
 *  MC.sunburstBg in assets/fx/mc.js — read it there before "simplifying" this back to washSpin.
 *
 *  The artwork itself is the source file's, unchanged in look: its greys, its glow falloff, its arm
 *  path, its scale/angle ladder. What changed is only HOW it is drawn — see SUNBURST_FAN and
 *  SUNBURST_GLOW_RAMP, which fold the source's three stacked fans and thirteen concentric circles
 *  into one fan and one gradient without altering the result.
 *
 *  HOW IT COLOURS ITSELF: GREY + `mix-blend-mode: luminosity`. This is the trick that lets the
 *  artwork keep its literal greys without becoming un-themeable. `luminosity` takes the HUE and
 *  SATURATION of what is underneath and the LIGHTNESS of what is on top — so the scene's plane
 *  supplies every hue and the burst supplies only light and shade. The same grey artwork reads
 *  amber on creative's cream, rose on its pink and green on its green, with no colour arithmetic
 *  anywhere.
 *
 *  BE CLEAR ABOUT WHAT THAT COSTS, because it is the one thing to know before touching SB_DARK.
 *  Unlike `overlay`/`soft-light`, luminosity has NO identity value: mid-grey is not a no-op, it
 *  REPLACES the ground's own lightness. The layer covers the frame, so SB_DARK (the artwork's
 *  ambient tone, #878787) sets the lightness of the whole plane, not just of the burst. Raising or
 *  lowering that one number moves the entire slide lighter or darker. If a ground needs to keep its
 *  authored lightness and only be lit locally, `overlay` and `soft-light` are the anchored-at-
 *  mid-grey alternatives and are a one-word swap; `lighten` is NOT (per-channel MAX flattens every
 *  ground darker than mid-grey — it would erase future's navy and block's near-black).
 *
 *  That replaces the whole `--sunburst-ink` / `sunburstTones()` apparatus this design used to
 *  carry (a theme hook, plus HSL maths that derived a two-tone complement from the scene's ground
 *  at build time). Blending gets the same result — a field that suits every ground — from one CSS
 *  declaration, and gets it for grounds nobody has authored yet. Those hooks and that maths are
 *  deleted, not deprecated; `--sunburst-ink` in a theme's frame.css is now dead and does nothing.
 *
 *  GEOMETRY. Every circle in the source is `r=…` with no cx/cy, so the burst is anchored at the
 *  artwork's ORIGIN, which this design pins to the FRAME's TOP-LEFT corner (originX/originY in the
 *  descriptor); the arms sweep down and right across the slide from there. The artwork is authored
 *  against a 2000-unit-wide space (viewW) and the FX scales it by canvasWidth/viewW, so the frame's
 *  16:9 maps to 2000 x 1125 artwork units. The only requirement is that the artwork COVER the frame
 *  at every angle: the glow disc is radially symmetric at r=3000, and the arms reach 1.6 x 1550 =
 *  2480 units against a farthest frame corner at sqrt(2000^2 + 1125^2) = 2294.
 *
 *  THE LAYER IS EXACTLY THE FRAME, and that is worth understanding because the alternative shipped
 *  as a bug. Rotating the ELEMENT swings its own corners into view, so it must be oversized until
 *  its inscribed circle covers the frame from the rotation origin — with the burst on a corner that
 *  reach is sqrt(120^2 + 67.5^2) = 137.7rem against a 120 x 67.5rem frame, i.e. a 280rem square,
 *  ~9.7x the frame's area, ~90% of it never visible. At showcase widths that measured ~24MP of
 *  raster PER treatment card and made the treatments grid stutter on scroll. Here the rotation is a
 *  transform on the drawing CONTEXT, so nothing is oversized. A `280rem` reappearing in this file's
 *  CSS means someone has gone back to rotating the layer; registry.test.ts asserts it does not.
 *
 *  THE THREE PIECES THE FX COMPOSITES, bottom to top — the arms are the only one that moves, so the
 *  other two are pre-rendered ONCE at setup and blitted:
 *    • BELOW — the ambient ground tone, with the glow disc (SUNBURST_GLOW_RAMP) over it.
 *    • THE ARMS — SUNBURST_FAN, one gradient-filled fill per entry, re-drawn every frame.
 *    • ABOVE — the VEIL: the same radial ramp again at `veilAlpha`, which is what keeps the arms
 *      sitting IN the light rather than on top of it. It is the one part that cannot fold into the
 *      glow, because it is on the far side of the arms. Drop veilAlpha to 0 and the arms read as
 *      cut-out shapes laid over the burst instead of as light within it.
 *
 *  Deterministic, like every other backdrop FX: the angle is a pure function of timeline position
 *  via a proxy tween — no rAF, no wall clock, no repeat — so the renderer, which SEEKS a paused
 *  timeline frame by frame, repaints identically for a given frame. */
/** One spiral arm — the `d` of the source's `<path id='s'>`, verbatim. A 1550-unit tapering sweep
 *  that curls roughly a quarter turn out of the core. Everything else in the tornado is this one
 *  path re-used at a different scale and angle. */
const SUNBURST_ARM =
  "M1549.2 51.6c-5.4 99.1-20.2 197.6-44.2 293.6c-24.1 96-57.4 189.4-99.3 278.6c-41.9 89.2-92.4 174.1-150.3 253.3c-58 79.2-123.4 152.6-195.1 219c-71.7 66.4-149.6 125.8-232.2 177.2c-82.7 51.4-170.1 94.7-260.7 129.1c-90.6 34.4-184.4 60-279.5 76.3C192.6 1495 96.1 1502 0 1500c96.1-2.1 191.8-13.3 285.4-33.6c93.6-20.2 185-49.5 272.5-87.2c87.6-37.7 171.3-83.8 249.6-137.3c78.4-53.5 151.5-114.5 217.9-181.7c66.5-67.2 126.4-140.7 178.6-218.9c52.3-78.3 96.9-161.4 133-247.9c36.1-86.5 63.8-176.2 82.6-267.6c18.8-91.4 28.6-184.4 29.6-277.4c0.3-27.6 23.2-48.7 50.8-48.4s49.5 21.8 49.2 49.5c0 0.7 0 1.3-0.1 2L1549.2 51.6z";

/** The source's palette. Three greys, and that is the entire artwork — see the blend-mode note on
 *  the design above for why grey is the point rather than a placeholder. */
const SB_LIGHT = 0xd4; // #D4D4D4 — the glow's hot centre
const SB_DARK = 0x87; // #878787 — the ground tone, and every gradient's outer stop
const SB_MID = 0xae; // #aeaeae — where an arm leaves the core


/** The fan: the source's fifteen scale/angle pairs, PAINTED ONCE.
 *
 *  The source draws this fan THREE times — `<use href='#g' transform='rotate(10|120|240)'>` — which
 *  is 45 gradient-filled 1550-unit paths per scene. It needs three copies because its fifteen
 *  anchors all sit inside a ±60° wedge, so one pass would leave two thirds of the circle bare.
 *
 *  The copies are folded in here instead: arm i takes the sector `[10, 120, 240][i % 3]`, i.e. the
 *  source's own three offsets, distributed across the fan rather than stacked on top of it. Same
 *  scale ladder, same base angles, same 3-fold spread, a THIRD of the fills. The resulting anchors
 *  run 50/70/70/90/90/130/130/145/200/248/250/260/280/310/350 — no gap wider than 60°, which each
 *  arm's own ~90° sweep closes.
 *
 *  This is what makes the rotation affordable: the arms are the only part of the artwork that
 *  moves, so they are the part that re-rasterises every frame. */
const SUNBURST_FAN: readonly (readonly [number, number])[] = [
  [0.12, 70],
  [0.2, 130],
  [0.25, 280],
  [0.3, -10],
  [0.4, 90],
  [0.5, 260],
  [0.6, 70],
  [0.7, 130],
  [0.835, 200],
  [0.9, 50],
  [1.05, 145],
  [1.2, 248],
  [1.333, -50],
  [1.45, 90],
  [1.6, 250],
];

/** The core's falloff, as ONE gradient's stop ladder — DERIVED, not redrawn.
 *
 *  The source builds its core from THIRTEEN concentric circles: a base disc at r=3000 plus a stack
 *  of twelve rings (r=2000…250) inside a `<g opacity='0.5'>`. Eight of those cover the whole frame.
 *  That is ~9 full-frame gradient fills plus an offscreen buffer to composite the group — every one
 *  of them re-run on every frame of the rotation, purely to shape a falloff curve that a single
 *  radial gradient can simply STATE.
 *
 *  THE CURVE IS REPRODUCED EXACTLY, INCLUDING ITS BANDING. The ring stack does not fade smoothly:
 *  the rings are OPAQUE (gradient `a` has no stop-opacity), drawn largest-first, so at any radius
 *  the SMALLEST ring still covering it wins outright — and where a ring ends, the tone jumps. Those
 *  twelve hard steps are a real feature of the artwork, the concentric rings you can see in it. A
 *  naive single gradient would smooth them away. This ladder keeps them by emitting a PAIR of stops
 *  at each ring boundary (two stops at one offset is a hard edge in SVG): the inner value, then the
 *  outer one.
 *
 *  So the maths below is not a fit or an approximation — it is the source's own compositing
 *  arithmetic, evaluated at build time instead of by the rasteriser on every frame. Change a radius
 *  in SUNBURST_RINGS and the gradient follows automatically. */
const SUNBURST_RINGS: readonly number[] = [
  2000, 1800, 1700, 1651, 1450, 1250, 1175, 900, 750, 500, 380, 250,
];

/** The burst's outer radius, in artwork units — the disc every glow stop is stated against. */
const SB_OUTER = 3000;

/** The derived ramp as DATA: `[offset, greyLevel]` pairs, offsets ascending with a deliberate
 *  repeat at each ring boundary (a repeated offset is a hard edge — the artwork's banding).
 *  This is the single source for both renderers: the canvas FX consumes it directly. */
const SUNBURST_GLOW_RAMP: readonly (readonly [number, number])[] = (() => {
  const OUTER = SB_OUTER;
  const GROUP_ALPHA = 0.5; // the source's <g opacity='0.5'> around the ring stack
  const asc = [...SUNBURST_RINGS].sort((a, b) => a - b);
  // Gradient `a` is objectBoundingBox on a circle centred at the origin, so its offset at radius r
  // of a disc of radius R is exactly r/R — a straight ramp from the hot centre to the ground tone.
  const tone = (r: number, R: number): number => SB_LIGHT + (SB_DARK - SB_LIGHT) * (r / R);
  // The stack renders opaque and largest-first, so the smallest ring still covering r is on top.
  const ringAt = (r: number): number | null => {
    const R = asc.find((x) => x >= r);
    return R === undefined ? null : tone(r, R);
  };
  const mix = (base: number, ring: number | null): number =>
    ring === null ? base : base * (1 - GROUP_ALPHA) + ring * GROUP_ALPHA;
  const stop = (r: number, v: number): readonly [number, number] => [
    Number((r / OUTER).toFixed(4)),
    Math.round(v),
  ];

  const parts: (readonly [number, number])[] = [stop(0, mix(tone(0, OUTER), ringAt(0)))];
  for (const R of asc) {
    // Approaching R from INSIDE: ring R is the one on top, at its own outer edge (the dark end).
    parts.push(stop(R, mix(tone(R, OUTER), tone(R, R))));
    // Immediately OUTSIDE R: the next ring up takes over, which is lighter at this radius — the
    // step that makes the band. Past the largest ring there is none, so the base shows alone.
    const next = asc.find((x) => x > R);
    parts.push(stop(R, mix(tone(R, OUTER), next === undefined ? null : tone(R, next))));
  }
  parts.push(stop(OUTER, tone(OUTER, OUTER)));
  return parts;
})();
const sunburst: BackdropDesign = {
  name: "sunburst",
  css: `.mc-backdrop--sunburst {
  /* The design's whole colour story — see the note on the design above. The artwork is grey; this
     takes the ground's hue and saturation and the artwork's LIGHTNESS, so the burst reads as light
     on the slide's own plane colour instead of as a grey film over it. Note there is no identity
     value here: the layer sets the lightness of the whole frame, so SB_DARK moves the entire plane.
     overlay / soft-light are the anchored-at-mid-grey alternatives if that is not wanted; lighten
     is NOT a substitute (it flattens every ground darker than mid-grey). */
  mix-blend-mode: luminosity;
}
.mc-backdrop--sunburst canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}`,
  build: ({ ctx }) => {
    // idPrefix === compId for a treatment root (children never build the backdrop). The canvas
    // MUST carry a per-scene class: `backdrop` anims are not run through qualifyAnim and the
    // render's `q` is document-wide (sub-composition.ts), so an unscoped selector would let one
    // scene's paint loop grab another scene's canvas in the shared render DOM.
    const canvasClass = `${ctx.idPrefix}-sun`;
    return {
      node: rootElement(
        `<div class="mc-backdrop mc-backdrop--sunburst"><canvas class="${canvasClass}" width="1920" height="1080"></canvas></div>`,
      ),
      anims: [
        {
          kind: "backdrop",
          target: canvasClass,
          time: { at: "seconds", t: 0 },
          // THE ARTWORK TRAVELS IN THE DESCRIPTOR. mc.js knows how to draw a sunburst but not
          // what this one looks like — the path, the fan and the glow ramp all ship from here, so
          // this file stays the single source of truth for the design and the FX stays generic.
          // (`opts` values are string | number | boolean, so the two lists go as JSON.)
          opts: {
            fn: "sunburstBg",
            // One ease-less turn across the whole scene — constant rate, never starting or
            // stopping, which is what reads as a continuous loop. `deg` is a TOTAL, not a rate,
            // so a long slide turns more GENTLY rather than further (a 6s slide and a 20s slide
            // both end at -24°). Negative = counter to the arms' own curl, so they read as
            // unwinding outward rather than the picture being dragged around; flip to reverse.
            deg: -24,
            // The artwork's own coordinate system: a 2000-unit-wide authoring space, the burst
            // anchored at its ORIGIN — which, with the canvas filling the frame, puts the sun on
            // the frame's TOP-LEFT corner. Move it by moving these.
            viewW: 2000,
            originX: 0,
            originY: 0,
            outer: SB_OUTER,
            armPath: SUNBURST_ARM,
            armLen: 1550,
            fan: JSON.stringify(SUNBURST_FAN),
            glow: JSON.stringify(SUNBURST_GLOW_RAMP),
            // The three greys, and the veil's alpha — the whole palette (see SB_LIGHT/MID/DARK).
            ground: SB_DARK,
            armInner: SB_MID,
            armOuter: SB_DARK,
            veilInner: SB_LIGHT,
            veilOuter: SB_DARK,
            veilAlpha: 0.6,
          },
        },
      ],
    };
  },
};

// --- The one colour outside the CSS custom-property system ------------------
// Every other colour in this library is a role var (`var(--primary)`) and anything
// lighter/darker/translucent is derived with color-mix(). The constellation mask
// cannot play by that rule: its network is painted into a <canvas> by MC.particleBg,
// which needs a raw `"r,g,b"` triple for strokeStyle/fillStyle. Canvas 2D reads no
// CSS custom properties and color-mix() cannot reach a JS opt, so the value has to be
// a literal by the time it lands in the anim descriptor. Instead of hardcoding one,
// we RESOLVE it at build time from the active theme's --primary swatch — the palette
// stays the single source of truth, and a theme swap recolours the particles for free.

/** `#rgb` / `#rrggbb` → `"r,g,b"`. Null for anything unparseable, so a malformed
 *  swatch degrades to the fallback rather than emitting a broken canvas opt. */
const hexToRgbTriple = (hex: string): string | null => {
  const raw = hex.trim().replace(/^#/, "");
  const full = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = Number.parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

/** future's cyan (#34E1FF) — the value this mask shipped with, kept as the fallback
 *  for a theme that declares no `palette` (the field is optional on ThemeTokens). */
const PARTICLE_RGB_FALLBACK = "52,225,255";

/** The particle colour for a theme: its --primary swatch, as an `"r,g,b"` triple. */
const particleRgb = (theme: ThemeTokens): string => {
  const hex = theme.palette?.find((sw) => sw.varName === "primary")?.hex;
  return (hex ? hexToRgbTriple(hex) : null) ?? PARTICLE_RGB_FALLBACK;
};

/** constellation — an ANIMATED seeded particle network (a --primary node graph, cyan
 *  under future) painted on a
 *  full-bleed canvas over the ground; future's canonical backdrop. The motion is driven off
 *  the scene timeline by the `backdrop` anim-kind (MC.particleBg in mc.js) — deterministic
 *  (seed = compId, no rAF/Date.now), so seeking any frame repaints identically. The canvas
 *  carries a compId-scoped class because backdrop anims are NOT run through qualifyAnim and
 *  the render's `q` is document-wide (sub-composition.ts) — the scoped class keeps each
 *  scene's `q(".<compId>-bg")` resolving to its OWN canvas in the shared render DOM. */
const constellation: BackdropDesign = {
  name: "constellation",
  css: `.mc-backdrop--constellation canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}`,
  build: ({ ctx, theme }) => {
    // idPrefix === compId for a treatment root (children never build the backdrop).
    const canvasClass = `${ctx.idPrefix}-bg`;
    return {
      node: rootElement(
        `<div class="mc-backdrop mc-backdrop--constellation"><canvas class="${canvasClass}" width="1920" height="1080"></canvas></div>`,
      ),
      anims: [
        {
          kind: "backdrop",
          target: canvasClass,
          time: { at: "seconds", t: 0 },
          // colorRgb is the theme's --primary, resolved at build time (see particleRgb
          // above — canvas JS can't read a CSS var); seed = compId → deterministic per scene.
          opts: { fn: "particleBg", seed: ctx.compId, colorRgb: particleRgb(theme), opacity: 0.8 },
        },
      ],
    };
  },
};

/** The mask designs, keyed by name. `plain` is intentionally absent — it means "no
 *  mask" and `buildBackdrop` returns null for it (byte-identical to a bare ground).
 *  Designs are SHARED and uncurated: every theme may use every one of them (a design
 *  names no theme-specific token — it paints through its `--<design>-ink` hook), so
 *  there is no per-theme roster here. A theme names only its DEFAULT, `ThemeTokens.backdrop`.
 *  (Contrast `ThemeTokens.decorations`, which IS an exclusive roster.) */
export const BACKDROPS: Record<string, BackdropDesign> = { dots, constellation, gradient, grid, hatch, sunburst };

/**
 * EVERY design's rules in one sheet — the shared overlay base once, then each design's
 * own block. Staged by the harness as a project's read-only `assets/backdrops.css` and
 * linked from the root; injected into the WebUI preview shadow by engine/mount.ts. The
 * whole sheet ships regardless of which design a deck uses: it is ~1KB, it costs one
 * link, and a deck whose storyboard re-points a scene's backdrop then needs no restaging.
 *
 * WHY IT IS A STAGED SHEET AND NOT PART OF THE SCENE. It used to be emitted into each
 * `compositions/sNN-*.html` `<style>`, scoped under `.<compId>-root`. That file is
 * WRITABLE by the Pi polish agent, and a shipped deck came back with the gradient wash's
 * deliberately-oversized inner div (`-25%` / `150%`, sized so a centre rotation never
 * swings a corner into frame) rewritten to `2.5%` / `95%` with a `max-width: 100vw`
 * clamp — an "overflow fix" that instead inset the wash by 2.5% on every side and left a
 * ring of bare ground around two slides for their whole duration. `assets/` is read-only
 * to the agent, so moving the rules here makes that edit structurally impossible rather
 * than merely discouraged. (`theme/custom.css` is still linked last and can still
 * override these rules deck-wide — that is its job, and unlike a per-scene edit it is one
 * visible file rather than a silent divergence baked into a hand-locked composition.)
 *
 * Ordering note: these rules are theme-agnostic structure. Each design paints through its
 * own `--<design>-ink` hook, which the active theme sets on `.block-frame` in its
 * frame.css — a custom property resolved at use time, so this sheet may be linked before
 * or after tokens.css without changing the result.
 */
export const BACKDROPS_CSS = [BACKDROP_BASE, ...Object.values(BACKDROPS).map((d) => d.css)].join("\n");

/**
 * Resolve a backdrop design to its built parts, or null when there is no mask to
 * paint (`plain`, or an unknown name — degrade to no overlay rather than throw).
 */
export const buildBackdrop = (name: BackdropName | string, input: BackdropInput): BackdropResult | null => {
  if (name === "plain") return null;
  const design = BACKDROPS[name];
  return design ? design.build(input) : null;
};
