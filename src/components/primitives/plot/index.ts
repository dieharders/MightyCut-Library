import geometryCss from "./geometry.css" with { type: "text" };
import template from "./template.html" with { type: "text" };
import { component } from "../../runtime/component";
import { esc } from "../../runtime/dom";
import { plotAnim } from "./anim";
import { H, PAD_BOTTOM, PAD_TOP, PAD_X, PAD_X_PCT, PLOT_BOX_REM, W } from "./metrics";
import { PlotSchema, type PlotParams } from "./schema";

/** X of point `i`, edge to edge across the padded box. `n` is at least 2 (the schema's `min`), so
 *  the `n - 1` divisor is safe. */
const xAt = (i: number, n: number): number => PAD_X + (i / (n - 1)) * (W - 2 * PAD_X);

/**
 * The gridline positions, as fractions of the padded plot box, top (the scale's `max`) to
 * bottom (its `min`).
 *
 * ONE source, read by the gridlines and by the tick labels, because an axis whose numbers sit
 * anywhere but ON its lines is worse than no axis: it is a scale the viewer will read off and
 * get wrong. Every line is labelled and every label is on a line, by construction rather than
 * by two lists agreeing.
 *
 * A FLAT SERIES GETS ONE LINE. When `max === min` the scale has no extent, so three lines would
 * carry three copies of the same number at three different heights while the data sat on the
 * middle one — an axis claiming that the top and the bottom of the box are both 50. One line,
 * labelled once, with the series on it, is the truthful drawing of a flat series.
 */
const gridTs = (p: PlotParams): readonly number[] => (p.max === p.min ? [0.5] : [0, 0.5, 1]);

/** Y of a gridline fraction, in viewBox units. */
const gridY = (t: number): number => PAD_TOP + t * (H - PAD_TOP - PAD_BOTTOM);

/** Y of `v`, in viewBox units. A flat series (max === min) sits on the middle line rather than
 *  dividing by zero.
 *
 *  THERE IS NO CLAMP. There used to be, and once the gridlines were labelled it became a way for
 *  the chart to contradict itself: a value past `max` was pinned onto the top line and then
 *  printed its own true figure beside it, so a point reading "200" sat exactly on the line
 *  reading "100". The scale is required to contain the series instead (schema.ts), which is an
 *  authoring error the deck can fix rather than a drawing error it cannot see. */
const yAt = (v: number, min: number, max: number): number => {
  const span = max - min;
  const t = span === 0 ? 0.5 : (max - v) / span;
  return PAD_TOP + t * (H - PAD_TOP - PAD_BOTTOM);
};

/** Fixed to 2 decimals: enough for sub-pixel accuracy at any canvas, and short enough that the
 *  emitted markup stays byte-stable and diffable. */
const n2 = (v: number): string => v.toFixed(2);

/** A viewBox x as a percentage of the box — the unit every HTML overlay is positioned in. */
const pctX = (x: number): string => n2((x / W) * 100);
/** A viewBox y as a percentage of the box. */
const pctY = (y: number): string => n2((y / H) * 100);

/**
 * How many decimal places a figure needs to be TRUE, starting from the author's `decimals`.
 *
 * `decimals` is what the deck asked for, and against a scale it is a floor rather than an
 * instruction: the gridlines land where the arithmetic puts them, and printing "31" beside a
 * line drawn at 30.5 is an axis that lies about where it is. So a value that does not survive
 * its own rounding gets the places it needs and one that does is left alone — 61 prints "61",
 * 30.5 prints "30.5", 0.005 prints "0.005".
 *
 * BOTH the ticks and the point labels go through this, which is the property that matters. The
 * old rule bumped the ticks alone and capped the bump at one place, so a series of 0.5 and 2.5
 * at the default `decimals: 0` drew its maximum exactly ON the top gridline while labelling the
 * point "3" and the line "2.5", and a scale of 0…0.01 labelled two different lines "0.0". One
 * rule, applied to every figure in the chart, cannot disagree with itself.
 *
 * The comparison is RELATIVE rather than exact because tick values are arithmetic on floats: a
 * midpoint of 3.6 can arrive as 3.6000000000000005, and an exact `===` would chase it to sixteen
 * places. `CAP` bounds the search for a figure no decimal expansion terminates on (a third, a
 * recurring rate); at the cap the number is printed as accurately as a fixed-width figure can.
 */
