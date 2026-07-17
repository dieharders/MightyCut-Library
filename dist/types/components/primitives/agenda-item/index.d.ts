/** A single ink-ruled agenda row: a pink index numeral, an uppercase title, and
 *  an optional right-aligned detail — the atom of the Agenda index list. */
export declare const AgendaItem: import("../../runtime").ComponentFactory<import("zod").ZodObject<{
    num: import("zod").ZodString;
    title: import("zod").ZodString;
    detail: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>;
