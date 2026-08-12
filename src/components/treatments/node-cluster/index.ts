import template from "./template.html" with { type: "text" };
import { ClusterNode } from "../../primitives/cluster-node";
import { ACCENT_CYCLE } from "../../../types/palette";
import { treatment } from "../../runtime/treatment";
import { nodeClusterAnim } from "./anim";
import { NodeClusterSchema } from "./schema";

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
export const NodeCluster = treatment({
  name: "node-cluster",
  childComponent: "cluster-node",
  schema: NodeClusterSchema,
  template,
  ground: "muted-1",
  example: {
    headline: "One feed, every sensor",
    hub: "Relay",
    caption: "Each source is normalised on the way in",
  },
  fill: (p) => ({ headline: p.headline, hub: p.hub, caption: p.caption ?? null }),
  // --cn lets the skin size the ring off the spoke COUNT: eight arms need a wider radius than
  // three or the pucks touch.
  layout: (n) => ({ "--cn": String(n) }),
  defaultChildren: () =>
    SPOKES.map((label, i) =>
      ClusterNode({
        label,
        index: i,
        total: SPOKES.length,
        accent: ACCENT_CYCLE[i % ACCENT_CYCLE.length],
      }),
    ),
  anim: nodeClusterAnim,
});
