import template from "./template.html" with { type: "text" };
import { component } from "../../runtime/component";
import { clusterNodeAnim } from "./anim";
import { ClusterNodeSchema } from "./schema";

/**
 * Where spoke `index` of `total` sits, as a fraction of a turn, measured CLOCKWISE FROM THE TOP.
 *
 * The half-turn offset is what puts the first spoke at 12 o'clock rather than at 3: CSS
 * rotation starts at the positive x-axis, and a ring whose first item is on the right reads as
 * arbitrary where one starting at the top reads as ordered. Emitted in `turn` units so the skin
 * can hand it straight to `rotate()` without a magic 360.
 */
const angleTurns = (index: number, total: number): number => index / total - 0.25;

/** A spoke of a hub-and-spoke cluster: a connector out from the centre and a labelled puck at
 *  the end of it. Placement is the child's own business (see schema.ts) — it is given its
 *  position in the ring and emits the geometry the skin rotates by. */
export const ClusterNode = component({
  name: "cluster-node",
  schema: ClusterNodeSchema,
  template,
  example: { label: "Radar", detail: "12 feeds", index: 0, total: 5 },
  fill: (p) => ({
    "node-label": p.label,
    // Pruned when absent — a bare spoke leaves no empty line under its label.
    "node-detail": p.detail ?? null,
  }),
  layout: (p): Record<string, string> => ({
    // The skin rotates the arm by --ca, then counter-rotates the puck by --ca-inv so the TYPE
    // stays upright. Two properties rather than one calc() in the skin, so the counter-rotation
    // cannot drift from the rotation it undoes.
    "--ca": `${angleTurns(p.index, p.total).toFixed(4)}turn`,
    "--ca-inv": `${(-angleTurns(p.index, p.total)).toFixed(4)}turn`,
    ...(p.accent ? { "--ccol": `var(--${p.accent})` } : {}),
  }),
  anim: clusterNodeAnim,
});
