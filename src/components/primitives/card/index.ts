import template from "./template.html" with { type: "text" };
import { iconSvg } from "../../icons";
import { component } from "../../runtime/component";
import { CardSchema } from "./schema";

/**
 * A feature card: a bordered tile with an accent icon square, a bold title, and a supporting
 * line. The square carries an inline-SVG icon from the shared set — the same glyphs the `icon`
 * primitive draws, injected through the same `rawFill` / `data-html` seam (icons.ts, `iconSvg`)
 * — rather than typed text; each theme's card.css sizes and colours the glyph inside the badge
 * it already draws, so a card badge and a standalone icon stay one object per theme.
 */
export const Card = component({
  name: "card",
  schema: CardSchema,
  template,
  example: { title: "Prompt to preview", body: "Describe the video; get a preview-ready deck back in one pass.", icon: "sparkles" },
  fill: (p) => ({ "card-title": p.title, "card-body": p.body }),
  rawFill: (p) => ({ "card-icon": iconSvg(p.icon) }),
  // Emitted only when set — see caption/index.ts.
  layout: (p): Record<string, string> => (p.accent ? { "--ic": `var(--${p.accent})` } : {}),
  animIn: "rise",
  animInOpts: { dist: 26 },
});
