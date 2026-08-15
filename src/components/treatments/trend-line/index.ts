import template from "./template.html" with { type: "text" };
import { ACCENT_CYCLE } from "../../../types/palette";
import { Plot } from "../../primitives/plot";
import type { PlotParams } from "../../primitives/plot/schema";
import { esc } from "../../runtime/dom";
import { treatment } from "../../runtime/treatment";
import type { ComponentInstance } from "../../runtime/types";
import { trendLineAnim } from "./anim";
import { TrendLineSchema } from "./schema";

/** The child plots' resolved params, in the order they are drawn. Non-plot children (nothing
 *  adds one today; the child region is typed by `childComponent`, not enforced) are skipped
 *  rather than counted, so an index into this list is an index into the series. */
const seriesOf = (children: readonly ComponentInstance[]): PlotParams[] =>
  children.filter((c) => c.name === "plot").map((c) => c.params() as PlotParams);

/**
 * THE KEY — the overlay's only statement of which line is which.
 *
 * It is emitted for the overlay ALONE, for the same reason the point figures come off for the
 * overlay alone (see `layout`): the two are the same decision seen from either side. One line
 * states its numbers on its points and needs no key, because the headline already names the one
 * thing drawn. Several lines cannot state their numbers — the figures print through each other —
 * so the treatment takes them off and the series' identity moves to colour, which is a code
 * nothing on the frame decodes. A swatch in the line's own colour beside its name is the decode.
 *
 * BELOW THE GRAPH AND HORIZONTAL, not beside a line's end: an in-place label would have to be
 * positioned off the last vertex, which is exactly where two converging series overprint each
 * other — the failure the figures were removed for, re-created by the thing meant to fix it. A
 * row under the category axis is read once, in one place, in the order the swatches were
 * assigned.
 *
 * The colour comes from the RECONCILED params, so it is the colour the line is actually drawn in
 * rather than a second walk of `ACCENT_CYCLE` that would have to agree with the first one. Where
 * a series names nothing, the fallback is its position — a key that ties a colour to "Series 2"
 * says less than a name but strictly more than no key.
 */
const legendHtml = (children: readonly ComponentInstance[]): string | null => {
  const series = seriesOf(children);
  if (series.length < 2) return null;
  return series
    .map((s, i) => {
      const colour = s.accent ? ` style="--pcol: var(--${s.accent})"` : "";
      return (
        `<span class="pkey"${colour}>` +
        `<span class="pswatch"></span>` +
        `<span class="pname">${esc(s.series ?? `Series ${i + 1}`)}</span>` +
        `</span>`
      );
    })
    .join("");
};

/**
 * ONE X-AXIS, so every series has to have the same number of points.
 *
 * The overlay draws each series edge to edge across the same box (plot/index.ts, `xAt`), and
 * the category row is the FIRST series' — so a four-point line under a six-point line would
 * put its third point at 50% and its neighbour's third point at 40%, both under a label that
 * describes only one of them. Nothing looks broken; the chart just quietly means nothing.
 *
 * Only the COUNT is checked, not the label text. A second series that spells its categories
 * differently ("Q1" against "Jan–Mar") is reading the same axis in different words, and the
 * first series' labels are the ones drawn — an ordinary editorial choice rather than an error
 * worth refusing a deck over.
 */
const pointCountIssue = (counts: readonly number[]): string | null => {
  const [first] = counts;
  return counts.every((n) => n === first)
    ? null
    : `the series have ${counts.join(", ")} points — they are drawn on ONE x-axis, so every plot needs the same number`;
};

/**
 * A line chart — `chart`'s sibling over the same spec data (`chart.series`), for the case
 * `chart` structurally cannot draw: `chart.type === "line"`.
 *
 * ONE CHILD PER SERIES, not one per point, because a polyline connects its points — see
 * plot/schema.ts. A second child is therefore a second LINE ON THE SAME GRAPH, not a second
 * graph: the children are stacked in one box by the plot's own sheet (plot/geometry.css) and
 * reconciled onto one scale here.
 *
 * The cascade still gives each series its own slot, which is what an overlay wants anyway —
 * the lines draw themselves one after another rather than all at once. The caption's problem is
 * unchanged and is the SINGLE-series case: with one child there is only one beat between the
 * title and the caption, and a beat is shorter than the wipe, so the caption buys the delay with
 * an offset rather than a slot (see anim.ts). With more children it has extra slack, which is
 * the harmless direction.
 */
