import type { AnimDescriptor } from "../../runtime/anim";

/** Cover motion: the headline drives up on the first VO line, an optional underline rule
 *  draws in just after it, and the subtitle fades in a beat later.
 *  Optional-slot anims no-op when the slot is dropped (the interpreter skips a
 *  missing target, mc.js applyAnims L385) — so the `rule` reveal is inert on themes
 *  whose cover has no `.rule` (block's shared template), and only future's template
 *  override, which carries `data-anim="rule"`, animates it. Without this the rule was
 *  painted at the t=0 page fade, before the headline it underlines.
 *
 *  COVER IS THE ONE CHILDLESS TREATMENT WITH NO `leadIn` OWN-ANIM, and that is deliberate
 *  rather than an omission. `runtime/treatment.ts` derives `titleOffset` from whether any
 *  own-anim is keyed to `leadIn`: a framing element (quote's eyebrow pill, closing-plate's
 *  backing card) takes the title slot so the title doesn't pop simultaneously with its own
 *  frame, and the title falls to the next beat. The cover HAS no frame any more — the eyebrow
 *  pill that used to occupy that slot was removed with the schema field — so `titleOffset`
 *  is 0 and the headline takes the slot itself, landing one beat after the decorations
 *  instead of two. Re-adding a `leadIn` descriptor here would reinstate the empty beat and
 *  delay the headline on every deck's opening frame for an element that no longer exists.
 *  Pinned by the cascade-slot test in registry.test.ts. */
export const coverAnim = (): AnimDescriptor[] => [
  { kind: "riseIn", target: "headline", time: { at: "line", n: 0 }, opts: { dist: 32 } },
  { kind: "rule", target: "rule", time: { at: "line", n: 0, plus: 0.2 } },
  { kind: "fadeIn", target: "subtitle", time: { at: "index", n: 1 } },
];
