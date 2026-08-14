import type { AnimDescriptor } from "../../runtime/anim";
import type { ClusterNodeParams } from "./schema";

/**
 * How long a spoke waits after the head of its cascade slot, in seconds — the offset that makes
 * "the hub first, then the arms" TRUE rather than merely intended.
 *
 * THE HUB AND THE FIRST SPOKE SHARE A SLOT, by construction. A treatment's own `index n` anim
 * lands on `titleSlot + titleOffset + n` and its child `i` on `titleSlot + titleOffset + 1 + i`
 * (runtime/treatment.ts), so `index 1` — the beat after the title, which is where node-cluster
 * puts its hub — IS child 0's slot. There is no free slot between the title and the first child
 * to move the hub into: `index 0` is the title itself, and keying the hub to `leadIn` takes the
 * title's slot and pushes the headline a beat later, which node-cluster/anim.ts rejects for its
 * own reasons. Both descriptors carried `plus: 0`, so the hub's `scaleIn` and spoke 0's
 * `staggerIn` fired at exactly the same instant and the first arm grew out of a disc that was
 * still scaling up from 0.7 — the one ordering the diagram is supposed to show.
 *
 * Half the hub's own 0.6s `scaleIn` (mc.js). `back.out` has overshot and settled by then, so the
 * disc reads as PRESENT when the first arm leaves it, without holding the whole cascade for the
 * full entrance. It rides every spoke equally, so the one-arm-per-slot cascade is unchanged —
 * the ring simply starts a beat inside its slot instead of on it.
 */
const HUB_LEAD_SEC = 0.3;

/** Default motion: the spoke's connector and puck scale in together on its VO line (the
 *  Cluster treatment offsets each spoke to lines 1..N automatically), so the diagram
 *  assembles outward from the hub one arm at a time. */
export const clusterNodeAnim = (_p: ClusterNodeParams): AnimDescriptor[] => [
  {
    kind: "staggerIn",
    target: "item",
    time: { at: "line", n: 0, plus: HUB_LEAD_SEC },
    opts: { dist: 14, each: 0.06 },
  },
];
