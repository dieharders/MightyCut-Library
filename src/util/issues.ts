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
 * `continue: true` is what makes the issue byte-identical to the deprecated form, and it is
 * LOAD-BEARING rather than cosmetic: `superRefine`'s injected `addIssue` sets it by default
 * (`continue ??= !abort`), and Zod's check runner reads it as "this failure does not abort the
 * rest" — `util.aborted` scans the issues a check appended and, on any one without the flag,
 * SKIPS every later check on that schema. Raising an issue without it therefore silences the
 * checks behind it. That is invisible on a schema with one check (all of the library's) and
 * silently wrong the moment a second is layered on: the harness's `plannedSpecSchema` adds the
 * approved-plan roster check to `VideoSpecSchema`, so a duplicate slide id (raised by the spec's
 * own check, which runs first) used to swallow every `slides[i].id must be "…"` message for that
 * round of the repair loop — feedback the model needs to converge.
 *
 * The issue is otherwise identical — same `code`, `path` and `message`, so `issuesSummary`, the
 * spec repair loop's feedback to the model, and every test asserting on a message are unaffected.
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
  ctx.issues.push({ code: "custom", input, path, message, continue: true });
};
