import type { AnimDescriptor } from "../../runtime/anim";
import type { MatrixRowParams } from "./schema";

/**
 * The marks tick in left to right AFTER the row has landed.
 *
 * The row's whole-element entrance (`animIn: "rise"` on the component) moves the plate and its
 * label as one box — the ROW is the container now, label and marks on one plate (every theme's
 * matrix-row.css), and a plate nothing animates sits on the frame before its content arrives.
 * The stagger used to aim at the row root itself, which the interpreter expands to the root's
 * CHILDREN (`.mrow > *`): that revealed the label and the cell strip while leaving the box they
 * sit in untouched, which was invisible while the plates were on the children and a hole the
 * moment they moved to the row.
 *
 * So the stagger aims at the cell STRIP (`data-anim="cells"`), a different target from the
 * entrance's, so the runtime's one-reveal-per-box guard keeps both; and it waits `plus: 0.2`
 * into the row's slot so the ticks arrive on a plate that is already there. (The Matrix
 * treatment offsets each row to lines 1..N automatically.)
 */
export const matrixRowAnim = (_p: MatrixRowParams): AnimDescriptor[] => [
  { kind: "staggerIn", target: "cells", time: { at: "line", n: 0, plus: 0.2 }, opts: { dist: 14, each: 0.08 } },
];