export const TrendLine = treatment({
  name: "trend-line",
  childComponent: "plot",
  schema: TrendLineSchema,
  template,
  // chart's and bar-ranking's ground: the three are the same device seen three ways, and in the
  // two themes that keep per-treatment grounds they should land on the same plane.
  ground: "muted-1",
  example: { headline: "Losses fall quarter over quarter", caption: "Incidents per 1,000 sessions" },
  fill: (p) => ({ headline: p.headline, caption: p.caption ?? null }),
  // The key, which is a statement about the SET and so can only be written here — see
  // `legendHtml`. It is null for a single series, and an unfilled data-html element removes
  // itself, so a one-plot trend-line emits exactly the markup it did before.
  rawFill: (_p, children) => ({ legend: legendHtml(children) }),
  defaultChildren: () => [
    Plot({ labels: ["Q1", "Q2", "Q3", "Q4"], values: [18, 34, 29, 61], max: 61 }),
  ],
  /**
   * ONE SERIES PRINTS ITS FIGURES; SEVERAL READ THE AXIS.
   *
   * A lone line has no other way to state its numbers, so the plot labels every point. Overlaid,
   * those labels are centred on their dots inside a shared box, in one colour, so two points
   * that pass anywhere near each other print through each other and neither figure says which
   * line it came from — while the y-axis, which the overlay has already reconciled onto one
   * scale, states the same thing once and unambiguously.
   *
   * Emitted ONLY in the overlay case, so a single-plot trend-line is byte-identical to what it
   * was; `--pfig` is read by the plot's own sheet (plot/geometry.css) with `block` — the figures
   * — as its default.
   *
   * TAKING THE FIGURES OFF IS WHAT PUTS THE KEY ON. Once the numbers are gone the series are
   * told apart by colour and by nothing else, so the same child count that removes them emits
   * the key (`rawFill` → `legendHtml`). The two are one decision and must not drift apart: a
   * frame with neither is N unlabelled coloured lines.
   */
  layout: (childCount): Record<string, string> => (childCount > 1 ? { "--pfig": "none" } : {}),
  // ONE X-AXIS — see `pointCountIssue`. The runtime runs this over the children as the caller
  // wrote them (composeTreatment) AND over the resolved instances (buildNode), so the guard
  // covers `addChildren` and `defaultChildren` too: `TrendLine().addChildren(Plot(4), Plot(3))`
  // used to render two series on one four-label row rather than being refused.
  childrenIssue: (_p, children) =>
    pointCountIssue(children.map((c) => (c.params?.values as unknown[] | undefined)?.length ?? 0)),
  /**
   * ONE Y-AXIS, resolved rather than demanded.
   *
   * Each plot declares its own `max`/`min` because a plot is also a component in its own right,
   * and stacked on one graph those declarations are not a contradiction to reject — they are two
   * halves of a scale nobody has resolved yet. Adding a second line is the most ordinary thing an
   * author can do here, and it must not become an error to fix by hand. So the scale is the UNION
   * of what the children ask for, which contains every series by construction (each child's own
   * schema already checked its values against its own narrower scale), and every child is
   * redrawn against it.
   *
   * `decimals` is unioned too, and that one is not cosmetic: it is a MINIMUM place count, the
   * ticks are the only thing sized by the y-gutter's hidden sizer, and the layers align only
   * because they render the identical tick strings into identical gutters (plot/geometry.css).
   * Ticks depend on nothing but `min`, `max` and `decimals` — unify the three and the alignment
   * is arithmetic rather than luck. (`unitPrefix`/`unitSuffix` stay per-series: they appear on
   * the point figures, never on a tick.)
   *
   * COLOUR IS PART OF THE SAME JOB. Overlaid lines that cannot be told apart are not a chart, and
   * a single plot has never needed to say which colour it is — so a series that names no `accent`
   * takes one from the shared cycle, and only once there is more than one line to distinguish. An
   * accent the author DID name is left alone.
   */
  reconcileChildren: (children) => {
    const plots = children.filter((c) => c.name === "plot");
    if (plots.length < 2) return;
    const scales = plots.map((c) => c.params() as PlotParams);
    const min = Math.min(...scales.map((s) => s.min));
    const max = Math.max(...scales.map((s) => s.max));
    const decimals = Math.max(...scales.map((s) => s.decimals));
    plots.forEach((c, i) =>
      c.withParams({
        min,
        max,
        decimals,
        accent: scales[i]!.accent ?? ACCENT_CYCLE[i % ACCENT_CYCLE.length],
      }),
    );
  },
  anim: trendLineAnim,
});
