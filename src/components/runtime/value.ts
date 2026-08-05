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
 * `%` is a UNIT, not punctuation, and it is the widest glyph in a figure — MEASURED off
 * the library's own woff2 faces, its advance relative to "0" is 1.24–1.61ch across the six
 * display cuts (Playfair the narrowest, Bodoni Moda the widest). Charging it 1 under-reserved
 * every percentage figure in the library, which is the single most common unit a deck plots:
 * `reserveCh("100%")` came to 4.25ch where the text renders ~4.6ch wide. It sits with the
 * letters at 1.5.
 *
 * Deliberately an over-estimate: the cost of reserving too much is a slightly narrower
 * bar track, the cost of reserving too little is the overflow this exists to prevent.
 */
export const reserveCh = (text: string): number => {
  let ch = 0;
  for (const c of text) ch += /[0-9.,$€£+\-\s]/.test(c) ? 1 : 1.5;
  return Math.round((ch + 0.25) * 100) / 100; // + a hair of bearing, 2dp for stable bytes
};

/** `reserveCh(finalValueText(p))` — the width to reserve for a counted-up figure. */
export const valueReserveCh = (p: ValueParams): number => reserveCh(finalValueText(p));

/**
 * The reservation for a figure plotted AGAINST A SCALE — sized off the series `max`, not
 * off the row's own value.
 *
 * Reserving per-value is uniform only by accident. The skins turn the reservation into the
 * value box's min-width, and in a ranking the label and the box are fixed while the track
 * takes what is left, so a row whose figure has more digits gets a WIDER box and therefore a
 * SHORTER track. The tracks then end on ragged vertical lines, and because each fill is a
 * percentage OF ITS OWN TRACK, the rows stop being comparable by length — a 999% row on a
 * short track can paint a longer bar than a 1000% row on a shorter one. A chart shows the
 * same thing as columns of unequal width.
 *
 * `max` is the fix because every child in a series shares it — `defaultChildren` and
 * `spec-map` both derive one max for the whole series — so every row reserves the same width
 * without any child knowing about its siblings, and the alignment holds even for a row
 * rendered on its own. It is also the width the figure is HEADED for: a full row reads
 * `max`, so this is the widest string the series can ever paint.
 *
 * Takes the larger of the two reservations because nothing binds `value <= max` (the schemas
 * only clamp the FILL to 100%), and a value past the scale must still fit its box.
 */
export const seriesReserveCh = (p: ValueParams & { max: number }): number =>
  Math.max(valueReserveCh(p), valueReserveCh({ ...p, value: p.max }));
