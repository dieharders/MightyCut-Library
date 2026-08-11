import { z } from "zod";

/**
 * One scored row of the capability matrix.
 *
 * `cells` is a list of "yes"/"no" STRINGS rather than booleans, which is deliberate and not a
 * modelling accident. The web UI's param form renders an array field as one comma-separated
 * text input and coerces it back to `string[]` or `number[]` (`coerceField`, lib/library.ts) —
 * it has no boolean-array control, so `boolean[]` would round-trip as `["true","false"]` and be
 * rejected by Zod the moment anyone touched the row in the editor. An enum of two words is
 * editable by hand ("yes,no,yes"), reads correctly in the JSON, and rejects a typo loudly.
 * The spec's `matrix` slide still carries real booleans; spec-map converts at the seam.
 */
export const MatrixRowSchema = z.object({
  label: z
    .string()
    .max(32)
    .describe("The option being scored (the matrix's left column)"),
  sublabel: z
    .string()
    .max(50)
    .optional()
    .describe("Optional second line under the label — a vendor, a category, a caveat"),
  cells: z
    .array(z.enum(["yes", "no"]))
    .min(2)
    .max(5)
    .describe(
      'One answer per criteria column, in the treatment\'s column order — e.g. "yes,no,yes"',
    ),
  highlight: z
    .boolean()
    .optional()
    .describe("Accent this row — the proposer's own, conventionally placed last"),
});
export type MatrixRowParams = z.infer<typeof MatrixRowSchema>;
