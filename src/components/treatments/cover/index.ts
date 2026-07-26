import template from "./template.html" with { type: "text" };
import { treatment } from "../../runtime/treatment";
import { coverAnim } from "./anim";
import { CoverSchema } from "./schema";

/** The opening title frame: an oversized headline on the theme's cover ground, with
 *  an optional kicker pill and subtitle. A childless treatment. The flanking shapes
 *  are DECORATIONS, declared per theme (theme.decorationDefaults.cover) rather than
 *  here — decoration families are theme-exclusive, so a treatment can't name any. */
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
  fill: (p) => ({ headline: p.headline, subtitle: p.subtitle ?? null, eyebrow: p.eyebrow ?? null }),
  anim: coverAnim,
});