const CAP = 4;
const decimalsFor = (v: number, floor: number): number => {
  for (let d = floor; d < CAP; d++) {
    if (Math.abs(Number(v.toFixed(d)) - v) <= Math.abs(v) * 1e-9 + 1e-12) return d;
  }
  return CAP;
};

/**
 * A figure, with the sign OUTSIDE the unit prefix.
 *
 * `"$" + (-20).toFixed(0)` is `$-20`, which is not how a negative currency is written anywhere;
 * the minus belongs in front of the whole figure. The y-axis made this reachable in normal use —
 * `min` is the parameter most likely to be negative on a delta or variance chart — where before
 * only a point value could carry a sign. Taking the absolute value also disposes of negative
 * zero, which `(-0.4).toFixed(0)` would otherwise print as "-0".
 *
 * NOT `runtime/value.ts`'s `finalValueText`, deliberately: that one is pinned byte-for-byte to
 * what `MC.countUp` paints frame by frame, so it cannot grow a decimal rule or move the sign.
 * A plot's figures are static text and are formatted for the SCALE they are read against.
 */
const figure = (v: number, p: PlotParams, withUnits: boolean): string => {
  const digits = Math.abs(v).toFixed(decimalsFor(v, p.decimals));
  const sign = v < 0 ? "-" : "";
  return withUnits ? `${sign}${p.unitPrefix ?? ""}${digits}${p.unitSuffix ?? ""}` : `${sign}${digits}`;
};

/** A point's value label — the figure with its units, exactly as the deck authored them. */
const valueText = (v: number, p: PlotParams): string => figure(v, p, true);

/**
 * A tick's text: the bare number, on the same decimal rule as the point labels.
 *
 * NO UNITS ON THE TICKS, deliberately. They used to carry the full prefix and suffix so that the
 * axis and the figures plotted against it could not read as two different scales — but that is
 * what the shared decimal rule guarantees, and repeating the unit on every line bought nothing
 * while the gutter sized itself off the result: a legal `unitPrefix` + `unitSuffix` pair
 * ("US$MM " … " subscribers") produced ticks 25 characters wide and spent a third of the frame
 * on three copies of the unit. Every point states the unit, which is where a reader is already
 * looking; the axis carries the scale.
 */
const tickText = (v: number, p: PlotParams): string => figure(v, p, false);

/** The value a gridline stands for: `t` 0 is the top of the scale, 1 the bottom.
 *
 *  The ends are returned VERBATIM rather than computed, because `max - 1 * (max - min)` is not
 *  `min` in floating point: a scale of 3…4.2 made its bottom tick 2.9999999999999996, which
 *  reads as an axis that needs a decimal place it does not need. */
const tickValue = (t: number, p: PlotParams): number =>
  t === 0 ? p.max : t === 1 ? p.min : p.min + (p.max - p.min) * (1 - t);

/**
 * The plot's two stretched SVG layers share one wrapper, so their coordinate systems cannot
 * drift: they are stacked exactly on top of each other, and a difference in viewBox or
 * `preserveAspectRatio` would silently un-register the gridlines from the line drawn against
 * them with nothing visibly broken.
 */
const psvg = (inner: string): string =>
  `<svg class="psvg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="presentation">${inner}</svg>`;

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
const frameSvg = (p: PlotParams): string =>
  psvg(
    gridTs(p)
      .map((t) => `<line class="pgrid" x1="0" y1="${n2(gridY(t))}" x2="${W}" y2="${n2(gridY(t))}" />`)
      .join(""),
  );

