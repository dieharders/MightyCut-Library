import type { AnimDescriptor } from "../../runtime/anim";
import type { ClusterNodeParams } from "./schema";

/** Default motion: the spoke's connector and puck scale in together on its VO line (the
 *  NodeCluster treatment offsets each spoke to lines 1..N automatically), so the diagram
 *  assembles outward from the hub one arm at a time. */
export const clusterNodeAnim = (_p: ClusterNodeParams): AnimDescriptor[] => [
  { kind: "staggerIn", target: "item", time: { at: "line", n: 0 }, opts: { dist: 14, each: 0.06 } },
];
