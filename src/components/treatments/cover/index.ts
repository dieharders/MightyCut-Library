import template from "./template.html" with { type: "text" };
import { treatment } from "../../runtime/treatment";
import { coverAnim } from "./anim";
import { CoverSchema } from "./schema";

/** The opening title frame: an oversized headline on the theme's cover ground, with an
 *  optional subtitle. A childless treatment. The flanking shapes are DECORATIONS, declared
 *  per theme (theme.decorationDefaults.cover) rather than here — decoration families are
 *  theme-exclusive, so a treatment can't name any.
 *
 *  There is deliberately NO eyebrow slot (see schema.ts): the deck's section label is drawn
 *  by the HUD's top-right corner, and the cover used to print the same words a second time. */
export const Cover = treatment({
  name: "cover",
  schema: CoverSchema,
  template,
  ground: "muted-1",
  example: {
    headline: "Block, bordered, crooked.",
    subtitle: "A maximalist neobrutalist frame system.",
  },
  defaultChildren: () => [],
  fill: (p) => ({ headline: p.headline, subtitle: p.subtitle ?? null }),
  anim: coverAnim,
});
