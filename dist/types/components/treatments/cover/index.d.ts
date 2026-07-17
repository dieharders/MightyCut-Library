/** The opening title frame: an oversized neobrutalist headline on the cream
 *  ground, with an optional kicker pill and subtitle, flanked by a pink star and
 *  a blue offset rectangle (kind: title). A childless treatment. */
export declare const Cover: import("../../runtime").TreatmentFactory<import("zod").ZodObject<{
    headline: import("zod").ZodString;
    subtitle: import("zod").ZodOptional<import("zod").ZodString>;
    eyebrow: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>;
