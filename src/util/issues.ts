// Format a ZodError into a compact, model-friendly issue list — the canonical
// copy shared by the library's compose validation and (via re-export) the
// harness's providers/types generate-and-repair loop, so the two never drift.
import type { z } from "zod";

export const issuesSummary = (error: z.ZodError): string =>
  error.issues
    .slice(0, 12)
    .map((i) => `- ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
