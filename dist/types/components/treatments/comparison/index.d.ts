/** A ledger of "them vs us" rows under two column headers, the winning column
 *  picked out in green — the block comparison frame (kind: comparison). */
export declare const Comparison: import("../../runtime").TreatmentFactory<import("zod").ZodObject<{
    headline: import("zod").ZodString;
    columns: import("zod").ZodDefault<import("zod").ZodTuple<[import("zod").ZodString, import("zod").ZodString], null>>;
}, import("zod/v4/core").$strip>>;
