/**
 * THE PLOT'S GEOMETRY, WRITTEN DOWN ONCE.
 *
 * These numbers are shared by three consumers that used to restate them: the component (which
 * computes vertices from them), the skins (which size the box they are fractions of), and the
 * tripwires (which check the two agree). The box height in particular was a TypeScript constant
 * and six hand-kept `height: 24rem` declarations with nothing tying them together — so the test
 * guarding the reservation restated it a third time and could only ever catch a theme drifting
 * from the number the test itself was written with, never a wrong shared number.
 *
 * The skin now reads `--pbox` from the component (`layout()`), and the tripwires import from
 * here, so there is one statement of each fact.
 */

/** The plot's own coordinate space. A FIXED aspect ratio, matched by the skin's box, so the SVG
 *  can keep `preserveAspectRatio` and nothing distorts: `none` would stretch the point dots into
 *  ellipses, and the usual escape (`vector-effect: non-scaling-stroke`) fixes only the stroke,
 *  not the geometry. Proportional scaling is also what the rest of the library does — the render
 *  document's canvas-derived root font-size makes every rem a fixed fraction of the frame, and a
 *  proportional viewBox is the same idea in SVG. */
export const W = 1000;
export const H = 400;

/** The height of `.parea`, in rem — the box `PAD_TOP` reserves a fraction OF. Published to the
 *  skins as `--pbox` so a theme cannot silently resize the box the reservation was derived
 *  against. */
export const PLOT_BOX_REM = 24;

/**
 * Headroom for the TOP point's value label, in viewBox units, and it is a computed reservation
 * rather than a round number. The label is absolutely positioned above its dot inside the plot
 * box, so anything the reservation does not cover is not merely tight — it is sliced off, and
 * the deck's highest figure silently disappears (the whole point of plotting it). `max` maps to
 * exactly `PAD_TOP`, so what has to fit above it is the label stack: half a dot + `.pval`'s
 * margin + one line of type.
 *
 * The widest stack across the six themes is block's — 0.5625rem (half its 1.125rem dot) +
 * 0.625rem + 2.25rem (`--font-size-md` at the `line-height: 1` every skin states) ≈ 3.44rem —
 * against `PLOT_BOX_REM`. 3.6rem of the 24 is 15%, i.e. 60 of the 400 viewBox units, which
 * clears it with a little slack. A skin that grows its value type past that budget fails the
 * headroom tripwire (theme-parity.test.ts), which imports this number rather than repeating it.
 */
export const PAD_TOP = 60;

/** Bottom margin, in viewBox units — enough to keep the lowest dot off the baseline rule. */
export const PAD_BOTTOM = 16;

/**
 * Side margin, in viewBox units — the ONLY horizontal padding the plot keeps, and it is
 * deliberately small.
 *
 * The points used to sit on a BAND scale, at cell centres `(i + 0.5) / n`, so the series could
 * never reach the box: a four-point plot started 12.5% in and stopped 12.5% short, spending a
 * quarter of the frame's width on nothing. That was not a design choice, it was the label row's
 * requirement showing through — labels were N equal flex cells, and only a cell-centre scale put
 * one under each point. The labels read the point's own x now, which frees the scale from the
 * row and lets the line use the box it is drawn in.
 *
 * What margin remains is not slack and it does not have to cover a label: the first and last
 * points anchor their figure INWARD (`--va` / `--la`, geometry.css) rather than centring it, so
 * no label crosses the edge and the margin only has to keep the end DOTS off it.
 */
export const PAD_X = 40;

/** `PAD_X` as a percentage of the box — the unit the label boxes are sized in. */
export const PAD_X_PCT = (PAD_X / W) * 100;
