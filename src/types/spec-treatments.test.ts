// Tripwire for the LOOK vocabulary.
//
// The thing being guarded changed shape. It used to be a MAP between two vocabularies — spec
// kinds and treatments — so the tests asserted the map stayed total and unambiguous (every
// treatment renders some kind; at most one default per kind; a frozen kind→treatment table).
// A look is one name now, so those questions no longer exist; what has to hold instead is that
// the one list agrees with the two places a name is actually consumed: the spec's discriminated
// union (the data shape) and the component registry (the renderer).
//
// The registry side is asserted in components/registry.test.ts, which can import the registry
// without pulling the whole component graph into this file's dependency set.
import { describe, expect, test } from "bun:test";
import { SlideSpecSchema } from "./spec";
import {
  FRAME_TREATMENTS,
  isComposableKind,
  labelForLook,
  LOOKS,
  lookFor,
  lookTableLines,
  SLIDE_KINDS,
  UNCOMPOSED_KINDS,
  type SlideKind,
} from "./spec-treatments";

// The kinds the discriminated union actually declares (the other real source of truth).
const schemaKinds = (SlideSpecSchema.options as { shape: { kind: { value: SlideKind } } }[]).map(
  (o) => o.shape.kind.value,
);

describe("LOOKS vocabulary (tripwire)", () => {
  // Set equality, not order. LOOKS' order is PRESENTATION — it drives the prompt tables and the
  // editor's picker — while the union's order is an artefact of how the file reads. Asserting
  // both would make reordering one a failure in the other for no reason.
  test("SLIDE_KINDS and the SlideSpecSchema discriminator are the same set", () => {
    expect([...SLIDE_KINDS].sort()).toEqual([...schemaKinds].sort());
  });

  test("no name appears twice", () => {
    expect(new Set(SLIDE_KINDS).size).toBe(SLIDE_KINDS.length);
  });

  test("every look name is kebab-case", () => {
    for (const l of LOOKS) expect(l.name).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  test("FRAME_TREATMENTS is SLIDE_KINDS minus the uncomposable ones", () => {
    expect(([...FRAME_TREATMENTS] as string[]).sort()).toEqual(
      ([...SLIDE_KINDS] as SlideKind[]).filter((k) => !UNCOMPOSED_KINDS.includes(k)).sort(),
    );
  });

  // `custom` is the ONE escape hatch and is supposed to stay the one: it means "no look can do
  // this, a slide engineer builds it by hand". A second uncomposable name would be a kind that
  // silently renders as a placeholder, which is the defect `composed` was deleted for.
  test("custom is the only uncomposable look", () => {
    expect([...UNCOMPOSED_KINDS].sort()).toEqual(["custom"]);
    expect(isComposableKind("custom")).toBe(false);
    expect(isComposableKind("bar-ranking")).toBe(true);
  });

  test("lookFor / labelForLook resolve every name, and degrade on an unknown one", () => {
    for (const k of SLIDE_KINDS) {
      expect(lookFor(k)?.name).toBe(k);
      expect(labelForLook(k)).toBe(lookFor(k)!.label);
    }
    expect(lookFor("no-such-look")).toBeUndefined();
    expect(labelForLook("no-such-look")).toBe("no-such-look");
  });

  // The picker SCANS these; a sentence in the slot is unreadable at a glance and an em-dash
  // reads as a description that has been cut off. The guidance goes in `when`, which is what
  // the prompt tables and the editor's tooltip render.
  test("labels are short scannable copy, not descriptions", () => {
    for (const l of LOOKS) {
      expect(l.label.length).toBeLessThan(32);
      expect(l.label).not.toContain("—");
    }
  });

  test("every look states when to choose it", () => {
    for (const l of LOOKS) expect(l.when.trim().length).toBeGreaterThan(20);
  });

  // THE assertion this whole change exists for. The outline planner chooses a slide's look from
  // this table, and it used to choose from a hand-written list in the harness's prompt that had
  // silently lost three names — so three looks, and the treatments behind them, were unreachable
  // by any model on every path. A look missing here is that bug again.
  test("lookTableLines renders every look, name and guidance", () => {
    const lines = lookTableLines();
    expect(lines.length).toBe(LOOKS.length);
    for (const l of LOOKS) {
      const row = lines.find((line) => line.startsWith(`- ${l.name} `));
      expect(row, `no prompt-table row for look "${l.name}"`).toBeDefined();
      expect(row).toContain(l.when);
    }
  });
});
