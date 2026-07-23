import template from "./template.html" with { type: "text" };
import { Slab } from "../../primitives/slab";
import { Starburst } from "../../primitives/starburst";
import { treatment } from "../../runtime/treatment";
import { coverAnim } from "./anim";
import { CoverSchema } from "./schema";

/** The opening title frame: an oversized neobrutalist headline on the cream
 *  ground, with an optional kicker pill and subtitle, flanked by a pink star and
 *  a blue offset rectangle. A childless treatment. */
export const Cover = treatment({
  name: "cover",
  schema: CoverSchema,
  template,
  ground: "muted-1",
  example: {
    headline: "Block, bordered, crooked.",
    subtitle: "A maximalist neobrutalist frame system.",
    eyebrow: "MightyCut",
  },
  defaultChildren: () => [],
  // The pink star (top-right) + blue tilt-rect (lower-right) flourishes.
  defaultDecorations: () => [
    Starburst({ variant: "star", x: 85, y: 22, size: 13, accent: "primary", layer: "back" }),
    Slab({ variant: "rectangle", x: 78, y: 78, size: 15, rotate: -6, accent: "secondary", layer: "back" }),
  ],
  fill: (p) => ({ headline: p.headline, subtitle: p.subtitle ?? null, eyebrow: p.eyebrow ?? null }),
  anim: coverAnim,
});
