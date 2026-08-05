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
import { Bar } from "../primitives/bar";
import { Rank } from "../primitives/rank";
import { BarRanking } from "../treatments/bar-ranking";
import { Chart } from "../treatments/chart";
import { getComponent } from "./registry";
import { finalValueText, reserveCh, seriesReserveCh, valueReserveCh, zeroValueText } from "./value";

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
  test("digits and figure punctuation cost 1ch, unit glyphs 1.5", () => {
    expect(reserveCh("100")).toBe(3.25); // 3 digits + bearing
    expect(reserveCh("$1.2B")).toBe(5.75); // $ . and 2 digits at 1, B at 1.5
  });

  // `%` is the widest glyph a figure carries (1.24–1.61ch across the six display faces,
  // measured off the shipped woff2). Charging it as punctuation under-reserved every
  // percentage in the library — the most common unit a deck plots — so it sits with the
  // unit letters at 1.5. Pinned as an exact value: the previous form of this test asserted
  // `reserveCh(s) >= s.length`, which is an identity (every char costs >= 1, plus 0.25 of
  // bearing) and so could not fail for any input, including the under-reserving one.
  test("a percentage reserves its unit glyph at 1.5ch, not 1", () => {
    expect(reserveCh("100%")).toBe(4.75); // 3 digits at 1, % at 1.5, + bearing
    expect(reserveCh("83%")).toBe(3.75);
    expect(reserveCh("99.7%")).toBe(5.75);
  });

  // The reservation must never come in UNDER the text it is reserving for: too much costs a
  // slightly narrower track, too little is the overflow this exists to prevent. Compared
  // against the WIDEST per-glyph cost any of the six faces charges (1ch for a tabular digit
  // or separator, 1.61ch for `%`, ~1.5ch for a display capital), not against `s.length`.
  const WIDEST_CH: Record<string, number> = { "%": 1.61 };
  const widestRenderedCh = (s: string): number => {
    let ch = 0;
    for (const c of s) ch += WIDEST_CH[c] ?? (/[0-9.,$€£+\-\s]/.test(c) ? 1 : 1.5);
    return ch;
  };
  test("never under-reserves against the widest face in the library", () => {
    for (const s of ["$1200M", "99.7%", "1.2B", "4200ms", "83", "$0.5B", "100%"]) {
      expect(reserveCh(s)).toBeGreaterThanOrEqual(widestRenderedCh(s));
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

      // Born at "$0.0B" (not "$0B"), and carrying the reservation for the series scale
      // ("$2.0B" at max 2), not for its own value.
      expect(built.html).toContain("$0.0B");
      expect(built.html).toContain(`--vlen: ${seriesReserveCh(params)}`);
    });
  }
});

// The reservation is sized off the series MAX, so every row in a series reserves the same
// box without knowing about its siblings, and the tracks all end on one vertical line. Sized
// off each row's own VALUE it is uniform only by accident: "1000%" reserves wider than "11%",
// the wider box eats the flex track, and since each fill is a percentage of its OWN track the
// rows stop being comparable by length.
describe("the reservation is sized off the series scale, not the row's value", () => {
  const scale = { max: 1000, unitSuffix: "%" };

  test("rows sharing a max reserve identically regardless of digit count", () => {
    const widths = [1000, 999, 190, 11].map((value) => seriesReserveCh({ ...scale, value }));
    expect(new Set(widths).size).toBe(1);
    expect(widths[0]).toBe(reserveCh("1000%"));
  });

  // Nothing binds value <= max — the schemas clamp the FILL to 100%, not the figure — so a
  // row past the scale must still fit its own text.
  test("a value past the scale still reserves for itself", () => {
    expect(seriesReserveCh({ value: 12345, max: 100, unitSuffix: "%" })).toBe(reserveCh("12345%"));
  });

  test("decimals widen the reservation on both sides of the comparison", () => {
    expect(seriesReserveCh({ value: 0.5, max: 2, decimals: 1, unitPrefix: "$", unitSuffix: "B" })).toBe(
      reserveCh("$2.0B"),
    );
  });
});

// The reservation must be UNIFORM across siblings, because the skins turn --vlen into the
// value box's min-width and the rank track takes whatever the label + box leave. Per-row
// widths give per-row track LENGTHS, and since the fill is a percentage of the track, a
// lower-ranked row with a shorter figure can paint a longer bar than the leader — the
// ranking reads inverted. treatment.ts lifts the children's values and re-declares the max.
describe("--vlen is hoisted to the container, not left per-child", () => {
  const ctx = { theme: { name: "block", templates: {} }, compId: "s01-x", idPrefix: "s01-x" } as never;
  // Children with DIVERGENT scales — the case seriesReserveCh alone cannot cover, since
  // nothing forces siblings to share a max (the deck editor can set one row's independently).
  const cases = [
    {
      name: "bar-ranking",
      widest: reserveCh("1000%"),
      built: () =>
        BarRanking({ headline: "Share", caption: "2026" })
          .addChildren(
            Rank({ value: 11, label: "Acme", max: 1000, unitSuffix: "%", leader: true }),
            Rank({ value: 38, label: "Globex", max: 100, unitSuffix: "%" }),
            Rank({ value: 7, label: "Initech", max: 10, unitSuffix: "%" }),
          )
          .build(ctx),
    },
    {
      name: "chart",
      widest: reserveCh("$1200M"),
      built: () =>
        Chart({ headline: "Revenue", caption: "Net new" })
          .addChildren(
            Bar({ value: 42, label: "Q1", max: 1200, unitPrefix: "$", unitSuffix: "M" }),
            Bar({ value: 42, label: "Q2", max: 90, unitPrefix: "$", unitSuffix: "M" }),
          )
          .build(ctx),
    },
  ];

  for (const c of cases) {
    test(`${c.name} declares one --vlen (the widest child's) and its children declare none`, () => {
      const declared = [...c.built().html.matchAll(/--vlen:\s*([0-9.]+)/g)].map((m) => m[1]);
      expect(declared).toEqual([String(c.widest)]);
    });
  }

  // A bare component still carries its own reservation — the hoist is a container concern,
  // and a component rendered alone (the showcase's element gallery) has no container to
  // inherit from.
  test("a bare component keeps its own --vlen", () => {
    expect(Rank({ value: 38, label: "Globex", max: 100, unitSuffix: "%" }).build(ctx).html).toContain("--vlen:");
  });
});
