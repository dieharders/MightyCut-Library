import template from "./template.html" with { type: "text" };
import css from "./icon.css" with { type: "text" };
import { iconSvg } from "../../icons";
import { component } from "../../runtime/component";
import { IconSchema } from "./schema";

/** An inline-SVG icon from the shared 21-icon set. Uses the runtime `rawFill` seam
 *  to inject the (unescaped) SVG markup into a data-html slot; `accent` drives the
 *  stroke color (via `currentColor`) and `size` the rem dimensions (× 1.2 from the
 *  old cqw scale, so `size` stays a percent-of-design-width knob). */
export const Icon = component({
  name: "icon",
  schema: IconSchema,
  template,
  css,
  example: { name: "shield", accent: "black", size: 10 },
  rawFill: (p) => ({ svg: iconSvg(p.name) }),
  layout: (p) => ({ "--icol": `var(--${p.accent})`, "--isize": `${+(p.size * 1.2).toFixed(2)}rem` }),
  animIn: "scale",
});
