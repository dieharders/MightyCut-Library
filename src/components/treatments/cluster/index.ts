import template from "./template.html" with { type: "text" };
import { ClusterNode } from "../../primitives/cluster-node";
import { ringPlacement } from "../../primitives/cluster-node/ring";
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
 *
 * THE RING PLACES ITS OWN SPOKES. A spoke's angle is a fact about the set — which position it
 * holds, out of how many — and the treatment is the only thing that knows both, so it stamps the
 * placement onto each child from its draw order (`childLayout` → `ringPlacement`). The spoke
 * used to be told `index` and `total` as params, which put two fields in the editor that had to
 * agree with each other, across every spoke, and with the real count; a `childrenIssue` here
 * refused the sets that did not. Deleting a spoke now simply closes the ring, and there is
 * nothing left to disagree.
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
  // three or the pucks touch. The same count spaces the spokes (`childLayout` below), so the
  // two can no longer disagree.
  layout: (n) => ({ "--cn": String(n) }),
  childLayout: (i, n) => ringPlacement(i, n),
  defaultChildren: () =>
    SPOKES.map((label, i) =>
      ClusterNode({
        label,
        accent: ACCENT_CYCLE[i % ACCENT_CYCLE.length],
      }),
    ),
  anim: clusterAnim,
});
