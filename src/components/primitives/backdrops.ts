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

/** sunburst — a SLOWLY TURNING RADIAL BURST: a soft central glow with one round of long spiral
 *  arms sweeping out of it, turning continuously (COUNTER to the arms' own curl) across the scene.
 *  Ported from a generated "sun tornado" SVG (creative's signature design, contributed to the
 *  shared pool like every other). ANIMATED: one `backdrop` descriptor driving MC.washSpin — the
 *  same FX `gradient` already uses, so nothing new is added to mc.js's BACKDROP_FX allowlist.
 *
 *  IT IS PAINTED ONCE. Every element of this design exists exactly once in the markup: ONE fan of
 *  fifteen arms (not three stacked copies of it) and TWO gradient circles (not thirteen inside an
 *  opacity group). The design as ported was ~59 gradient-filled, near-full-frame vector fills plus
 *  two compositing layers PER SCENE, which is the most expensive backdrop in the registry by an
 *  order of magnitude and showed up as scroll jank in the showcase's treatment grid at widths past
 *  1800px (where each card's burst square rasterises at ~4900px on a side). It is 17 fills and one
 *  compositing layer now. SUNBURST_FAN and SUNBURST_GLOW_STOPS carry the details of how each
 *  collapse preserves what it replaced — read those before adding anything back.
 *
 *  HOW IT WAS MADE THEME-NEUTRAL, AND WHY IT IS TWO-TONE. The source is a fully hand-coloured
 *  artwork: an `#ee5522` ground rect, a `#FB3 → #ee5522` radial gradient for the glow and an
 *  `#f7882b → #ee5522` linear gradient on the arms. The ground rect is DROPPED outright (a
 *  backdrop paints OVER the scene's ground — it must never lay down its own). The two gradients
 *  are kept AS gradients, repainted through TWO hooks: `--sunburst-ink` (the bright core tone,
 *  the source's amber) and `--sunburst-ink-2` (the deep outer tone, its burnt orange), with
 *  `-ink-2` falling back through `-ink` exactly as `gradient`'s second hook does — so a theme
 *  that states only the first still gets a coherent single-tone field.
 *
 *  This was first built with ONE hook, reproducing the colour ramp as a single ink at ramping
 *  opacity (`hatch`'s trick). That was a mistake worth recording: alpha can only ever make the
 *  ink LESS present, i.e. closer to the ground, so a one-ink version cannot be anything but
 *  washed out no matter how it is tuned. The source's punch comes from a HUE shift between core
 *  and rim, and a hue shift needs a second colour. `hatch` gets away with one ink because its
 *  stripes are a monochrome ladder; a sunburst is not.
 *
 *  Alpha still does the OTHER job: the arms fade toward their tips and the glow fades to nothing
 *  at the rim, so the field dissolves into whatever ground the scene carries instead of ending on
 *  a hard edge (the source could simply match its outer stops to its own ground rect; a shared
 *  design has no such luxury). Colour carries the richness, alpha carries the blend.
 *
 *  WHY IT IS RE-CENTRED. The source anchors the burst at the viewBox ORIGIN, i.e. the top-left
 *  corner (every circle is `r=…` with no cx/cy) — an artifact of how the generator emits it,
 *  harmless for a still. It is fatal for a ROTATING field: a burst that is not concentric with
 *  its own rotation origin does not spin, it ORBITS, and the arms visibly swing across the frame.
 *  WHERE THE SUN SITS, AND WHY IT STILL TURNS. The source anchors the burst at the viewBox ORIGIN
 *  (every circle is `r=…` with no cx/cy), which puts the centre in a CORNER, off-canvas — so the
 *  frame catches only the long outer arcs sweeping across it. That corner anchoring IS the look and
 *  is kept: the burst centre sits on the frame's BOTTOM-LEFT corner.
 *
 *  The tempting mistake is to re-centre it so it can rotate. That is unnecessary, and it throws the
 *  design away. What a rotation actually requires is that the field be CONCENTRIC WITH ITS OWN
 *  ROTATION ORIGIN — not that it be centred in the frame. A radial field turned about its own
 *  centre maps its painted disc exactly onto itself, so coverage is rotation-INVARIANT and no edge
 *  can ever sweep into view. (Turn it about anything else — the layer's centre, say — and it does
 *  not spin, it ORBITS: the arms visibly swing across the frame.)
 *
 *  GEOMETRY (the caller's job, per MC.washSpin's contract). The turning element is a SQUARE whose
 *  centre is pinned to that bottom-left corner: 280rem on a side at left -140rem / top -72.5rem,
 *  against the 120×67.5rem frame. The only figure that matters is the square's inscribed circle —
 *  half-side 140rem must exceed the distance from the anchor to the far corner,
 *  sqrt(120² + 67.5²) = 137.7rem. It does, so every point of the frame stays inside the square at
 *  every angle. This is why the design does NOT need `gradient`'s 150%/-25% sqrt(2) oversize: that
 *  formula is for a field centred in the frame, and this one is not.
 *
 *  WHY THE SCOPED IDS + CLASS. Sub-compositions are imported into ONE shared DOM, so the SVG's
 *  internal ids (`#s`, the three gradients) would collide across scenes and every scene would
 *  silently resolve to whichever one parsed first. They are prefixed with `ctx.idPrefix`, as is
 *  the rotation target — backdrop anims are NOT run through qualifyAnim and the render's selector
 *  is document-wide. The CSS stays STRUCTURAL (`> div`, element selectors) so the stylesheet
 *  carries no per-scene name and still dedupes by design name across scenes.
 *
 *  Deterministic: the geometry is a pure constant, the ids derive from compId, and the rotation is
 *  a pure function of timeline position — no seed, no clock, no repeat. */
