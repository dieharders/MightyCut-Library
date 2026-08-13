import type { AnimDescriptor } from "../../runtime/anim";
import type { PlotParams } from "./schema";

/**
 * ONE LEFT-TO-RIGHT WIPE, and it reveals the line, its points and their values together —
 * which is what a line chart drawing itself looks like.
 *
 * A clip-path wipe, not `strokeDashoffset`. The obvious way to draw a polyline is to dash it
 * and animate the offset, and it cannot be done from here: the SVG is injected as RAW TEXT
 * through the `data-html` seam (fillRaw sets a single text node), so `stampAnims` never walks
 * into it and no element inside the SVG can be given a scoped anim class to target. What IS
 * targetable is the wrapper the raw markup sits in — and clipping that wrapper wipes the
 * geometry and the HTML point overlay in one pass, which the dash trick could not do anyway.
 *
 * `wipeIn`, NOT `from`, and that distinction is the whole reason this comment is long.
 *
 * A `from` clip-path tween interpolates toward the element's COMPUTED value, and Blink
 * MINIFIES an inset(): it drops the 4th component when left == right and the 3rd when
 * bottom == top. The skins used to state `clip-path: inset(0 -6% 0 -6%)` as the end value, so
 * the computed string was the two-component `inset(0px -6%)` — and GSAP pairs the components
 * of the two strings POSITIONALLY. A four-component from-state against a two-component end
 * value therefore fed the from-state's `100%` into the LEFT inset as well as the right, and
 * the entrance played as a symmetric centre-out reveal rather than a wipe, in every theme, on
 * every plot. It passed every test: the authored strings were exactly what the tripwire
 * pinned, and the collapse happens in the browser's serializer.
 *
 * `wipeIn` states BOTH endpoints in mc.js, so GSAP only ever sees strings the library wrote
 * and the computed value never enters. That also means NO SKIN STATES A CLIP-PATH — the
 * wipe is a behaviour of the component, and it was only ever pushed into six stylesheets
 * because `from` needed something to interpolate toward.
 *
 * THE INSETS ARE PLAIN, with no negative side allowance, because there is no longer an
 * overhang to un-clip: the first and last points anchor their value label INWARD from the box
 * edge instead of centring it on the point (primitives/plot/geometry.css), so nothing hangs
 * over the edge to be cut in half. Un-clipping the sides was the previous answer, and it
 * traded the cut label for one printed over the y-axis ticks in the gutter next door.
 */
/** The wipe's own offset into the plot's cascade slot, and how long it runs. Separate constants
 *  because the pair is READ BACK: line-chart times its caption to land after the chart has
 *  finished drawing, and a hand-copied number there would drift the moment either moves here. */
const WIPE_AT = 0.15;
const WIPE_DUR = 1.1;

/** How long the plot takes to draw, measured from the head of its cascade slot. */
export const PLOT_DRAW_SEC = WIPE_AT + WIPE_DUR;

export const plotAnim = (_p: PlotParams): AnimDescriptor[] => [
  {
    kind: "wipeIn",
    target: "wipe",
    time: { at: "line", n: 0, plus: WIPE_AT },
    opts: { dur: WIPE_DUR, ease: "power2.out" },
  },
];
