import template from "./template.html" with { type: "text" };
import { iconSvg } from "../../icons";
import { component } from "../../runtime/component";
import { matrixRowAnim } from "./anim";
import { MatrixRowSchema, type MatrixRowParams } from "./schema";

/**
 * The whole cell strip as ONE raw-HTML string, injected through the `rawFill` / `data-html`
 * seam the `icon` component already uses.
 *
 * One slot rather than five fixed ones, because the cells are the only part of this component
 * whose COUNT varies and whose content is markup. Five `data-html` slots pruned down to the
 * row's length would work (fillRaw removes a null slot exactly like fillSlots), but it would put
 * the column count in two places — here and in the treatment's own criteria slots — and they
 * would have to agree. The strip is built from the array it is derived from, so it cannot
 * disagree with itself.
 *
 * `check` / `cross` are the shared 21-icon set's own glyphs; nothing new was added for this.
 */
const cellStrip = (cells: MatrixRowParams["cells"]): string =>
  cells
    .map(
      (c) =>
        `<span class="mcell mcell--${c}" aria-label="${c === "yes" ? "yes" : "no"}">` +
        iconSvg(c === "yes" ? "check" : "cross") +
        "</span>",
    )
    .join("");

/** A scored row of the capability matrix: an option label (plus optional second line) and one
 *  check/cross per criteria column. `highlight` marks the proposer's own row — the skin decides
 *  what that looks like, so it reads as this theme's emphasis rather than a colour we picked. */
export const MatrixRow = component({
  name: "matrix-row",
  schema: MatrixRowSchema,
  template,
  example: { label: "Our platform", sublabel: "The proposed approach", cells: ["yes", "yes", "yes"], highlight: true },
  fill: (p) => ({
    "row-label": p.label,
    // Pruned when absent — a row with no second line leaves no empty box behind.
    "row-sublabel": p.sublabel ?? null,
  }),
  rawFill: (p) => ({ cells: cellStrip(p.cells) }),
  layout: (p) => ({
    // The strip's column count, so the skin can lay it on the same track as the treatment's
    // criteria header without the row having to know what the treatment set.
    "--mcols": String(p.cells.length),
    // Highlight as a 0/1 NUMBER, the same shape as bar's `--lead`, and always emitted rather
    // than only when set. A flag a skin can do arithmetic with (calc(var(--mhi) * 100%) as a
    // color-mix ratio, a border weight, an emphasis scale) lets each theme decide what "the
    // proposer's row" looks like in its own language, which an `[style*=…]` attribute match or
    // a hardcoded colour here would not. Always-emitted so the var always resolves — an unset
    // custom property inside calc() invalidates the whole declaration at computed-value time,
    // which fails silently.
    "--mhi": p.highlight ? "1" : "0",
  }),
  anim: matrixRowAnim,
});
