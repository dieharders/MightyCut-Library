import template from "./template.html" with { type: "text" };
import { component } from "../../runtime/component";
import { PillSchema } from "./schema";

/** A label pill — the block eyebrow chrome: an ink-bordered, hard-shadowed pill in
 *  a pastel `accent`, uppercase mono text. Only the background differs by accent. */
export const Pill = component({
  name: "pill",
  schema: PillSchema,
  template,
  // No accent pinned — see caption/index.ts.
  example: { text: "Label Pill" },
  fill: (p) => ({ text: p.text }),
  // Emitted only when set — see caption/index.ts.
  layout: (p): Record<string, string> => (p.accent ? { "--pillbg": `var(--${p.accent})` } : {}),
  animIn: "rise",
  animInOpts: { dist: 18 },
});
