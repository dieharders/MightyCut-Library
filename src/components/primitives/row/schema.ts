import { z } from "zod";

export const RowSchema = z.object({
  label: z
    .string()
    .max(48)
    .describe("The metric this row compares (the ledger's left column)"),
  a: z
    .string()
    .max(60)
    .describe('The "them" cell — the status-quo value for this metric'),
  b: z
    .string()
    .max(60)
    .describe('The "us" cell — the highlighted winning value for this metric'),
});
export type RowParams = z.infer<typeof RowSchema>;
