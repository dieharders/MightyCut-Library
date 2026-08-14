import template from "./template.html" with { type: "text" };
import { Card } from "../../primitives/card";
import { treatment } from "../../runtime/treatment";
import { listAnim } from "./anim";
import { ListSchema } from "./schema";

/**
 * The general-purpose list — 2-5 short claims, one per line.
 *
 * It renders as cards TODAY, sharing `feature-cards`' skin in every theme (hence the shared
 * class on the template, with a `.list` hook beside it for a skin to key off later). That is
 * not a placeholder standing in for something missing: the two looks have always produced the
 * same composition — the harness normalised bullet slides and card slides into one `{title,
 * body}` shape and emitted identical `card` children for both — so the only thing that was
 * ever different about a "bullets" slide was the data the writer put in it, and that is what
 * this look now names.
 *
 * Splitting it out is what makes the two SELECTABLE as separate looks, and gives the planned
 * list-number rendering (a bulleted or numbered list of cards, on the `list-number` primitive)
 * somewhere to land without touching the spec, the planner, the editor or any wiring.
 */
export const List = treatment({
  name: "list",
  childComponent: "card",
  schema: ListSchema,
  template,
  ground: "secondary",
  example: { headline: "What the platform gives you" },
  fill: (p) => ({ headline: p.headline }),
  defaultChildren: () => [
    Card({ title: "One prompt in", body: "Describe the video you want.", icon: "I", accent: "primary" }),
    Card({ title: "A deck back", body: "Themed, captioned and timed to the voiceover.", icon: "II", accent: "secondary" }),
    Card({ title: "Render when ready", body: "Preview first; the MP4 is a separate step.", icon: "III", accent: "accent-2" }),
  ],
  layout: (n) => ({ "--cols": String(Math.min(n, 4)) }),
  anim: listAnim,
});
