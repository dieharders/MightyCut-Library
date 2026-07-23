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
  // No accent pinned — see caption/index.ts. (Pinning "dark" is exactly what made the
  // icon invisible on future's dark ground.)
  example: { name: "shield", size: 10 },
  rawFill: (p) => ({ svg: iconSvg(p.name) }),
  // --icol is emitted only when set — see caption/index.ts. (This is exactly the case
  // that forced future to pin its icon to cyan: the old shared default was `dark`.)
  layout: (p) => ({
    ...(p.accent ? { "--icol": `var(--${p.accent})` } : {}),
    "--isize": remGrid(p.size * 1.2),
  }),
  animIn: "scale",
});
