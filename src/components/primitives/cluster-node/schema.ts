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
 * A spoke says WHAT it is and nothing about WHERE it sits. Its place in the ring — the angle it
 * is rotated to and the seating correction that goes with it — is the TREATMENT's to decide,
 * from the order its children are drawn in (treatments/cluster, `childLayout`, through
 * `ringPlacement` next door). The spoke used to carry `index` and `total` as params and the
 * editor duly offered both as fields: two numbers every spoke had to be told, that had to agree
 * across the set and with the real child count, and that nobody editing a deck could reasonably
 * keep straight. Deleting a spoke is now enough to close the ring.
 */
export const ClusterNodeSchema = z.object({
  label: z.string().min(1).max(24).describe("What this spoke is"),
  detail: z.string().max(40).optional().describe("A short qualifier under the label"),
  accent: z
    .enum(PALETTE_VARS)
    .optional()
    .describe("Palette role for this spoke's puck (unset ⇒ the theme's default)"),
});
export type ClusterNodeParams = z.infer<typeof ClusterNodeSchema>;
