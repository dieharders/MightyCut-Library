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
  /** Authored (unscoped) CSS — the emitter scopes it under `.<compId>-root`. */
  css: string;
  /** Timeline hooks for animated masks (empty for static designs). */
  anims: AnimDescriptor[];
};

export type BackdropDesign = {
  name: string;
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
  build: () => ({
    node: rootElement(`<div class="mc-backdrop mc-backdrop--dots"></div>`),
    css: `${BACKDROP_BASE}
.mc-backdrop--dots {
  opacity: 0.32;
  /* --dots-ink lets a theme repaint the grid: block's ink dots vanish on a dark ground
     (future's --dark abyss on navy is invisible), so future re-points it to cyan. */
  background-image: radial-gradient(circle, var(--dots-ink, var(--dark)) 0.125rem, transparent 0.125rem);
  background-size: 3.625rem 3.625rem;
}`,
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
  build: ({ ctx }) => {
    // idPrefix === compId for a treatment root (children never build the backdrop).
    const washClass = `${ctx.idPrefix}-wash`;
    return {
      node: rootElement(
        `<div class="mc-backdrop mc-backdrop--gradient"><div class="${washClass}"></div></div>`,
      ),
      css: `${BACKDROP_BASE}
.mc-backdrop--gradient {
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
  build: () => ({
    node: rootElement(`<div class="mc-backdrop mc-backdrop--grid"></div>`),
    css: `${BACKDROP_BASE}
.mc-backdrop--grid {
  opacity: 0.14;
  /* --grid-ink: the rule colour. 0.125rem keeps the hairline on the authoring grid. */
  background-image:
    linear-gradient(var(--grid-ink, var(--dark)) 0.125rem, transparent 0.125rem),
    linear-gradient(90deg, var(--grid-ink, var(--dark)) 0.125rem, transparent 0.125rem);
  background-size: 4rem 4rem;
}`,
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
  build: ({ ctx }) => {
    // idPrefix === compId for a treatment root (children never build the backdrop).
    const hueClass = `${ctx.idPrefix}-hue`;
    return {
      node: rootElement(
        `<div class="mc-backdrop mc-backdrop--hatch ${hueClass}"><svg viewBox="0 0 192 108" preserveAspectRatio="none"><g transform="rotate(-22 96 54)">${HATCH_STRIPES}</g></svg></div>`,
      ),
      css: `${BACKDROP_BASE}
.mc-backdrop--hatch {
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
/** sunburst — a RADIAL SPIRAL BURST ("sun tornado"): a soft central glow with three fans of long
 *  spiral arms sweeping out of it. Creative's signature design, contributed to the shared pool like
 *  every other. STATIC for now — see "ROTATION IS NOT WIRED YET" at the bottom of this note.
 *
 *  THIS DESIGN IS THE SOURCE ARTWORK, VERBATIM. `SUNBURST_SVG` below is the authored file byte for
 *  byte — its own greys, its own ground rect, its own thirteen glow circles, its own three stacked
 *  arm fans. Nothing is re-drawn, re-coloured, re-centred or thinned out here. That is deliberate
 *  and it is a REVERSAL: earlier versions of this design pulled the artwork apart to fit the
 *  library's usual conventions (hooks, no colour literals, no ground rect) and to cut its fill
 *  count, and both efforts made it worse — the first washed the colour out, the second did not
 *  measurably help the scroll cost it was aimed at. The artwork ships as drawn.
 *
 *  HOW IT COLOURS ITSELF: GREY + `mix-blend-mode`. This is the whole trick, and it is why the
 *  artwork can keep its literal colours without becoming un-themeable.
 *
 *  The source is painted entirely in greys around a mid-grey (#878787) ground. Under `overlay`,
 *  a 50%-grey blend layer is the IDENTITY — it leaves the backdrop exactly as it found it — and
 *  everything lighter or darker than mid-grey lightens or darkens the backdrop PROPORTIONALLY,
 *  keeping the backdrop's own hue. So the artwork stops being "a grey picture on top of the slide"
 *  and becomes "the slide's own ground colour, lit by a sun". The burst reads amber on creative's
 *  cream, rose on its pink, and green on its green, with no colour arithmetic anywhere: the ground
 *  supplies every hue and the artwork supplies only light and shade.
 *
 *  That replaces the whole `--sunburst-ink` / `sunburstTones()` apparatus this design used to
 *  carry (a theme hook, plus HSL maths that derived a two-tone complement from the scene's ground
 *  at build time). Blending gets the same result — a field that suits every ground — from one CSS
 *  declaration, and gets it for grounds nobody has authored yet. Those hooks and that maths are
 *  deleted, not deprecated; `--sunburst-ink` in a theme's frame.css is now dead and does nothing.
 *
 *  WHY `overlay` AND NOT `lighten`. `lighten` takes the per-channel MAX of artwork and ground, so
 *  a mid-grey artwork would flatten every ground DARKER than mid-grey to flat grey — it would
 *  erase future's navy and block's near-black entirely, which is the opposite of gelling with the
 *  slide. `overlay` is anchored at mid-grey and therefore works in BOTH directions: it lightens a
 *  dark ground and darkens a light one, always through the ground's own hue. If it reads too
 *  strong on some ground, `soft-light` is the same idea with a gentler curve and is a one-word
 *  swap; `opacity` on the layer is the blunt fallback.
 *
 *  WHY A data: URI AND NOT INLINE MARKUP. The artwork is ~59 gradient-filled, near-full-frame
 *  vector shapes. Inline, every one of them is re-rasterised per paint, per scene — with ten
 *  treatment previews on screen at showcase widths past 1800px (each card's burst rasterising at
 *  ~4900px on a side) that is what made the treatments section stutter on scroll. As a background
 *  IMAGE the browser rasterises the SVG ONCE per used size and caches the result, so the 59 fills
 *  collapse to a single cached decode and scrolling re-blits a bitmap. It also makes this file
 *  much smaller: no mini-dom SVG construction, and no per-scene id scoping (an inline SVG's `#a`,
 *  `#b`, `#s`, `#g` would collide across scenes in the shared render DOM — a background image has
 *  no document ids at all, so that entire class of bug is gone).
 *
 *  The cost is that CSS can no longer reach inside the artwork — no custom property can repaint a
 *  stop in a background image. That is exactly the tradeoff we WANT here: the blend mode does the
 *  colouring, so there is nothing left inside worth reaching for.
 *
 *  GEOMETRY. The source's viewBox is 4:3 (2000x1500) and the frame is 16:9, so the image is sized
 *  `cover` (fill the frame, crop the overflow, never distort the spiral — the arms are only round
 *  because their aspect is preserved). Every circle in the artwork is `r=…` with no cx/cy, i.e.
 *  anchored at the viewBox ORIGIN, so the burst centre is the image's top-left corner; with
 *  `background-position: left top` that corner pins to the FRAME's top-left and the arms sweep down
 *  and right across the slide. Moving the sun is one keyword (`left bottom`, `right top`, …).
 *
 *  ROTATION IS NOT WIRED YET, and the geometry above is why it cannot simply be switched on. A
 *  `cover` background pinned to a corner is not concentric with the layer's centre, so rotating
 *  this layer would make the burst ORBIT — the arms would visibly swing across the frame and the
 *  image's cropped edges would sweep into view. Turning it needs the same treatment the previous
 *  implementation used: an oversized SQUARE inner div centred on the burst's anchor point (large
 *  enough that its inscribed circle still covers the frame at every angle), carrying the
 *  background, with the layer clipping the overflow — then `MC.washSpin` drives that inner div.
 *  Deliberately left for the follow-up so the still frame can be judged first. */

/** The source artwork, verbatim (`grey-tornado.svg`). Kept as one string rather than a file read so
 *  the build stays pure and the emitted CSS is byte-identical every time.
 *
 *  DO NOT "TIDY" THIS. The greys are load-bearing (see the blend-mode note above): re-saturating
 *  them, dropping the `#878787` ground rect, or collapsing the stacked glow circles all change what
 *  `overlay` computes against the slide's ground. It is a picture, not a stylesheet. */
const SUNBURST_SVG =
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2000 1500'>` +
  `<rect fill='#878787' width='2000' height='1500'/>` +
  `<defs>` +
  `<radialGradient id='a' gradientUnits='objectBoundingBox'>` +
  `<stop offset='0' stop-color='#D4D4D4'/><stop offset='1' stop-color='#878787'/>` +
  `</radialGradient>` +
  `<linearGradient id='b' gradientUnits='userSpaceOnUse' x1='0' y1='750' x2='1550' y2='750'>` +
  `<stop offset='0' stop-color='#aeaeae'/><stop offset='1' stop-color='#878787'/>` +
  `</linearGradient>` +
  `<path id='s' fill='url(#b)' d='M1549.2 51.6c-5.4 99.1-20.2 197.6-44.2 293.6c-24.1 96-57.4 189.4-99.3 278.6c-41.9 89.2-92.4 174.1-150.3 253.3c-58 79.2-123.4 152.6-195.1 219c-71.7 66.4-149.6 125.8-232.2 177.2c-82.7 51.4-170.1 94.7-260.7 129.1c-90.6 34.4-184.4 60-279.5 76.3C192.6 1495 96.1 1502 0 1500c96.1-2.1 191.8-13.3 285.4-33.6c93.6-20.2 185-49.5 272.5-87.2c87.6-37.7 171.3-83.8 249.6-137.3c78.4-53.5 151.5-114.5 217.9-181.7c66.5-67.2 126.4-140.7 178.6-218.9c52.3-78.3 96.9-161.4 133-247.9c36.1-86.5 63.8-176.2 82.6-267.6c18.8-91.4 28.6-184.4 29.6-277.4c0.3-27.6 23.2-48.7 50.8-48.4s49.5 21.8 49.2 49.5c0 0.7 0 1.3-0.1 2L1549.2 51.6z'/>` +
  `<g id='g'>` +
  `<use href='#s' transform='scale(0.12) rotate(60)'/>` +
  `<use href='#s' transform='scale(0.2) rotate(10)'/>` +
  `<use href='#s' transform='scale(0.25) rotate(40)'/>` +
  `<use href='#s' transform='scale(0.3) rotate(-20)'/>` +
  `<use href='#s' transform='scale(0.4) rotate(-30)'/>` +
  `<use href='#s' transform='scale(0.5) rotate(20)'/>` +
  `<use href='#s' transform='scale(0.6) rotate(60)'/>` +
  `<use href='#s' transform='scale(0.7) rotate(10)'/>` +
  `<use href='#s' transform='scale(0.835) rotate(-40)'/>` +
  `<use href='#s' transform='scale(0.9) rotate(40)'/>` +
  `<use href='#s' transform='scale(1.05) rotate(25)'/>` +
  `<use href='#s' transform='scale(1.2) rotate(8)'/>` +
  `<use href='#s' transform='scale(1.333) rotate(-60)'/>` +
  `<use href='#s' transform='scale(1.45) rotate(-30)'/>` +
  `<use href='#s' transform='scale(1.6) rotate(10)'/>` +
  `</g>` +
  `</defs>` +
  `<g transform='rotate(0 0 0)'><g transform='rotate(0 0 0)'>` +
  `<circle fill='url(#a)' r='3000'/>` +
  `<g opacity='0.5'>` +
  `<circle fill='url(#a)' r='2000'/><circle fill='url(#a)' r='1800'/><circle fill='url(#a)' r='1700'/>` +
  `<circle fill='url(#a)' r='1651'/><circle fill='url(#a)' r='1450'/><circle fill='url(#a)' r='1250'/>` +
  `<circle fill='url(#a)' r='1175'/><circle fill='url(#a)' r='900'/><circle fill='url(#a)' r='750'/>` +
  `<circle fill='url(#a)' r='500'/><circle fill='url(#a)' r='380'/><circle fill='url(#a)' r='250'/>` +
  `</g>` +
  `<g transform='rotate(0 0 0)'>` +
  `<use href='#g' transform='rotate(10)'/>` +
  `<use href='#g' transform='rotate(120)'/>` +
  `<use href='#g' transform='rotate(240)'/>` +
  `</g>` +
  `<circle fill-opacity='0.6' fill='url(#a)' r='3000'/>` +
  `</g></g></svg>`;

/** SVG markup → a `data:` URI safe to drop inside a double-quoted CSS `url("…")`.
 *
 *  Left UNENCODED on purpose: the artwork's single-quoted attributes (which is why the source uses
 *  `'` throughout — swapping them for `"` would break the CSS string), and everything else that is
 *  already a valid URL character. Encoded: `%` first (so it cannot double-encode the escapes added
 *  after it), then `#` — which would otherwise start a URL FRAGMENT and truncate the image at the
 *  first colour literal — then the angle brackets and double quotes, which some parsers and CSP
 *  filters object to inside a url(). Pure and deterministic. */
const svgDataUri = (svg: string): string =>
  `data:image/svg+xml,${svg
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/"/g, "%22")}`;

const SUNBURST_URI: string = svgDataUri(SUNBURST_SVG);

const sunburst: BackdropDesign = {
  name: "sunburst",
  build: () => ({
    node: rootElement(`<div class="mc-backdrop mc-backdrop--sunburst"></div>`),
    css: `${BACKDROP_BASE}
.mc-backdrop--sunburst {
  /* The design's whole colour story — see the note on the design above. The artwork is grey; this
     is what turns it into light on the SLIDE'S OWN ground colour instead of a grey film over it.
     soft-light is the gentler curve if this reads too strong; lighten is NOT a substitute
     (it flattens every ground darker than mid-grey). */
  mix-blend-mode: luminosity;
  /* cover + a corner anchor, not 100% 100%: the source is 4:3 and the frame is 16:9, so
     stretching would visibly oval the spiral arms. The burst's centre is the image's top-left
     corner (every circle is r= with no cx/cy), so "left top" pins the sun to the frame's corner. */
  background-image: url("${SUNBURST_URI}");
  background-size: cover;
  background-position: left top;
  background-repeat: no-repeat;
}`,
    anims: [],
  }),
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
  build: ({ ctx, theme }) => {
    // idPrefix === compId for a treatment root (children never build the backdrop).
    const canvasClass = `${ctx.idPrefix}-bg`;
    return {
      node: rootElement(
        `<div class="mc-backdrop mc-backdrop--constellation"><canvas class="${canvasClass}" width="1920" height="1080"></canvas></div>`,
      ),
      css: `${BACKDROP_BASE}
.mc-backdrop--constellation canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}`,
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
 * Resolve a backdrop design to its built parts, or null when there is no mask to
 * paint (`plain`, or an unknown name — degrade to no overlay rather than throw).
 */
export const buildBackdrop = (name: BackdropName | string, input: BackdropInput): BackdropResult | null => {
  if (name === "plain") return null;
  const design = BACKDROPS[name];
  return design ? design.build(input) : null;
};
