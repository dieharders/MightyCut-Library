import template from "./template.html" with { type: "text" };
import { treatment } from "../../runtime/treatment";
import { outroAnim } from "./anim";
import { OutroSchema } from "./schema";

/** A full-bleed sign-off: one bold statement card on the theme's primary ground, with
 *  an optional CTA chip. The shapes popping off its corner are DECORATIONS, declared
 *  per theme (theme.decorationDefaults["outro"]) — see cover/index.ts. */
export const Outro = treatment({
  name: "outro",
  schema: OutroSchema,
  template,
  ground: "primary",
  example: { headline: "Stay loud.", cta: "Start building" },
  defaultChildren: () => [],
  fill: (p) => ({ headline: p.headline, cta: p.cta ?? null }),
  anim: outroAnim,
});
