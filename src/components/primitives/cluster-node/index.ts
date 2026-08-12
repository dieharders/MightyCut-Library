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

/**
 * |cos| and |sin| of that angle — the skin's SEATING correction, and the one thing about this
 * geometry that cannot be done in the skin alone.
 *
 * The puck counter-rotates about its own centre, so the layout leaves that centre half a puck-width
 * past the arm's tip. That is only the right offset for a HORIZONTAL spoke: what has to clear the
 * tip is the box's near edge, which sits `(w/2)|cos| + (h/2)|sin|` back from the centre — half a
 * width for a horizontal puck, but only half a HEIGHT for a vertical one. The difference is why an
 * upright spoke's label floats away from its line while a sideways one sits flush.
 *
 * Emitted as a pair of plain numbers rather than computed from --ca in the skin, for the reason
 * --ca-inv is: one source for the angle, and no CSS trig to disagree with the rotation it corrects.
 */
const angleTrig = (turns: number): { cos: number; sin: number } => ({
  cos: Math.abs(Math.cos(turns * 2 * Math.PI)),
  sin: Math.abs(Math.sin(turns * 2 * Math.PI)),
});

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
    // …and the pair that seats the counter-rotated puck back against the arm's tip. See angleTrig.
    "--ccos": angleTrig(angleTurns(p.index, p.total)).cos.toFixed(4),
    "--csin": angleTrig(angleTurns(p.index, p.total)).sin.toFixed(4),
    ...(p.accent ? { "--ccol": `var(--${p.accent})` } : {}),
  }),
  anim: clusterNodeAnim,
});
