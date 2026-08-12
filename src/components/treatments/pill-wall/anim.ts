import type { AnimDescriptor } from "../../runtime/anim";
import type { PillWallParams } from "./schema";

/**
 * ONE WAVE, NOT A QUEUE — and this is the whole reason the wall is animated from here rather
 * than by the pills themselves.
 *
 * Every other child-bearing treatment gives each child its own cascade slot, which is right when
 * the children are read in order (rows, steps, bars). A pill wall is the opposite: it is a SET,
 * taken in at a glance, and the point is the breadth. Fourteen sequential reveals would turn that
 * into a fourteen-beat list — and worse, it would not fit: `MC.applyAnims` floors the slot delay
 * at 0.15s, so 14 children + a caption is ~2.85s of cascade in a 3.47s scene, arriving after the
 * 0.75 mark the stills and the critique sample (cascade-fit.test.ts pins exactly this).
 *
 * So the pills are added with `animIn: "none"` (index.ts / spec-map.ts) and one `staggerIn` is
 * aimed at the container, which `MC.applyAnims` expands to `.wall > *`. The whole wall is three
 * slots — headline, wave, caption — whatever the pill count.
 *
 * The caption therefore keys to `index 2` rather than `line n≥1`. A `line n≥1` own-anim is
 * remapped to the CAPTION SLOT, which is `childBase + children.length` — i.e. it would drift out
 * past all fourteen pills exactly as if they were still queued. `index n` maps to
 * `titleSlot + titleOffset + n`, which is what "third beat" actually means here.
 */
export const pillWallAnim = (p: PillWallParams): AnimDescriptor[] => [
  { kind: "riseIn", target: "headline", time: { at: "line", n: 0, plus: 0.1 }, opts: { dist: 30 } },
  { kind: "staggerIn", target: "wall", time: { at: "index", n: 1 }, opts: { dist: 18, each: 0.05 } },
  ...(p.caption
    ? [
        {
          kind: "riseIn" as const,
          target: "caption",
          time: { at: "index" as const, n: 2, plus: 0.1 },
          opts: { dist: 18 },
        },
      ]
    : []),
];