/** The polyline, and nothing else — this is the layer the entrance wipes open. Geometry only:
 *  every piece of TYPE is HTML (see below), so it sits on the theme's own type scale instead of
 *  being sized in viewBox units. */
const geomSvg = (p: PlotParams): string => {
  const n = p.values.length;
  const pts = p.values.map((v, i) => `${n2(xAt(i, n))},${n2(yAt(v, p.min, p.max))}`).join(" ");
  return psvg(`<polyline class="pline" points="${pts}" fill="none" vector-effect="non-scaling-stroke" />`);
};

/**
 * An axis row: a hidden in-flow SIZER holding the real strings, plus the visible labels
 * positioned absolutely off the point scale.
 *
 * BOTH AXES ARE BUILT BY THIS, because they are the same idea twice and were drifting as two
 * copies. The visible labels contribute no layout, so without something in flow the tick gutter
 * collapses to zero width and the category row to zero height; and sizing off the REAL strings
 * in the REAL face is what keeps a long figure from being cut off or from having a fixed gutter
 * guessed for it.
 */
const axisRow = (
  sizerClass: string,
  labelClass: string,
  posVar: string,
  items: Array<{ pos: string; text: string; extra?: string }>,
): string =>
  `<span class="${sizerClass}">${items.map((i) => `<span>${esc(i.text)}</span>`).join("")}</span>` +
  items
    .map(
      (i) => `<span class="${labelClass}" style="--${posVar}: ${i.pos}${i.extra ?? ""}">${esc(i.text)}</span>`,
    )
    .join("");

/** The y-axis tick labels: one per gridline, positioned in PERCENT off the same scale the lines
 *  are drawn from — the same technique the point values use, and for the same reason (real text
 *  on the theme's type scale rather than SVG `<text>` sized in viewBox units). */
const yAxisHtml = (p: PlotParams): string =>
  axisRow(
    "pysizer",
    "ptick",
    "py",
    gridTs(p).map((t) => ({ pos: `${pctY(gridY(t))}%`, text: tickText(tickValue(t, p), p) })),
  );

/**
 * The category labels, positioned off the SAME percentages as the points rather than laid out as
 * N equal cells.
 *
 * The cell row is what used to force the band scale (see `PAD_X`), and it only ever aligned by
 * coincidence of the two formulas agreeing. Reading the point's own x is exact at any spacing.
 *
 * EACH LABEL GETS A BOX, AND THE BOXES TILE THE ROW. Dropping the cells dropped the only thing
 * keeping eight long labels off each other: absolutely positioned and `nowrap`, they printed on
 * top of one another and the two on the ends ran off the frame. `--lw` is the room a label may
 * occupy — one point pitch when it is centred on its point, and half a pitch plus the end margin
 * for the two that anchor to the box edge, which is exactly the room each has before it meets
 * its neighbour's box. `--la` is the anchor: the ends are pinned INWARD so they cannot leave the
 * plot, which is what keeps the side margin at `PAD_X` rather than growing it to cover half a
 * label.
 */
const labelsHtml = (p: PlotParams): string => {
  const n = p.labels.length;
  const pitch = (100 - 2 * PAD_X_PCT) / (n - 1);
  const endBox = PAD_X_PCT + pitch / 2;
  return axisRow(
    "pxsizer",
    "plab",
    "lx",
    p.labels.map((l, i) => ({
      pos: `${pctX(xAt(i, n))}%`,
      text: l,
      extra:
        i === 0
          ? `; --la: 0%; --lw: ${n2(endBox)}%`
          : i === n - 1
            ? `; --la: -100%; --lw: ${n2(endBox)}%`
            : `; --lw: ${n2(pitch)}%`,
    })),
  );
};

