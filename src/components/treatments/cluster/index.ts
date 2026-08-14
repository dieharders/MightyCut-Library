import template from "./template.html" with { type: "text" };
import { ClusterNode } from "../../primitives/cluster-node";
import { ACCENT_CYCLE } from "../../../types/palette";
import { treatment } from "../../runtime/treatment";
import { clusterAnim } from "./anim";
import { ClusterSchema } from "./schema";

const SPOKES = ["Radar", "Optical", "Signals", "Telemetry", "Weather"];

/**
 * A hub-and-spoke cluster: one centre with labelled arms radiating from it.
 *
 * NO SVG. The connectors are CSS — each spoke is an arm rotated by its own `--ca` with the puck
 * counter-rotated back upright — which keeps the whole diagram in the layout engine, so the
 * type is real text on the theme's scale and the geometry rescales with the canvas like every
 * other rem in the library. The alternative (drawing edges in SVG, as `plot` does for its
 * polyline) buys nothing here: a hub-and-spoke has no path BETWEEN siblings, only a straight
 * run from each one to a fixed centre, and that is exactly what a rotated box already is.
 */
export const Cluster = treatment({
  name: "cluster",
  childComponent: "cluster-node",
  schema: ClusterSchema,
  template,
  ground: "muted-1",
  example: {
    headline: "One feed, every sensor",
    hub: "Relay",
    caption: "Each source is normalised on the way in",
  },
  fill: (p) => ({ headline: p.headline, hub: p.hub, caption: p.caption ?? null }),
  // --cn lets the skin size the ring off the spoke COUNT: eight arms need a wider radius than
  // three or the pucks touch. It is the REAL child count; each spoke's ANGLE comes from its own
  // `total` (the runtime hands `layout()` a count but gives a child no per-instance hook, so a
  // node has to be told where it sits). Those are two statements of one number, and
  // `childrenIssue` below is what keeps them from disagreeing.
  layout: (n) => ({ "--cn": String(n) }),
  // What a spoke cannot check about itself. `index < total` is the child's own business and its
  // schema refines it; these three are the SET's:
  //
  // `total` is what each spoke spaces itself by, and the ring's radius is sized off the real
  // child count — two statements of one number. Delete one of five spokes in the editor and the
  // survivors keep `total: 5`: a 72° hole opens where the deleted arm was, while `--cn: 4`
  // closes the ring up around it. And two spokes given the same `index` draw at the same angle,
  // one hidden behind the other, with nothing visible but a ring an arm short.
  childrenIssue: (_p, children) => {
    const n = children.length;
    const totals = [...new Set(children.map((c) => c.params?.total).filter((t) => t !== undefined))];
    if (totals.length > 1)
      return `the spokes disagree about \`total\` (${totals.join(", ")}) — every spoke spaces itself by it, so one value has to hold for the whole ring`;
    if (totals.length === 1 && totals[0] !== n)
      return `${n} ${n === 1 ? "spoke was" : "spokes were"} given but each is placed for a ring of ${String(totals[0])} — \`total\` IS the ring's size, so it has to equal the spoke count or the arms leave a gap`;
    if (new Set(children.map((c) => c.params?.index)).size !== n)
      return `two spokes share an \`index\` — an index is a position in the ring, so a repeat draws both at the same angle and one disappears behind the other`;
    return null;
  },
  defaultChildren: () =>
    SPOKES.map((label, i) =>
      ClusterNode({
        label,
        index: i,
        total: SPOKES.length,
        accent: ACCENT_CYCLE[i % ACCENT_CYCLE.length],
      }),
    ),
  anim: clusterAnim,
});
