import template from "./template.html" with { type: "text" };
import { MatrixRow } from "../../primitives/matrix-row";
import { treatment } from "../../runtime/treatment";
import { matrixAnim } from "./anim";
import { MatrixSchema } from "./schema";

/**
 * A check/cross capability table: options down the left, criteria across the top, the
 * proposer's row accented.
 *
 * The column COUNT varies (2-5) but a treatment's `fill` can only set text on slots that exist
 * in its template, so the template carries five and `fill` returns null for the ones this slide
 * doesn't use — `fillSlots` marks a null slot `data-remove` and `pruneRemoved` drops it before
 * serialization. That is the built-in mechanism for exactly this, and it means the varying
 * column count needs no runtime change and leaves no empty boxes in the output.
 */
export const Matrix = treatment({
  name: "matrix",
  childComponent: "matrix-row",
  schema: MatrixSchema,
  template,
  // The comparison ledger's ground, because this is the comparison ledger's sibling: both are
  // rows answering columns, and in the two themes that keep per-treatment grounds (block and
  // creative — everyone else pins one via groundDefault) landing the two tables on the same
  // plane is what makes them read as one device rather than two.
  ground: "accent-1",
  example: {
    headline: "How the options compare",
    criteria: ["Fast", "Auditable", "Self-serve"],
    caption: "Scored against the three criteria that decide it",
  },
  fill: (p) => ({
    headline: p.headline,
    caption: p.caption ?? null,
    "crit-1": p.criteria[0] ?? null,
    "crit-2": p.criteria[1] ?? null,
    "crit-3": p.criteria[2] ?? null,
    "crit-4": p.criteria[3] ?? null,
    "crit-5": p.criteria[4] ?? null,
  }),
  // --cols is the criteria count, so the header and every row share one column track count.
  // The rows get it too (matrix-row's own --mcols), but the header lives here.
  layout: (_n, p) => ({ "--cols": String(p.criteria.length) }),
  defaultChildren: () => [
    MatrixRow({ label: "Status quo", sublabel: "What most teams run today", cells: ["no", "yes", "no"] }),
    MatrixRow({ label: "Point tools", sublabel: "Stitched together per team", cells: ["yes", "no", "no"] }),
    MatrixRow({ label: "Our platform", sublabel: "The proposed approach", cells: ["yes", "yes", "yes"], highlight: true }),
  ],
  anim: matrixAnim,
});
