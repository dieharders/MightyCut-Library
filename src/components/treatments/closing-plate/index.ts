import template from "./template.html" with { type: "text" };
import { treatment } from "../../runtime/treatment";
import { closingPlateAnim } from "./anim";
import { ClosingPlateSchema } from "./schema";

/** A full-bleed sign-off: one bold statement card on the theme's primary ground, with
 *  an optional CTA chip. The shapes popping off its corner are DECORATIONS, declared
 *  per theme (theme.decorationDefaults["closing-plate"]) — see cover/index.ts. */
export const ClosingPlate = treatment({
  name: "closing-plate",
  schema: ClosingPlateSchema,
  template,
  ground: "primary",
  example: { headline: "Stay loud.", cta: "Start building" },
  defaultChildren: () => [],
  fill: (p) => ({ headline: p.headline, cta: p.cta ?? null }),
  anim: closingPlateAnim,
});
