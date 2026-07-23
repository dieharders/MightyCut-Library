import template from "./template.html" with { type: "text" };
import { Card } from "../../primitives/card";
import { treatment } from "../../runtime/treatment";
import { featureCardsAnim } from "./anim";
import { FeatureCardsSchema } from "./schema";

/** Bordered feature cards with accent icon squares — a responsive grid of Card components. */
export const FeatureCards = treatment({
  name: "feature-cards",
  childComponent: "card",
  schema: FeatureCardsSchema,
  template,
  ground: "secondary",
  example: { headline: "Built for the whole workflow" },
  fill: (p) => ({ headline: p.headline }),
  // A DELIBERATE deviation from ACCENT_CYCLE (types/palette.ts): the third card takes
  // --accent-2, skipping --accent-1, because block reserves that yellow as its CTA colour
  // and a card icon square wearing it reads as a button.
  defaultChildren: () => [
    Card({ title: "Prompt to preview", body: "Describe the video; get a preview-ready deck back in one pass.", icon: "I", accent: "primary" }),
    Card({ title: "On-brand by default", body: "Themed frames, captions, and motion — no timeline surgery.", icon: "II", accent: "secondary" }),
    Card({ title: "Render on demand", body: "Publish the preview now; render the final MP4 whenever you like.", icon: "III", accent: "accent-2" }),
  ],
  layout: (n) => ({ "--cols": String(Math.min(n, 4)) }),
  anim: featureCardsAnim,
});
