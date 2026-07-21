import type { AnimDescriptor } from "../../runtime/anim";
import type { BarParams } from "./schema";

/** Internal reveal: the column grows up from the baseline, then the value counts up
 *  from 0 (the whole-bar entrance is the `animIn` transition on the component def). */
export const barAnim = (p: BarParams): AnimDescriptor[] => [
  { kind: "growBar", target: "col", time: { at: "line", n: 0 }, opts: { prop: "scaleY" } },
  {
    kind: "countUp",
    target: "value",
    time: { at: "line", n: 0, plus: 0.1 },
    opts: { to: p.value, prefix: p.unitPrefix ?? "", suffix: p.unitSuffix ?? "" },
  },
];
