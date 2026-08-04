// Counted-up figures: what they READ as, and how much room to RESERVE for them.
//
// `bar` and `rank` both paint a numeric label that MC.countUp rewrites on every frame
// (assets/fx/mc.js — `el.textContent = prefix + v.toFixed(decimals) + suffix`). Two
// things follow from that, and both used to be wrong:
//
// 1. DECIMALS. countUp defaults to `toFixed(0)`, and neither primitive passed one, so a
//    chart plotting 0.5 and 1.2 against a "$…B" unit rendered "$1B" on BOTH rows. The
//    figures were not merely rounded — they were indistinguishable, which is worse than
//    imprecise on a slide whose whole job is comparing them. `decimals` (already on
//    `stat`) closes it, and the placeholder must use the same formatting so frame 0 and
//    frame 1 agree.
//
// 2. WIDTH. The label's text grows as it counts (a value's digits only ever get MORE
//    numerous), so a shrink-to-fit box would resize mid-tween and drag the bar with it.
//    Every theme's answer was a FIXED width — which stops the wiggle but makes a long
//    label overflow its box, and on a right-aligned rank row that sits at the canvas
//    edge it overflows off-canvas. `hyperframes inspect` flags exactly that as an ERROR.
//
//    The fix is to reserve the FINAL string's width up front: the box is sized for the
//    widest thing it will ever hold, so it never resizes (no wiggle) and never overflows
//    (no error). Reserving is safe precisely because value ≥ 0 in both schemas, so the
//    rendered text is monotonically non-shrinking — the end state IS the widest state.

/** The value a param bag counts up to, with its units. */
export type ValueParams = {
  value: number;
  decimals?: number;
  unitPrefix?: string;
  unitSuffix?: string;
};

/**
 * The exact string `MC.countUp` paints at the END of its tween. Kept byte-identical to
 * mc.js's own concatenation — the reservation below is only correct if it measures the
 * string that actually lands in the DOM.
 */
export const finalValueText = (p: ValueParams): string =>
  `${p.unitPrefix ?? ""}${p.value.toFixed(p.decimals ?? 0)}${p.unitSuffix ?? ""}`;

/**
 * The string the element is BORN with, before its first count-up frame — the same
 * formatting at zero, so a still taken before the tween starts shows "$0.0M", not a
 * bare "$0M" that gains a decimal place the moment the timeline moves.
 */
export const zeroValueText = (p: ValueParams): string =>
  `${p.unitPrefix ?? ""}${(0).toFixed(p.decimals ?? 0)}${p.unitSuffix ?? ""}`;

/**
 * Room to reserve for `text`, in `ch` — the advance of "0" in the element's OWN font, so
 * one number travels across six themes with six display faces and no per-theme constant.
 *
 * Digits (with `tabular-nums` pinned in the skins) are 1ch by definition; the separators
 * and currency marks that show up in a figure are narrower than that, so counting them at
 * 1 builds in slack. Anything else is a UNIT the caller chose — letters, and in a heavy
 * display cut an uppercase letter runs half again a digit's width, so they cost 1.5.
 *
 * Deliberately an over-estimate: the cost of reserving too much is a slightly narrower
 * bar track, the cost of reserving too little is the overflow this exists to prevent.
 */
export const reserveCh = (text: string): number => {
  let ch = 0;
  for (const c of text) ch += /[0-9.,$€£%+\-\s]/.test(c) ? 1 : 1.5;
  return Math.round((ch + 0.25) * 100) / 100; // + a hair of bearing, 2dp for stable bytes
};

/** `reserveCh(finalValueText(p))` — the width to reserve for a counted-up figure. */
export const valueReserveCh = (p: ValueParams): number => reserveCh(finalValueText(p));
