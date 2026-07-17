/** The full-frame HUD overlay — brand (top-left) · title pill (top-right) · slide
 *  counter (bottom-right) · progress track (bottom), each gated by a boolean. A
 *  `frame` composite: the showcase renders it in a 1920×1080 frame slot. In the
 *  real render the harness still owns the root #hud chrome (legacy frameHud); this
 *  is the library/showcase piece. Gating uses the data-slot seam: omit a part's key
 *  to keep it, set it null to remove its whole subtree (pruneRemoved). */
export declare const Hud: import("../../runtime").ComponentFactory<import("zod").ZodObject<{
    brand: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodDefault<import("zod").ZodBoolean>;
    counter: import("zod").ZodDefault<import("zod").ZodBoolean>;
    progress: import("zod").ZodDefault<import("zod").ZodBoolean>;
    brandName: import("zod").ZodDefault<import("zod").ZodString>;
    tagline: import("zod").ZodOptional<import("zod").ZodString>;
    titleText: import("zod").ZodDefault<import("zod").ZodString>;
    counterText: import("zod").ZodDefault<import("zod").ZodString>;
    progressPct: import("zod").ZodDefault<import("zod").ZodNumber>;
}, import("zod/v4/core").$strip>>;