/** `#rgb`/`#rrggbb` → HSL in [0,360) × [0,1] × [0,1]. Null for anything unparseable. */
const hexToHsl = (hex: string): { h: number; s: number; l: number } | null => {
  const raw = hex.trim().replace(/^#/, "");
  const full = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = Number.parseInt(full, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s, l };
};

/** HSL → `#rrggbb`. */
const hslToHex = (h: number, s: number, l: number): string => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x]
    : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = l - c / 2;
  const to = (v: number) => Math.round(Math.min(1, Math.max(0, v + m)) * 255).toString(16).padStart(2, "0");
  return `#${to(r1)}${to(g1)}${to(b1)}`;
};

/**
 * The sunburst's two tones, COMPUTED FROM THE SCENE'S GROUND — the design colours itself instead
 * of being hand-tuned per theme.
 *
 * Why compute rather than let each theme pick: this design's whole job is to read as a field
 * BEHIND content on whatever plane the scene carries, and a hand-picked ink can only ever be right
 * for one of them. Creative alone rotates through six grounds (cream, oat, yellow, pink, orange,
 * green) — a fixed orange swirl is handsome on the cream and muddy on the green. Deriving from the
 * ground fixes every one of them at once, and fixes it for themes not written yet.
 *
 * THE HARMONY IS ANALOGOUS, NOT THE 180° COMPLEMENT — and that is a deliberate reading of the
 * source. The reference artwork is orange arms on an orange ground: same hue family, separated by
 * VALUE. Rotating a full 180° instead lands a blue swirl on creative's cream, a cyan one on its
 * orange and a magenta one on its green — foreign colours that also break creative's own "no fifth
 * accent" rule. So the tones stay in the ground's own family (HUE_SHIFT below) and earn their
 * contrast from lightness and saturation instead. Set HUE_SHIFT to 180 for the true complement;
 * that is the whole switch.
 *
 * Three guards keep it from producing something unusable:
 *   • LIGHTNESS IS PUSHED AWAY FROM THE GROUND. This is the one that matters: a same-hue field at
 *     the ground's own lightness is invisible, which was exactly the earlier "washed out" failure.
 *     On a light ground the tones go darker, on a dark ground lighter.
 *   • SATURATION IS LIFTED off the ground's, so a near-neutral canvas still yields a field with
 *     some colour in it rather than a grey smear...
 *   • …but a FLOOR applies: a ground with essentially no hue (a true white/grey) has no family to
 *     stay in, so the pair goes neutral and the field reads as a tonal grey swirl by design.
 *
 * Deterministic and pure: same theme + same ground ⇒ same two hexes, so the scene still rebuilds
 * byte-identically. Resolved at BUILD time (like `constellation`'s particleRgb) because CSS cannot
 * do hue arithmetic on a custom property.
 */
