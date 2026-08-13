import template from "./template.html" with { type: "text" };
import { component } from "../../runtime/component";
import { plotAnim } from "./anim";
import { PlotSchema, type PlotParams } from "./schema";

// The plot's own coordinate space. A FIXED aspect ratio, matched by the skin's `aspect-ratio`,
// so the SVG can keep `preserveAspectRatio` and nothing distorts: `none` would stretch the
// point dots into ellipses, and the usual escape (`vector-effect: non-scaling-stroke`) fixes
// only the stroke, not the geometry. Proportional scaling is also what the rest of the library
// does — the render document's canvas-derived root font-size makes every rem a fixed fraction
// of the frame, and a proportional viewBox is the same idea in SVG.
const W = 1000;
const H = 400;
/**
 * Headroom for the TOP point's value label, and it is a computed reservation rather than a
 * round number. The label is absolutely positioned above its dot INSIDE `.pwipe`, which is
 * clip-path-clipped for the entrance wipe — so anything the padding does not reserve is not
 * merely tight, it is sliced off and the deck's highest figure silently disappears (the whole
 * point of plotting it). `max` maps to exactly `PAD_TOP`, so what has to fit above it is the
 * label stack: half a dot + `.pval`'s margin + one line of type.
 *
 * The widest stack across the six themes is block's — 0.5625rem (half its 1.125rem dot) +
 * 0.625rem + 2.25rem (`--font-size-md` at the `line-height: 1` every skin now states) ≈
 * 3.44rem — against the 24rem plot box every theme's `.pwipe` declares. 3.6rem of the 24
 * is 15%, i.e. 60 of the 400 viewBox units, which clears it with a little slack. A skin that
 * grows its value type or its plot box past that budget must move this with it.
 */
const PAD_TOP = 60;
const PAD_BOTTOM = 16;

/**
 * Side margin, in viewBox units — the ONLY horizontal padding the plot keeps.
 *
 * The points used to sit on a BAND scale, at cell centres `(i + 0.5) / n`, so the series could
 * never reach the box: a four-point plot started 12.5% in and stopped 12.5% short, spending a
 * quarter of the frame's width on nothing. That was not a design choice, it was the label row's
 * requirement showing through — labels were N equal flex cells, and only a cell-centre scale put
 * one under each point. The labels are positioned off the same percentages now (`labelsHtml`),
 * which frees the scale from the row and lets the line use the box it is drawn in.
 *
 * A margin is still kept, and it is not slack: every point carries a value label CENTRED on it,
 * so the two end points hang theirs over the edge. 4% covers a short figure outright and the
 * clip's own side allowance (plot/anim.ts) covers a long one.
 */
const PAD_X = 40;

/** X of point `i`, edge to edge across the padded box. `n` is at least 2 (the schema's `min`), so
 *  the `n - 1` divisor is safe. */
const xAt = (i: number, n: number): number => PAD_X + (i / (n - 1)) * (W - 2 * PAD_X);

/**
 * The gridline positions, as fractions of the padded plot box, top (the scale's `max`) to
 * bottom (its `min`).
 *
 * ONE array, read by the gridlines, by the y-axis line's extent and by the tick labels, because
 * an axis whose numbers sit anywhere but ON its lines is worse than no axis: it is a scale the
 * viewer will read off and get wrong. Every line is labelled and every label is on a line, by
 * construction rather than by two lists agreeing.
 */
const GRID_T = [0, 0.5, 1] as const;

/** Y of a gridline fraction, in viewBox units. */
const gridY = (t: number): number => PAD_TOP + t * (H - PAD_TOP - PAD_BOTTOM);

/** Y of `v`, clamped into the padded plot box. A flat series (max === min) sits on the middle
 *  line rather than dividing by zero. */
const yAt = (v: number, min: number, max: number): number => {
  const span = max - min;
  const t = span === 0 ? 0.5 : (v - min) / span;
  const clamped = Math.min(1, Math.max(0, t));
  return PAD_TOP + (1 - clamped) * (H - PAD_TOP - PAD_BOTTOM);
};

/** Fixed to 2 decimals: enough for sub-pixel accuracy at any canvas, and short enough that the
 *  emitted markup stays byte-stable and diffable. */
const n2 = (v: number): string => v.toFixed(2);

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fmt = (v: number, p: PlotParams): string =>
  `${p.unitPrefix ?? ""}${v.toFixed(p.decimals)}${p.unitSuffix ?? ""}`;

/**
 * The chart's FRAME — the gridlines — as its own SVG, drawn OUTSIDE the wipe and therefore
 * present from the scene's first frame.
 *
 * The split is what an axis is for. A wiped scale arrives with the data it is meant to be read
 * against, which measures nothing; and the tick labels beside it are HTML in an unclipped
 * column, so leaving the lines under the clip would show three numbers floating against nothing
 * for the length of the entrance. Static frame, animated data — the category labels under the
 * plot have always worked this way, so this makes the plot consistent with its own x-axis rather
 * than introducing a new idea.
 *
 * THERE IS NO VERTICAL AXIS RULE, deliberately. The y-axis is its TICKS: the gridlines already
 * carry the eye across from each number, so a rule down the left adds a box edge without adding
 * a reading. It was drawn once and removed.
 */
const frameSvg = (): string => {
  const rows = GRID_T.map((t) => {
    const y = n2(gridY(t));
    return `<line class="pgrid" x1="0" y1="${y}" x2="${W}" y2="${y}" />`;
  }).join("");
  return (
    `<svg class="psvg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="presentation">` +
    rows +
    `</svg>`
  );
};

