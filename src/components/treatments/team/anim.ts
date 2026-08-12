import type { AnimDescriptor } from "../../runtime/anim";
import type { TeamParams } from "./schema";

/** The headline rises in on the first VO line; each member then takes the next cascade slot in
 *  turn (the treatment offsets them automatically), so the roster introduces people one at a
 *  time — which is what a team frame is for. The caption sits after the last member;
 *  `n: childCount` resolves to the caption slot, as in chart and matrix. */
export const teamAnim = (p: TeamParams, childCount: number): AnimDescriptor[] => [
  { kind: "riseIn", target: "headline", time: { at: "line", n: 0, plus: 0.1 }, opts: { dist: 30 } },
  ...(p.caption
    ? [
        {
          kind: "riseIn" as const,
          target: "caption",
          time: { at: "line" as const, n: childCount, plus: 0.2 },
          opts: { dist: 18 },
        },
      ]
    : []),
];
