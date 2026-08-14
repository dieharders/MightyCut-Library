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
  // --cols is the criteria count, and it is THE column track count for the whole table: it is
  // set on the treatment root, so it inherits into every row and each row's skin lays its cells
  // on it. A row's own `--mcols` survives only as the fallback for a row rendered BARE (the
  // showcase's component preview, which has no matrix ancestor to inherit from).
  //
  // The two used to be independent track counts in separate formatting contexts — the header is
  // `1.4fr repeat(var(--cols), 1fr)` while a row's cell strip is its own
  // `repeat(var(--mcols), 1fr)` — so four criteria against a three-cell row rendered a header
  // and a body subdivided differently, right down to the label column's share (1.4/5.4 vs
  // 1.4/4.4), and the whole row shifted. One source means a short row simply leaves its last
  // column unanswered, in place, which is the truthful drawing of a row that answered three of
  // four. `childrenIssue` below refuses it outright wherever the caller is checkable.
  layout: (_n, p) => ({ "--cols": String(p.criteria.length) }),
  // The header's criteria and a row's cells are counted independently — `.min(2).max(5)` on
  // each, never against each other — and neither schema can see the other (a treatment's schema
  // never sees its children; a child's never sees the treatment's params). This is the one place
  // both are in hand. `spec.ts` guards the SPEC path; the deck editor is a hand-built-row
  // producer and had nothing.
  childrenIssue: (p, children) => {
    const want = p.criteria.length;
    const wrong = children
      .map((c, i) => ({ i, cells: (c.params?.cells as unknown[] | undefined)?.length }))
      .filter((r) => r.cells !== undefined && r.cells !== want);
    if (wrong.length === 0) return null;
    return (
      `${wrong.length === 1 ? "row" : "rows"} ${wrong.map((r) => r.i).join(", ")} ` +
      `answer ${wrong.map((r) => r.cells).join("/")} criteria but the matrix has ${want} ` +
      `(${p.criteria.join(", ")}) — every row needs one cell per criterion, in the same order`
    );
  },
  defaultChildren: () => [
    MatrixRow({ label: "Status quo", sublabel: "What most teams run today", cells: ["no", "yes", "no"] }),
    MatrixRow({ label: "Point tools", sublabel: "Stitched together per team", cells: ["yes", "no", "no"] }),
    MatrixRow({ label: "Our platform", sublabel: "The proposed approach", cells: ["yes", "yes", "yes"], highlight: true }),
  ],
  anim: matrixAnim,
});
