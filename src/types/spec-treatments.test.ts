// Tripwire for the spec-kind ↔ treatment SSOT. Asserts the mapping stays complete
// and unambiguous so the harness's treatmentForSlide and the agent's prompt table
// (both derived from TREATMENT_MAP) can never drift from the spec or each other.
import { describe, expect, test } from "bun:test";
import { SlideSpecSchema } from "./spec";
import { FRAME_TREATMENTS, type FrameTreatment } from "./storyboard";
import {
  defaultTreatmentForKind,
  FALLBACK_KINDS,
  kindsForTreatment,
  SLIDE_KINDS,
  TREATMENT_MAP,
  treatmentTableLines,
  type SlideKind,
} from "./spec-treatments";

// The kinds the discriminated union actually declares (the real source of truth).
const schemaKinds = (SlideSpecSchema.options as { shape: { kind: { value: SlideKind } } }[]).map(
  (o) => o.shape.kind.value,
);

describe("spec-treatments SSOT (tripwire)", () => {
  test("SLIDE_KINDS equals the SlideSpecSchema discriminator, in order", () => {
    expect([...SLIDE_KINDS]).toEqual(schemaKinds);
  });

  test("TREATMENT_MAP keys == FRAME_TREATMENTS, both directions", () => {
    expect(Object.keys(TREATMENT_MAP).sort()).toEqual([...FRAME_TREATMENTS].sort());
  });

  test("every mapped kind is a real SlideKind", () => {
    for (const entry of Object.values(TREATMENT_MAP)) {
      for (const k of entry.kinds) expect(SLIDE_KINDS).toContain(k);
    }
  });

  test("at most one default treatment per kind", () => {
    for (const kind of SLIDE_KINDS) {
      const defaults = (Object.keys(TREATMENT_MAP) as (keyof typeof TREATMENT_MAP)[]).filter(
        (t) => TREATMENT_MAP[t].default && TREATMENT_MAP[t].kinds.includes(kind),
      );
      expect(defaults.length).toBeLessThanOrEqual(1);
    }
  });

  test("every treatment renders at least one kind", () => {
    for (const t of FRAME_TREATMENTS) expect(kindsForTreatment(t).length).toBeGreaterThan(0);
  });

  test("defaultTreatmentForKind agrees with the frozen default mapping", () => {
    const expected: Record<SlideKind, FrameTreatment | null> = {
      title: "cover",
      bullets: "feature-cards",
      statement: "quote",
      chart: "chart",
      comparison: "comparison",
      stats: "stat-grid",
      steps: "timeline",
      cards: "feature-cards",
      matrix: null,
      custom: null,
      composed: null,
      outro: "closing-plate",
    };
    for (const kind of SLIDE_KINDS) expect(defaultTreatmentForKind(kind)).toBe(expected[kind]);
  });

  test("FALLBACK_KINDS are exactly the kinds with no default treatment", () => {
    expect([...FALLBACK_KINDS].sort()).toEqual(["composed", "custom", "matrix"]);
  });

  test("treatmentTableLines renders one row per treatment, in map order", () => {
    const lines = treatmentTableLines();
    expect(lines.length).toBe(FRAME_TREATMENTS.length);
    expect(lines[0]).toContain("cover");
    expect(lines[0]).toContain("(kind: title)");
    // feature-cards renders two kinds → pluralized label.
    expect(lines.find((l) => l.includes("feature-cards"))).toContain("(kinds: cards, bullets)");
  });
});
