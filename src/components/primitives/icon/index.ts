import template from "./template.html" with { type: "text" };
import { iconSvg } from "../../icons";
import { component } from "../../runtime/component";
import { remGrid } from "../../runtime/css";
import { IconSchema } from "./schema";

/** An inline-SVG icon from the shared 21-icon set. Uses the runtime `rawFill` seam
 *  to inject the (unescaped) SVG markup into a data-html slot; `accent` drives the
 *  stroke color (via `currentColor`) and `size` the rem dimensions (× 1.2, quantized
 *  to the 0.125rem grid, so `size` stays a percent-of-design-width knob). */
export const Icon = component({
  name: "icon",
  schema: IconSchema,
  template,
  example: { name: "shield", accent: "dark", size: 10 },
  rawFill: (p) => ({ svg: iconSvg(p.name) }),
  layout: (p) => ({ "--icol": `var(--${p.accent})`, "--isize": remGrid(p.size * 1.2) }),
  animIn: "scale",
});
