// The counted-up figure's TEXT and its reserved WIDTH — pinned together, because the
// reservation is only sound if it measures the string that actually lands in the DOM.
//
// Both halves are regressions from a real deck (job-20260804063655-001, a chart plotting
// 0.5 and 1.2 against "$…B"):
//   · every row rendered "$1B", because neither primitive passed `decimals` to countUp;
//   · the agent's fix — rescale to 500/1200 in "M" — made the label "$1200M", which
//     overflowed the fixed-width value box, off the right edge of the canvas, and
//     `hyperframes inspect` failed the job on it.
import { describe, expect, test } from "bun:test";
import "../registry";
import { getComponent } from "./registry";
import { finalValueText, reserveCh, valueReserveCh, zeroValueText } from "./value";

describe("counted-up figure text", () => {
  test("final text matches mc.js's own concatenation (prefix + toFixed + suffix)", () => {
    expect(finalValueText({ value: 1.2, decimals: 1, unitPrefix: "$", unitSuffix: "B" })).toBe("$1.2B");
    expect(finalValueText({ value: 1200, unitPrefix: "$", unitSuffix: "M" })).toBe("$1200M");
    expect(finalValueText({ value: 83, unitSuffix: "%" })).toBe("83%");
  });

  // The bug itself: with no decimals, 0.5 and 1.2 are the SAME string.
  test("without decimals a fractional series collapses to one figure", () => {
    expect(finalValueText({ value: 0.5, unitPrefix: "$", unitSuffix: "B" })).toBe(
      finalValueText({ value: 1.2, unitPrefix: "$", unitSuffix: "B" }),
    );
    expect(finalValueText({ value: 0.5, decimals: 1, unitPrefix: "$", unitSuffix: "B" })).not.toBe(
      finalValueText({ value: 1.2, decimals: 1, unitPrefix: "$", unitSuffix: "B" }),
    );
  });

  // The element is born at zero in the SAME format, so the pre-tween still and the first
  // counted frame agree (a bare "$0B" that becomes "$0.0B" is a visible one-frame jump).
  test("the placeholder carries the same decimals as the final text", () => {
    expect(zeroValueText({ value: 1.2, decimals: 1, unitPrefix: "$", unitSuffix: "B" })).toBe("$0.0B");
    expect(zeroValueText({ value: 1200, unitPrefix: "$", unitSuffix: "M" })).toBe("$0M");
  });
});

describe("reserved width", () => {
  test("digits and figure punctuation cost 1ch, unit letters 1.5", () => {
    expect(reserveCh("100")).toBe(3.25); // 3 digits + bearing
    expect(reserveCh("$1.2B")).toBe(5.75); // $ . and 2 digits at 1, B at 1.5
  });

  // The reservation must never come in UNDER the text it is reserving for: too much
  // costs a slightly narrower track, too little is the overflow this exists to prevent.
  test("never under-reserves — every char is worth at least 1ch", () => {
    for (const s of ["$1200M", "99.7%", "1.2B", "4200ms", "83", "$0.5B"]) {
      expect(reserveCh(s)).toBeGreaterThanOrEqual(s.length);
    }
  });

  // What makes the fixed width safe to relax: the box is sized for the END of the tween,
  // and a non-negative value's text only ever grows, so it is also sized for every frame
  // before it. The box therefore never resizes mid-count — the wiggle the fixed widths
  // were defending against — while still holding the longest string it will ever show.
  test("the final string is the widest the label ever gets", () => {
    const p = { value: 1200, unitPrefix: "$", unitSuffix: "M" };
    const reserved = valueReserveCh(p);
    for (const frame of [0, 1, 42, 300, 999, 1200]) {
      expect(reserveCh(finalValueText({ ...p, value: frame }))).toBeLessThanOrEqual(reserved);
    }
  });
});

describe("bar + rank wire the figure through (tripwire)", () => {
  const ctx = { theme: { name: "block", templates: {} }, idPrefix: "s01-x" } as never;

  for (const name of ["bar", "rank"] as const) {
    test(`${name} passes decimals to countUp and reserves --vlen`, () => {
      const params = { value: 1.2, label: "SAM", max: 2, decimals: 1, unitPrefix: "$", unitSuffix: "B" };
      const built = getComponent(name)!(params).build(ctx);

      const countUp = built.anims.find((a) => a.kind === "countUp");
      expect(countUp?.opts).toMatchObject({ to: 1.2, decimals: 1, prefix: "$", suffix: "B" });

      // Born at "$0.0B" (not "$0B"), and carrying the reservation for "$1.2B".
      expect(built.html).toContain("$0.0B");
      expect(built.html).toContain(`--vlen: ${valueReserveCh(params)}`);
    });
  }
});
