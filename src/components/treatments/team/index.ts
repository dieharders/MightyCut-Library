import template from "./template.html" with { type: "text" };
import { TeamMember } from "../../primitives/team-member";
import { ACCENT_CYCLE } from "../../../types/palette";
import { treatment } from "../../runtime/treatment";
import { teamAnim } from "./anim";
import { TeamSchema } from "./schema";

const PEOPLE = [
  { name: "Ada Byron", role: "Head of Research", org: "Analytical Engines" },
  { name: "Grace Hopper", role: "Chief Architect", org: "Compiler Group" },
  { name: "Alan Turing", role: "Principal Scientist", org: "Machine Intelligence" },
];

/** Team member frames: a roster of people, each a monogram disc over a name and a role. */
export const Team = treatment({
  name: "team",
  childComponent: "team-member",
  schema: TeamSchema,
  template,
  ground: "muted-1",
  example: { headline: "The people behind it", caption: "Available for the duration of the engagement" },
  fill: (p) => ({ headline: p.headline, caption: p.caption ?? null }),
  // --cols mirrors feature-cards' density policy: a roster wider than four columns stops being
  // a set of faces and becomes a list, so it wraps instead.
  layout: (n) => ({ "--cols": String(Math.min(n, 4)) }),
  defaultChildren: () =>
    PEOPLE.map((p, i) => TeamMember({ ...p, accent: ACCENT_CYCLE[i % ACCENT_CYCLE.length] })),
  anim: teamAnim,
});
