import type { AnimDescriptor } from "../../runtime/anim";
import type { TeamMemberParams } from "./schema";

/** Default motion: the monogram, name and role stagger in together on this member's VO line
 *  (the Team treatment offsets each member to lines 1..N automatically), so a card assembles
 *  top-down rather than appearing whole. */
export const teamMemberAnim = (_p: TeamMemberParams): AnimDescriptor[] => [
  { kind: "staggerIn", target: "item", time: { at: "line", n: 0 }, opts: { dist: 18, each: 0.07 } },
];
