import { z } from "zod";
import { PALETTE_VARS } from "../../../types/palette";

/**
 * One spoke of a hub-and-spoke cluster.
 *
 * NOT called `node`: that name is already taken by future's exclusive decoration family, and
 * `registerComponent` throws on a duplicate. (It could not be shared even if the name were free
 * — a tripwire asserts no two themes roster the same decoration family, and that one is
 * future's.)
 *
 * `index` and `total` are the placement, and they are PARAMS rather than something the treatment
 * computes, because the runtime gives a treatment's `layout()` the child COUNT but no hook to
 * emit per-child custom properties. A child's own `layout(p)` is the only per-instance seam, so
 * a node has to be told where it sits in the ring to place itself. Deterministic arithmetic, no
 * measurement: the same inputs always yield the same angle.
 */
export const ClusterNodeSchema = z.object({
  label: z.string().min(1).max(24).describe("What this spoke is"),
  detail: z.string().max(40).optional().describe("A short qualifier under the label"),
  index: z.number().int().min(0).max(7).describe("Position in the ring, clockwise from the top"),
  total: z.number().int().min(3).max(8).describe("How many spokes the ring holds"),
  accent: z
    .enum(PALETTE_VARS)
    .optional()
    .describe("Palette role for this spoke's puck (unset ⇒ the theme's default)"),
});
export type ClusterNodeParams = z.infer<typeof ClusterNodeSchema>;
