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

/** X of point `i` on a BAND scale — points sit at cell CENTRES, not at the box edges, so the
 *  HTML label row underneath (N equal flex cells) lines up with them exactly. Edge-to-edge
 *  spacing (i / (n-1)) would put the first and last labels half a cell out. */
const xAt = (i: number, n: number): number => ((i + 0.5) / n) * W;

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

/** Gridlines + the polyline. Geometry only — every piece of TYPE is HTML (see below), so it
 *  sits on the theme's own type scale instead of being sized in viewBox units. */
const geomSvg = (p: PlotParams): string => {
  const n = p.values.length;
  const pts = p.values.map((v, i) => `${n2(xAt(i, n))},${n2(yAt(v, p.min, p.max))}`).join(" ");
  const rows = [0, 0.5, 1]
    .map((t) => {
      const y = n2(PAD_TOP + t * (H - PAD_TOP - PAD_BOTTOM));
      return `<line class="pgrid" x1="0" y1="${y}" x2="${W}" y2="${y}" />`;
    })
    .join("");
  return (
    `<svg class="psvg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="presentation">` +
    rows +
    `<polyline class="pline" points="${pts}" fill="none" vector-effect="non-scaling-stroke" />` +
    `</svg>`
  );
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

/** One equal cell per point, so a centred label lands under its point (see xAt). */
const labelsHtml = (p: PlotParams): string =>
  p.labels.map((l) => `<span class="plab">${esc(l)}</span>`).join("");

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
  rawFill: (p) => ({ svg: geomSvg(p), points: pointsHtml(p), labels: labelsHtml(p) }),
  layout: (p): Record<string, string> => ({
    "--pn": String(p.values.length),
    ...(p.accent ? { "--pcol": `var(--${p.accent})` } : {}),
  }),
  anim: plotAnim,
});
