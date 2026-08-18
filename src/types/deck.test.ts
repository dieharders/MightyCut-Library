// The two bounds a DECK DOCUMENT carries, and why they are on the schema rather than at a
// caller. A deck is CLIENT-SUPPLIED on the editor's rebuild path and then persisted verbatim —
// to the box's `project/deck.json` and to the `projects.deck` jsonb column — so these are the
// only place the shape is guaranteed for every consumer (the gateway, `bun cli deck`, and the
// editor itself) rather than by whichever one remembered to check.
import { describe, expect, test } from "bun:test";
import { DeckDocumentSchema, MAX_DECK_SCENES } from "./deck";

const scene = (id: string) => ({ id, treatment: "list" as const, params: {}, children: [] });
const deck = (scenes: ReturnType<typeof scene>[]) => ({
  version: 1 as const,
  theme: "block" as const,
  scenes,
});

describe("DeckDocumentSchema bounds", () => {
  test("accepts a deck at exactly the scene cap", () => {
    const at = deck(Array.from({ length: MAX_DECK_SCENES }, (_, i) => scene(`s${i}`)));
    expect(DeckDocumentSchema.safeParse(at).success).toBe(true);
  });

  test("rejects one scene past the cap", () => {
    const over = deck(Array.from({ length: MAX_DECK_SCENES + 1 }, (_, i) => scene(`s${i}`)));
    expect(DeckDocumentSchema.safeParse(over).success).toBe(false);
  });

  // Consumers key by id against the spec's slide roster — the root builds `Record<compId,
  // RootScene>` and the builder writes one file per scene — so two scenes sharing an id
  // silently overwrite each other, and the COUNT-based guards downstream still pass because the
  // totals are unchanged. `StoryboardSchema` has required this of `sceneId` all along.
  test("rejects duplicate scene ids", () => {
    const dupe = DeckDocumentSchema.safeParse(deck([scene("a"), scene("b"), scene("a")]));
    expect(dupe.success).toBe(false);
    if (!dupe.success) {
      expect(dupe.error.issues.some((i) => i.message.includes("duplicate scene id 'a'"))).toBe(true);
      // Pointed at the OFFENDING scene, not the document, so an editor can surface it in place.
      expect(dupe.error.issues.some((i) => i.path.join(".") === "scenes.2.id")).toBe(true);
    }
  });

  test("accepts distinct ids", () => {
    expect(DeckDocumentSchema.safeParse(deck([scene("a"), scene("b")])).success).toBe(true);
  });
});