const sunburstTones = (ground: FrameGround, theme: ThemeTokens): { a: string; b: string } | null => {
  const hex = theme.palette?.find((sw) => sw.varName === ground)?.hex;
  const g = hex ? hexToHsl(hex) : null;
  if (!g) return null; // no palette / unparseable ⇒ emit nothing, CSS falls back to --dark
  // 0 = stay in the ground's own family (the source's look). 180 = the true complement.
  const HUE_SHIFT = 0;
  const NEUTRAL = 0.1; // below this the ground has no hue to stay in
  // The core lifts a touch WARM of the ground and the rim sits a touch cool of it — the same
  // small hue spread the source uses between its amber core and its burnt-orange rim.
  const base = g.h + HUE_SHIFT;
  const s = g.s < NEUTRAL ? 0 : Math.min(0.88, Math.max(0.5, g.s * 1.7));
  // Value contrast, the load-bearing part: a same-hue field at the ground's own lightness is
  // invisible no matter how it is tuned.
  const light = g.l > 0.5;
  const core = light ? Math.max(0.34, g.l - 0.3) : Math.min(0.72, g.l + 0.26);
  const rim = light ? Math.max(0.22, g.l - 0.44) : Math.min(0.86, g.l + 0.4);
  // The spread is kept SMALL (+8/0). The source lifts its core ~26° warmer, but its ground is a
  // red-orange with room to move; the same lift applied to a yellow-ish ground (creative's cream
  // and its yellow ledger) walks straight into green and reads acid. Value does the work; hue only
  // warms the core slightly.
  return { a: hslToHex(base + 8, s, core), b: hslToHex(base, Math.min(0.92, s + 0.06), rim) };
};

