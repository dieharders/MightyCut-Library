import template from "./template.html" with { type: "text" };
import { component } from "../../runtime/component";
import { clusterNodeAnim } from "./anim";
import { ClusterNodeSchema } from "./schema";

/**
 * A spoke of a hub-and-spoke cluster: a connector out from the centre and a labelled puck at
 * the end of it.
 *
 * Its PLACEMENT is not its own: the treatment stamps `--ca` / `--ca-inv` / `--ccos` / `--csin`
 * onto each spoke from its position among its siblings (treatments/cluster, `childLayout` →
 * `ringPlacement`). Rendered bare — the showcase's component preview, with no ring around it —
 * the skin's fallbacks place it as a single spoke pointing straight up. What the spoke emits
 * itself is only what is genuinely its own: the accent its puck is painted in.
 */
export const ClusterNode = component({
  name: "cluster-node",
  schema: ClusterNodeSchema,
  template,
  example: { label: "Radar", detail: "12 feeds" },
  fill: (p) => ({
    "node-label": p.label,
    // Pruned when absent — a bare spoke leaves no empty line under its label.
    "node-detail": p.detail ?? null,
  }),
  layout: (p): Record<string, string> => (p.accent ? { "--ccol": `var(--${p.accent})` } : {}),
  anim: clusterNodeAnim,
});
