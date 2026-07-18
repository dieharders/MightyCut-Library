import template from "./template.html" with { type: "text" };
import css from "./closing-plate.css" with { type: "text" };
import { Slab } from "../../primitives/slab";
import { Starburst } from "../../primitives/starburst";
import { treatment } from "../../runtime/treatment";
import { closingPlateAnim } from "./anim";
import { ClosingPlateSchema } from "./schema";

/** A full-bleed neobrutalist sign-off: one bold statement card on a pink ground,
 *  with an optional yellow CTA chip and a star popping off its corner. */
export const ClosingPlate = treatment({
  name: "closing-plate",
  schema: ClosingPlateSchema,
  template,
  css,
  ground: "pink",
  example: { headline: "Stay loud.", cta: "Start building" },
  defaultChildren: () => [],
  // A blue tilt-rect behind (upper-left) + a yellow star popping over the card corner.
  defaultDecorations: () => [
    Slab({ variant: "rectangle", x: 16, y: 19, size: 13, rotate: -7, accent: "blue", layer: "back" }),
    Starburst({ variant: "star", x: 68, y: 33, size: 9, accent: "yellow", layer: "front" }),
  ],
  fill: (p) => ({ headline: p.headline, cta: p.cta ?? null }),
  anim: closingPlateAnim,
});
