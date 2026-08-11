import type { AnimDescriptor } from "../../runtime/anim";
import type { NodeClusterParams } from "./schema";

/**
 * The headline rises in, then the HUB — the thing every spoke connects to has to exist before
 * an arm reaches out to it — and the spokes follow, one per cascade slot, so the diagram
 * assembles outward from the centre.
 *
 * The hub keys to `index 1` (the beat after the title) rather than to `leadIn`. A `leadIn`
 * own-anim is treated as a FRAMING element and takes the title's slot, pushing the headline a
 * beat later (titleOffset) — which is right for a quote's backing card and wrong here: the hub
 * is content, and the headline should still land first.
 */
export const nodeClusterAnim = (p: NodeClusterParams, childCount: number): AnimDescriptor[] => [
  { kind: "riseIn", target: "headline", time: { at: "line", n: 0, plus: 0.1 }, opts: { dist: 30 } },
  { kind: "scaleIn", target: "hub", time: { at: "index", n: 1 }, opts: { from: 0.7 } },
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
