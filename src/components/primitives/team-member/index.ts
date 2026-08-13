import template from "./template.html" with { type: "text" };
import { component } from "../../runtime/component";
import { TeamMemberSchema, type TeamMemberParams } from "./schema";

/**
 * The monogram, derived from the name when the author doesn't override it: first letters of the
 * first and last words, so "Ada Byron" → "AB" and a mononym → one letter. Deterministic and
 * ASCII-safe via toUpperCase on whole code points (`[...word]`, not `word[0]`, so a name
 * starting with an astral character is not sliced in half).
 */
const monogram = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const first = [...words[0]!][0] ?? "";
  const last = words.length > 1 ? ([...words[words.length - 1]!][0] ?? "") : "";
  return (first + last).toUpperCase();
};

/** One person in a team frame: monogram disc, name, role, optional affiliation. */
export const TeamMember = component({
  name: "team-member",
  schema: TeamMemberSchema,
  template,
  example: { name: "Ada Byron", role: "Head of Research", org: "Analytical Engines" },
  fill: (p: TeamMemberParams) => ({
    initials: p.initials?.trim() || monogram(p.name),
    name: p.name,
    role: p.role,
    // Pruned when absent — a member with no separate affiliation leaves no empty line.
    org: p.org ?? null,
  }),
  // --tcol emitted only when set, so an unpicked member falls to the theme's own default
  // rather than to a colour this file chose (see caption/index.ts for the same rule).
  layout: (p): Record<string, string> => (p.accent ? { "--tcol": `var(--${p.accent})` } : {}),
  // THE CARD ENTERS AS A CARD. This used to be an internal `staggerIn` on `item` with no
  // `animIn`, which is the box-less shape: `staggerIn` targets `.item > *` (mc.js), so it
  // cascaded the monogram, name and role while the PLATE they sit on — every skin's border,
  // ground and hard offset — was painted from frame 0. A roster therefore opened as a row of
  // empty tiles that filled in one by one. `.tmember` paints, so its entrance belongs on the
  // whole element, exactly as `card` (the structurally identical plated tile) declares it;
  // the treatment still gives each member its own cascade slot, so the roster introduces one
  // person at a time. `staggerIn` remains right for a root that paints nothing — cluster-node's
  // `.cnode` is a zero-height positioning shell whose arm and puck are the real boxes.
  animIn: "rise",
  animInOpts: { dist: 26 },
});
