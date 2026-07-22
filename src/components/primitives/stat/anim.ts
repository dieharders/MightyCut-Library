import type { AnimDescriptor } from "../../runtime/anim";
import type { StatParams } from "./schema";

/** Internal reveal: the number counts up from 0 (the card's whole-element entrance
 *  is the `animIn` transition on the component def). */
export const statAnim = (p: StatParams): AnimDescriptor[] => [
  {
    kind: "countUp",
    target: "number",
    time: { at: "line", n: 0, plus: 0.1 },
    opts: { to: p.value, decimals: p.decimals, prefix: p.unitPrefix ?? "", suffix: p.unitSuffix ?? "" },
  },
];
