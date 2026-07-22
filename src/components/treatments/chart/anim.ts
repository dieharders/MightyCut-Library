import type { AnimDescriptor } from "../../runtime/anim";

/** The headline reveals first; each bar child grows after it in the treatment's ordered
 *  cascade. The caption footnote rises in last: `n: childCount` marks it as a trailing
 *  (post-children) reveal, so the treatment slots it just after the final bar (`plus` is
 *  only its small internal offset within that slot). */
export const chartAnim = (_p: unknown, childCount: number): AnimDescriptor[] => [
  { kind: "riseIn", target: "headline", time: { at: "line", n: 0, plus: 0.1 }, opts: { dist: 30 } },
  { kind: "riseIn", target: "caption", time: { at: "line", n: childCount, plus: 0.2 }, opts: { dist: 18 } },
];
