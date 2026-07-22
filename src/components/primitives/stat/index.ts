import template from "./template.html" with { type: "text" };
import { component } from "../../runtime/component";
import { statAnim } from "./anim";
import { StatSchema } from "./schema";

/** A neobrutalist stat card: a bordered white tile whose figure counts up from 0. */
export const Stat = component({
  name: "stat",
  schema: StatSchema,
  template,
  example: { value: 240, label: "Requests / sec" },
  fill: (p) => ({ number: `${p.unitPrefix ?? ""}0${p.unitSuffix ?? ""}`, label: p.label }),
  layout: (p) => ({ "--dot": `var(--${p.accent})` }),
  animIn: "rise",
  animInOpts: { dist: 26 },
  anim: statAnim,
});
