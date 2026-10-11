import template from "./template.html" with { type: "text" };
import { Cta } from "../../primitives/cta";
import { treatment } from "../../runtime/treatment";
import { outroAnim } from "./anim";
import { OutroSchema } from "./schema";

/**
 * A full-bleed sign-off: one bold statement card on the theme's primary ground, with the call to
 * action beneath it and an optional contact line under that. The contact absent removes its node
 * outright (fillSlots).
 *
 * THE CALL TO ACTION IS THE `cta` COMPONENT, composed as this plate's one child. It used to be a
 * plain `.cta` div in the template that every theme's outro.css then skinned by hand to look
 * like its cta.css — six parallel recipes for one button, each free to drift from the component
 * it was imitating (and one did: creative's plate dropped the shadow its cta kept). As a child
 * the button is drawn by cta.css under every theme, the plate's skin says only how it sits ON
 * the plate (`.closing-plate .cta-c`: margin, and a size step down from the standalone button),
 * and the editor offers it as the component it is. The shapes popping off the plate's corner
 * are DECORATIONS, declared per theme (theme.decorationDefaults["outro"]) — see cover/index.ts.
 */
export const Outro = treatment({
  name: "outro",
  childComponent: "cta",
  schema: OutroSchema,
  template,
  ground: "primary",
  example: { headline: "Stay loud." },
  // The default button: no arrow, as the plate's own chip never had one — the plate IS the end
  // of the deck, and an arrow points past it.
  defaultChildren: () => [Cta({ text: "Start building", arrow: false })],
  fill: (p) => ({ headline: p.headline, contact: p.contact ?? null }),
  anim: outroAnim,
});