/** The polyline, and nothing else — this is the layer the entrance wipes open. Geometry only:
 *  every piece of TYPE is HTML (see below), so it sits on the theme's own type scale instead of
 *  being sized in viewBox units. */
const geomSvg = (p: PlotParams): string => {
  const n = p.values.length;
  const pts = p.values.map((v, i) => `${n2(xAt(i, n))},${n2(yAt(v, p.min, p.max))}`).join(" ");
  return (
    `<svg class="psvg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="presentation">` +
    `<polyline class="pline" points="${pts}" fill="none" vector-effect="non-scaling-stroke" />` +
    `</svg>`
  );
};

/** The value a gridline stands for: `t` 0 is the top of the scale, 1 the bottom. */
const tickValue = (t: number, p: PlotParams): number => p.max - t * (p.max - p.min);

/**
 * A tick's text — formatted exactly like a POINT's value (same prefix, suffix and decimals), so
 * the axis and the figures plotted against it cannot read as two different scales.
 *
 * The one departure: a tick that lands between two integers keeps a decimal place it would
 * otherwise round away. The middle gridline of an odd span (0…61) is at 30.5, and printing "31"
 * beside a line drawn at 30.5 is an axis that lies about where it is — a small error in the
 * number, but the axis is the thing the whole chart is measured against.
 */
const tickText = (v: number, p: PlotParams): string =>
  fmt(v, { ...p, decimals: Math.max(p.decimals, Number.isInteger(v) ? 0 : 1) });

/**
 * The y-axis tick labels: one per gridline, positioned in PERCENT off the same scale the lines
 * are drawn from — the same technique the point values use, and for the same reason (real text
 * on the theme's type scale, rather than SVG `<text>` sized in viewBox units).
 *
 * The leading span is a hidden SIZER holding every tick, and it is what gives the axis column
 * its width. The visible ticks are absolutely positioned, so they contribute NO width — left to
 * them the column would collapse to zero and the numbers would sit on top of the plot. Sizing
 * off the real strings in the real face is also what keeps a long figure ("$1,250") from being
 * cut off or from having a fixed gutter guessed for it: the gutter is exactly as wide as the
 * widest tick, whatever the theme's font does with digits.
 */
const yAxisHtml = (p: PlotParams): string => {
  const texts = GRID_T.map((t) => esc(tickText(tickValue(t, p), p)));
  const sizer = `<span class="pysizer">${texts.map((t) => `<span>${t}</span>`).join("")}</span>`;
  const ticks = GRID_T.map(
    (t, i) => `<span class="ptick" style="--py: ${n2((gridY(t) / H) * 100)}%">${texts[i]}</span>`,
  ).join("");
  return sizer + ticks;
};

/**
 * The point markers and their value labels, as HTML rather than SVG `<text>`.
 *
 * Positioned in PERCENT off the same band scale the polyline uses, so they track the line
 * exactly at any canvas size while remaining real text: the theme's face, the theme's type
 * step, the theme's colour. An SVG `<text>` would be sized in viewBox units, which is the one
 * place in this library where type would not be on the scale.
 */
const pointsHtml = (p: PlotParams): string => {
  const n = p.values.length;
  return p.values
    .map((v, i) => {
      const left = n2((xAt(i, n) / W) * 100);
      const top = n2((yAt(v, p.min, p.max) / H) * 100);
      return (
        `<div class="ppoint" style="--px: ${left}%; --py: ${top}%">` +
        `<span class="pdot"></span>` +
        `<span class="pval">${esc(fmt(v, p))}</span>` +
        `</div>`
      );
    })
    .join("");
};

/**
 * The category labels, positioned off the SAME percentages as the points rather than laid out as
 * N equal cells.
 *
 * The cell row is what used to force the band scale (see `PAD_X`), and it only ever aligned by
 * coincidence of the two formulas agreeing. Reading the point's own x is exact at any spacing,
 * and it is the same technique the point values and the y-axis ticks already use.
 *
 * The leading span is a hidden SIZER, for the same reason the tick column has one: the labels
 * are absolutely positioned and contribute no height, so without one in flow the row collapses
 * and the caption below slides up under the plot. It holds a real label so the row is exactly
 * one line of the theme's own type.
 */
const labelsHtml = (p: PlotParams): string => {
  const n = p.labels.length;
  const sizer = `<span class="pxsizer">${esc(p.labels[0] ?? "")}</span>`;
  const labels = p.labels
    .map((l, i) => `<span class="plab" style="--lx: ${n2((xAt(i, n) / W) * 100)}%">${esc(l)}</span>`)
    .join("");
  return sizer + labels;
};

/** A line plot: the whole series as one component — gridlines, a polyline, a dot and value per
 *  point, and a category label row. `line-chart`'s only child. */
export const Plot = component({
  name: "plot",
  schema: PlotSchema,
  template,
  example: {
    labels: ["Q1", "Q2", "Q3", "Q4"],
    values: [18, 34, 29, 61],
    max: 61,
  },
  rawFill: (p) => ({
    frame: frameSvg(),
    svg: geomSvg(p),
    points: pointsHtml(p),
    yaxis: yAxisHtml(p),
    labels: labelsHtml(p),
  }),
  // `--pn` (the point count) is gone with the label row's equal cells — it had exactly one
  // reader, `grid-template-columns: repeat(var(--pn), 1fr)`, and a custom property nothing
  // consumes is a prop that looks like a control and is not one.
  layout: (p): Record<string, string> =>
    p.accent ? { "--pcol": `var(--${p.accent})` } : {},
  anim: plotAnim,
});
