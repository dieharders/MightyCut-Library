import template from "./template.html" with { type: "text" };
import { component } from "../../runtime/component";
import { StepSchema } from "./schema";

/** A neobrutalist numbered step card: a bordered white tile with a yellow number
 *  chip, linked to the next step by a short connector bar. */
export const Step = component({
  name: "step",
  schema: StepSchema,
  template,
  example: { num: "01", title: "Survey", body: "Map the field automatically." },
  fill: (p) => ({ "step-num": p.num, "step-title": p.title, "step-body": p.body ?? null }),
  animIn: "rise",
  animInOpts: { dist: 26 },
});
