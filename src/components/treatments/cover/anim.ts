import type { AnimDescriptor } from "../../runtime/anim";

/** Cover motion: the eyebrow pill fades in on the scene lead-in, the headline
 *  drives up on the first VO line, an optional underline rule draws in just after
 *  it, and the subtitle fades in a beat later.
 *  Optional-slot anims no-op when the slot is dropped (the interpreter skips a
 *  missing target, mc.js applyAnims L385) — so the `rule` reveal is inert on themes
 *  whose cover has no `.rule` (block's shared template), and only future's template
 *  override, which carries `data-anim="rule"`, animates it. Without this the rule was
 *  painted at the t=0 page fade, before the headline it underlines. */
export const coverAnim = (): AnimDescriptor[] => [
  { kind: "fadeIn", target: "eyebrow", time: { at: "leadIn" } },
  { kind: "riseIn", target: "headline", time: { at: "line", n: 0 }, opts: { dist: 32 } },
  { kind: "rule", target: "rule", time: { at: "line", n: 0, plus: 0.2 } },
  { kind: "fadeIn", target: "subtitle", time: { at: "index", n: 1 } },
];