/**
 * The point markers and their value labels, as HTML rather than SVG `<text>`.
 *
 * Positioned in PERCENT off the same scale the polyline uses, so they track the line exactly at
 * any canvas size while remaining real text: the theme's face, the theme's type step, the
 * theme's colour. An SVG `<text>` would be sized in viewBox units, which is the one place in
 * this library where type would not be on the scale.
 *
 * THE END POINTS ANCHOR THEIR FIGURE INWARD (`--va`). A value label is centred on its dot and
 * the end dots sit `PAD_X` from the box, so a wide figure (a long `unitSuffix`, two decimals)
 * hung half of itself over the edge. That used to be un-clipped by giving the wipe a negative
 * side inset, which moved the problem rather than solving it: the overhang then printed on top
 * of the y-axis ticks in the gutter next door. Anchoring costs no horizontal padding at all.
 */
const pointsHtml = (p: PlotParams): string => {
  const n = p.values.length;
  return p.values
    .map((v, i) => {
      const anchor = i === 0 ? "; --va: 0%" : i === n - 1 ? "; --va: -100%" : "";
      return (
        `<div class="ppoint" style="--px: ${pctX(xAt(i, n))}%; --py: ${pctY(yAt(v, p.min, p.max))}%${anchor}">` +
        `<span class="pdot"></span>` +
        `<span class="pval">${esc(valueText(v, p))}</span>` +
        `</div>`
      );
    })
    .join("");
};

/** A line plot: the whole series as one component — gridlines, a polyline, a dot and value per
 *  point, and a category label row. `line-chart`'s only child. */
export const Plot = component({
  name: "plot",
  schema: PlotSchema,
  // THE ROOT CARRIES `data-anim="item"`, like every other content primitive, and it is the
  // WHOLE-ELEMENT entrance's landing pad rather than anything this component animates itself.
  // `component()` builds a picked entrance against `def.animTarget ?? "item"` — and no element
  // in the library sets `animTarget` — so a plot whose root was unmarked emitted a descriptor
  // aimed at a class `stampAnims` never wrote. `MC.applyAnims` skips a missing target silently
  // (`if (!el) continue`), with no build error and no runtime warning, so the editor's
  // transition picker appeared to do nothing on a trend-line and only on a trend-line.
  //
  // It does not collide with the wipe below: the runtime's one-reveal-per-box guard drops a
  // second reveal aimed at the SAME target, and these are two (the root and the clipped
  // wrapper inside it), so a picked entrance moves the whole chart in while the geometry still
  // draws itself.
  template,
  // THE STRUCTURE IS NOT THE THEME'S TO DECIDE — the two-column grid, both sizers, the layered
  // boxes, the label geometry. While it lived in the skins the six sheets were ~93% identical
  // and every fix had to be made six times (and could be made in five and still build). Each
  // theme's plot.css is now paint alone: type, colour, stroke weight, dot size. Same seam the
  // HUD's band uses (primitives/hud/geometry.css).
  css: geometryCss,
  example: {
    labels: ["Q1", "Q2", "Q3", "Q4"],
    values: [18, 34, 29, 61],
    max: 61,
  },
  rawFill: (p) => ({
    frame: frameSvg(p),
    svg: geomSvg(p),
    points: pointsHtml(p),
    yaxis: yAxisHtml(p),
    labels: labelsHtml(p),
  }),
  // The one piece of geometry the SHEET needs, PUBLISHED rather than restated: `--pbox` is the
  // plot's height, which `PAD_TOP` reserves a fraction OF. That was a TypeScript constant and six
  // hand-kept `height: 24rem` declarations with nothing tying them together, so the tripwire
  // guarding the reservation restated it a third time and could only catch a theme drifting from
  // the number the test itself was written with.
  //
  // Nothing else is emitted here. The per-label boxes and anchors are per-ELEMENT and ride each
  // label's own inline style; a `--ppad` for the side margin would have no reader at all, which
  // is exactly what `--pn` was — a custom property that looks like a control and is not one.
  layout: (p): Record<string, string> => ({
    "--pbox": `${PLOT_BOX_REM}rem`,
    ...(p.accent ? { "--pcol": `var(--${p.accent})` } : {}),
  }),
  anim: plotAnim,
});
