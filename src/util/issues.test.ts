// Tripwires for addIssue — the shared `.check()` issue-raiser (util/issues.ts), used by five
// schemas across two repos (the library's spec, storyboard, plot and cluster-node; the harness's
// plan-approved spec refinement).
import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { addIssue } from "./issues";

describe("addIssue", () => {
  test("carries the path and message it was given", () => {
    const schema = z
      .object({ a: z.string() })
      .check((ctx) => addIssue(ctx, ["a"], "no good"));
    const res = schema.safeParse({ a: "x" });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]!.path).toEqual(["a"]);
      expect(res.error.issues[0]!.message).toBe("no good");
    }
  });

  /**
   * The `continue: true` flag, which is the whole reason this test file exists.
   *
   * `superRefine` — which `.check()` replaced when Zod 4 deprecated it — set it on every issue
   * by default (`continue ??= !abort`), and Zod's check runner reads it as "this failure does
   * not abort the rest": `util.aborted` scans the issues a check appended and, on any one
   * WITHOUT the flag, skips every later check on that schema. Drop it and a check silences the
   * checks behind it.
   *
   * That is invisible on a schema with a single check — which is all of the library's, so
   * nothing here would catch its loss. It is silently wrong the moment a second check is
   * layered on, and one is: the harness's `plannedSpecSchema` adds the approved-plan roster
   * check to `VideoSpecSchema`, and a spec that also broke a spec-level rule came back with
   * only the latter, costing the repair loop a round of the per-slide feedback that pinning
   * the plan exists to produce. Hence a tripwire on the helper rather than on a caller.
   */
  test("a raised issue does not abort the checks layered after it", () => {
    const base = z
      .object({ a: z.string() })
      .check((ctx) => addIssue(ctx, ["a"], "from the first check"));
    const layered = base.check((ctx) => addIssue(ctx, ["a"], "from the second check"));
    const res = layered.safeParse({ a: "x" });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.map((i) => i.message)).toEqual([
        "from the first check",
        "from the second check",
      ]);
    }
  });
});