const sunburst: BackdropDesign = {
  name: "sunburst",
  build: ({ ctx, ground, theme }) => {
    // idPrefix === compId for a treatment root (children never build the backdrop).
    const p = ctx.idPrefix;
    const spinClass = `${p}-spin`;
    // The computed pair rides the node as INLINE custom properties, so it is per-SCENE (the ground
    // is a per-scene choice) while the stylesheet stays structural and dedupes by design name.
    // A theme that states --sunburst-ink / --sunburst-ink-2 in its frame.css still WINS: the CSS
    // below reads the theme hook FIRST and only falls through to these. Opting out is one line.
    const tones = sunburstTones(ground, theme);
    const autoVars = tones ? ` style="--sunburst-auto: ${tones.a}; --sunburst-auto-2: ${tones.b}"` : "";
    return {
      node: rootElement(
        `<div class="mc-backdrop mc-backdrop--sunburst"${autoVars}><div class="${spinClass}">` +
          // A SQUARE viewBox with the burst dead centre — the square is what sits centred on the
          // frame's corner, so the artwork's centre and the rotation origin are the same point.
          `<svg viewBox="0 0 5000 5000" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">` +
          `<defs>` +
          // The glow: ONE multi-stop falloff from a near-solid core out to nothing at the rim.
          // Colour comes from CSS; the stop ladder is SUNBURST_GLOW_STOPS (see the note there).
          `<radialGradient id="${p}-glow" gradientUnits="objectBoundingBox">${SUNBURST_GLOW_STOPS}</radialGradient>` +
          // The hot core — the second and LAST gradient circle. It is what reads as a light
          // SOURCE rather than a flat disc: a tight bloom sitting inside the broad falloff.
          // Concentric like everything else, so the spin cannot make it orbit.
          `<radialGradient id="${p}-core" gradientUnits="objectBoundingBox">` +
          `<stop class="sb-a" offset="0" stop-opacity="0.45"></stop>` +
          `<stop class="sb-a" offset="1" stop-opacity="0"></stop>` +
          `</radialGradient>` +
          // The arms: near-solid where they leave the core, thinning out along their length. This
          // ramp carries the whole design's tonal range (one ink, varying alpha), so it runs much
          // wider than a gradient's would.
          `<linearGradient id="${p}-arm" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1550" y2="0">` +
          `<stop class="sb-a" offset="0" stop-opacity="1"></stop>` +
          `<stop class="sb-b" offset="1" stop-opacity="0.42"></stop>` +
          `</linearGradient>` +
          `<path id="${p}-s" fill="url(#${p}-arm)" d="${SUNBURST_ARM}"></path>` +
          `</defs>` +
          // The burst centre — the middle of the square viewBox, which the CSS pins to the frame's
          // bottom-left corner. Concentric with the rotation origin (see the note above).
          `<g transform="translate(2500 2500)">` +
          `<circle fill="url(#${p}-glow)" r="3000"></circle>` +
          `<circle fill="url(#${p}-core)" r="750"></circle>` +
          // ONE fan, painted once — no stacked copies. SUNBURST_FAN already carries the
          // round-the-clock spread the three 120° copies used to supply.
          `<g transform="rotate(-86.4)">${SUNBURST_FAN.map((t) => `<use href="#${p}-s" transform="${t}"></use>`).join("")}</g>` +
          `</g></svg></div></div>`,
      ),
      css: `${BACKDROP_BASE}
.mc-backdrop--sunburst {
  /* The design's ONE strength knob — and now genuinely the only one: the opacity group that
     used to wrap the ring stack is gone with the stack. Everything inside is authored at full alpha
     and dialled back here, so a theme reading "too washed out / too heavy" is a single number, not
     a hunt through stacked opacities. This reads as a screen-printed sunray field, not a watermark. */
  opacity: 0.5;
  overflow: hidden;
}
/* The turning square, centred on the frame's BOTTOM-LEFT corner (0, 67.5rem) against the
   120 x 67.5rem frame: 280rem on a side at left -140rem / top -72.5rem. Half-side 140rem clears
   the 137.7rem anchor-to-far-corner distance, so the frame never leaves the square at any angle.
   Authored in rem because the render document's root font-size is viewport-derived, so these are
   canvas-relative — a percentage would resolve against two different bases per axis and could not
   express a square at all. */
.mc-backdrop--sunburst > div {
  position: absolute;
  left: -140rem;
  top: -72.5rem;
  width: 280rem;
  height: 280rem;
  transform-origin: 50% 50%;
}
.mc-backdrop--sunburst svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
/* The two tones. Each stop reads, in order: the THEME's hook (frame.css — an explicit opt-out of
   the auto colouring), then the per-scene COMPLEMENT computed from the ground (inline on the
   layer), then --dark. The second hook additionally falls through the first, matching the
   gradient design's second hook, so a theme that states only one still gets a coherent
   single-tone field. sb-a is the bright core; sb-b the deep rim. */
.mc-backdrop--sunburst .sb-a {
  stop-color: var(--sunburst-ink, var(--sunburst-auto, var(--dark)));
}
.mc-backdrop--sunburst .sb-b {
  stop-color: var(--sunburst-ink-2, var(--sunburst-auto-2, var(--sunburst-ink, var(--dark))));
}`,
      anims: [
        {
          kind: "backdrop",
          target: spinClass,
          time: { at: "seconds", t: 0 },
          // One ease-less turn across the whole scene — constant rate, never starting or
          // stopping, which is what reads as a continuous loop. `deg` is a TOTAL, not a rate, so
          // a long slide turns more GENTLY rather than further (a 6s slide and a 20s slide both
          // end at −24°).
          //
          // NEGATIVE, i.e. COUNTER-CLOCKWISE, and that is the point rather than a sign slip: the
          // arms themselves curl clockwise out of the core, so turning the field the OTHER way
          // makes them read as unwinding/opening outward. Turning WITH the curl (the +24 this
          // shipped at) reads as the whole picture being dragged around instead.
          opts: { fn: "washSpin", deg: -24 },
        },
      ],
    };
  },
};

/** One spiral arm, verbatim from the source artwork (a 1550-unit tapering sweep). */
const SUNBURST_ARM =
  "M1549.2 51.6c-5.4 99.1-20.2 197.6-44.2 293.6c-24.1 96-57.4 189.4-99.3 278.6c-41.9 89.2-92.4 174.1-150.3 253.3c-58 79.2-123.4 152.6-195.1 219c-71.7 66.4-149.6 125.8-232.2 177.2c-82.7 51.4-170.1 94.7-260.7 129.1c-90.6 34.4-184.4 60-279.5 76.3C192.6 1495 96.1 1502 0 1500c96.1-2.1 191.8-13.3 285.4-33.6c93.6-20.2 185-49.5 272.5-87.2c87.6-37.7 171.3-83.8 249.6-137.3c78.4-53.5 151.5-114.5 217.9-181.7c66.5-67.2 126.4-140.7 178.6-218.9c52.3-78.3 96.9-161.4 133-247.9c36.1-86.5 63.8-176.2 82.6-267.6c18.8-91.4 28.6-184.4 29.6-277.4c0.3-27.6 23.2-48.7 50.8-48.4s49.5 21.8 49.2 49.5c0 0.7 0 1.3-0.1 2L1549.2 51.6z";

