// Format a ZodError into a compact, model-friendly issue list — the canonical
// copy shared by the library's compose validation and (via re-export) the
// harness's providers/types generate-and-repair loop, so the two never drift.
import type { z } from "zod";

export const issuesSummary = (error: z.ZodError): string =>
  error.issues
    .slice(0, 12)
    .map((i) => `- ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");

/**
 * Record a cross-field validation failure from inside a `.check()` — `ctx.addIssue`'s
 * ergonomics without `.superRefine()`, which Zod 4 deprecates in favour of `.check()`.
 *
 * The two differ in exactly one way that matters at a call site: `.check()` hands you the raw
 * `{value, issues}` payload rather than a ctx with a convenience method, so an issue must carry
 * its own `input`. That is the value the error is ABOUT, and every one of our checks is about a
 * specific field, so defaulting it to the whole object would make the issue less useful than the
 * one `superRefine` produced for free. It defaults to `ctx.value` for the checks whose subject
 * genuinely is the object (a duplicate id across a list, a bookend slide in the wrong place).
 *
 * The emitted issue is otherwise byte-identical to the deprecated form — same `code`, `path` and
 * `message`, so `issuesSummary`, the spec repair loop's feedback to the model, and every test
 * asserting on a message are unaffected. Verified against both forms before the conversion.
 *
 * Lives here rather than beside any one schema because five schemas across two repos need it
 * (the library's spec, storyboard, plot and cluster-node; the harness's plan-approved spec
 * refinement), and it is the same three lines each time.
 */
export const addIssue = <T>(
  ctx: z.core.ParsePayload<T>,
  path: PropertyKey[],
  message: string,
  input: unknown = ctx.value,
): void => {
  ctx.issues.push({ code: "custom", input, path, message });
};
