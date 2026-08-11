import { z } from "zod";
import { PALETTE_VARS } from "../../../types/palette";

/**
 * One person in a team frame: a monogram disc over a name, a role, and an optional
 * affiliation.
 *
 * A MONOGRAM, not an icon. The obvious alternative was to reuse the `icon` primitive, and it
 * was rejected on looking at what the icon set actually holds: the closest glyph is `users`, a
 * two-person GROUP mark, and there is no single-person one. Repeating one generic mark under
 * five different names says "person, person, person" — the monogram says WHICH person, from
 * data the slide already carries, and it is the device an editorial team page uses anyway.
 * (Adding a `person` glyph would mean editing icons.ts AND the duplicated ICON_PATHS in
 * assets/fx/mc.js; worth doing for its own sake, not needed here.)
 */
export const TeamMemberSchema = z.object({
  name: z.string().min(1).max(32).describe("The person's name, as they write it"),
  role: z.string().min(1).max(40).describe('Title or function, e.g. "Head of Research"'),
  org: z
    .string()
    .max(32)
    .optional()
    .describe("Affiliation — set it only when it differs from the deck's own"),
  initials: z
    .string()
    .max(3)
    .optional()
    .describe("Monogram override; derived from the name when unset"),
  accent: z
    .enum(PALETTE_VARS)
    .optional()
    .describe("Palette role for the monogram disc (unset ⇒ the theme's default)"),
});
export type TeamMemberParams = z.infer<typeof TeamMemberSchema>;