/** The fan: one arm re-used at fifteen scales and angles, which is what turns a single sweep into
 *  a tornado. THE WHOLE TORNADO IS THIS ONE LIST — it is painted ONCE.
 *
 *  The source (and this design as it first shipped) drew this fan THREE TIMES, at 0/120/240°, to
 *  close the round: an arm sweeps ~90° of arc and the source's fifteen anchors all sit inside a
 *  ±60° wedge, so a single copy left two thirds of the circle bare. That is 45 gradient-filled
 *  1550-unit paths per scene, and it was the bulk of the design's raster cost — at showcase widths
 *  above 1800px the treatment grid goes single-column and each card's burst square is ~4900px on a
 *  side, so those 45 near-full-frame fills are re-rasterised on every scroll tile.
 *
 *  The fix is to spend the copies where they were actually doing work: the 120° offsets are folded
 *  INTO the anchors here (arm i takes the sector `(i % 3) * 120`), so one pass covers the round.
 *  Same scale ladder, same base angles, same 3-fold spread — a third of the fills. The resulting
 *  anchors run 40/60/60/90/90/130/130/145/200/248/250/260/280/300/340, i.e. no gap wider than 60°,
 *  which each arm's own ~90° sweep closes.
 *
 *  Pure constant, no randomness — byte-identical every build. */
const SUNBURST_FAN: readonly string[] = [
  "scale(0.12) rotate(60)",
  "scale(0.2) rotate(130)",
  "scale(0.25) rotate(280)",
  "scale(0.3) rotate(-20)",
  "scale(0.4) rotate(90)",
  "scale(0.5) rotate(260)",
  "scale(0.6) rotate(60)",
  "scale(0.7) rotate(130)",
  "scale(0.835) rotate(200)",
  "scale(0.9) rotate(40)",
  "scale(1.05) rotate(145)",
  "scale(1.2) rotate(248)",
  "scale(1.333) rotate(-60)",
  "scale(1.45) rotate(90)",
  "scale(1.6) rotate(250)",
];

/** The core's falloff, as ONE gradient's stop ladder.
 *
 *  This replaces a stack of twelve concentric translucent discs (r = 2000…250, all sharing the
 *  glow gradient, all inside a `<g opacity="0.32">`). Eight of those discs covered the entire
 *  frame, and the group's opacity forced an offscreen transparency buffer to composite them — so
 *  the core alone cost ~8 full-frame gradient fills plus a compositing layer, per scene, purely to
 *  shape a curve a single gradient can state directly.
 *
 *  The stops are FITTED to what that stack actually painted: the composited alpha of the twelve
 *  discs plus the base disc, sampled at r = 0/250/500/750/1000/1500/2000/2500/3000, came out at
 *  0.97/0.92/0.84/0.73/0.63/0.38/0.20/0.10/0. The ladder below plus the `-core` bloom reproduces
 *  that to within ~0.02 at every sample, so the design's read is unchanged — this is a cost fix,
 *  not a redesign.
 *
 *  The COLOUR crossover sits at the ladder's middle (the inner four stops take the bright core
 *  tone, the outer four the deep rim tone), which is where the old stack's a→b mix landed. */
const SUNBURST_GLOW_STOPS: string = [
  ["0", "0.93", "sb-a"],
  ["0.0833", "0.9", "sb-a"],
  ["0.1667", "0.82", "sb-a"],
  ["0.3333", "0.61", "sb-a"],
  ["0.5", "0.37", "sb-b"],
  ["0.6667", "0.2", "sb-b"],
  ["0.8333", "0.1", "sb-b"],
  ["1", "0", "sb-b"],
]
  .map(([offset, op, cls]) => `<stop class="${cls}" offset="${offset}" stop-opacity="${op}"></stop>`)
  .join("");

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
