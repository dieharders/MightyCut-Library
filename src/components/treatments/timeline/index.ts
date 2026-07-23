import template from "./template.html" with { type: "text" };
import { Step } from "../../primitives/step";
import { treatment } from "../../runtime/treatment";
import { timelineAnim } from "./anim";
import { TimelineSchema } from "./schema";

/** Numbered steps linked left-to-right — a responsive row of Step cards. */
export const Timeline = treatment({
  name: "timeline",
  childComponent: "step",
  schema: TimelineSchema,
  template,
  ground: "muted-2",
  example: { headline: "Four Steps" },
  fill: (p) => ({ headline: p.headline }),
  defaultChildren: () => [
    Step({ num: "01", title: "Survey", body: "Map the field automatically." }),
    Step({ num: "02", title: "Sync", body: "Nodes self-organize." }),
    Step({ num: "03", title: "Run", body: "Live coverage in minutes." }),
    Step({ num: "04", title: "Scale", body: "Add nodes on demand." }),
  ],
  layout: (n) => ({ "--cols": String(Math.min(n, 4)) }),
  anim: timelineAnim,
});
