// Every decoration engine's wrapper must declare its overflow as intentional.
//
// Decorations are ambient garnish placed by explicit x/y/size, and the themes deliberately hang
// them past the frame: "cropped by the edge", "quartered by the frame edge". `hyperframes inspect`
// — which GATES the render pipeline on errorCount — does not know that, and its overflow rules
// have no configuration surface at all (no severity config, no per-rule ignore; `--strict` only
// tightens). The one in-markup escape hatch is `data-layout-allow-overflow`, read with
// `element.closest(...)`, so it must sit on the WRAPPER to cover the wrapper's own
// `container_overflow` as well as `text_box_overflow` / `canvas_overflow` on the drawing inside.
//
// This is not theoretical tidiness. A real job died at the build gate on standard's `sorts`
// quotation mark: the glyph's INK is fitted inside its box (the ink-geometry tripwire in
// registry.test.ts pins that), but the `<text>` element's LAYOUT box is ~2.4x the box, and the
// auditor measures the layout box. The deck was drawn correctly and shipped nothing.
//
// A new engine that forgets the flag reintroduces that failure for its own theme, and the symptom
// (a hard pipeline failure on a deck that looks perfect) points nowhere near the omission — hence
// a tripwire over every engine rather than a comment in each.
import { describe, expect, test } from "bun:test";
import { DECO_TEMPLATE } from "./decoration-shapes";
import { CD_DECO_TEMPLATE } from "./capsule-decoration-shapes";
import { CR_DECO_TEMPLATE } from "./creative-decoration-shapes";
import { FX_DECO_TEMPLATE } from "./future-decoration-shapes";
import { PD_DECO_TEMPLATE } from "./professional-decoration-shapes";
import { SD_DECO_TEMPLATE } from "./standard-decoration-shapes";
import "../registry";
import { allComponents, getComponent } from "../runtime/registry";

const ENGINES = [
  ["block", DECO_TEMPLATE],
  ["capsule", CD_DECO_TEMPLATE],
  ["creative", CR_DECO_TEMPLATE],
  ["future", FX_DECO_TEMPLATE],
  ["professional", PD_DECO_TEMPLATE],
  ["standard", SD_DECO_TEMPLATE],
] as const;

const ctx = (compId: string) => ({ theme: { name: "block", templates: {} }, idPrefix: compId }) as never;

describe("decoration wrappers declare intentional overflow (tripwire)", () => {
  test.each(ENGINES)("%s's template flags the WRAPPER, not the shape host", (_theme, template) => {
    // `closest()` walks UP, so the flag has to be on the outer element: on the inner `<i>` it
    // would still suppress the drawing's overflow but leave the wrapper's own
    // container_overflow warning firing, which is the same intentional bleed.
    const wrapper = template.slice(0, template.indexOf("><i "));
    expect(wrapper, `${_theme}: flag missing from the decoration wrapper`).toContain(
      "data-layout-allow-overflow",
    );
  });

  // The flag has to survive the BUILD path, not merely exist in the template constant: the
  // runtime clones the template, strips the annotation attributes (data-slot / data-anim /
  // data-children) and re-serializes. A stripper that got greedier would silently drop it and
  // put the gate failure back, so assert against real built HTML for every registered decoration.
  test("every registered decoration emits the flag after build", () => {
    const decorations = allComponents().filter((c) => c.decoration);
    expect(decorations.length, "no decorations registered — the check is vacuous").toBeGreaterThan(0);
    for (const factory of decorations) {
      const html = factory({} as never).build(ctx(`s01-${factory.componentName}`)).html;
      expect(
        html.includes("data-layout-allow-overflow"),
        `${factory.componentName}: built decoration lost the overflow flag`,
      ).toBe(true);
    }
  });

  test("the text-bearing sort keeps the flag ABOVE its <text>", () => {
    // standard's quotation sort is the library's only <text> decoration and the exact element
    // that failed a real build gate. For closest() to find it, the flag must be an ANCESTOR.
    const html = getComponent("sorts")!({ variant: "quotation" } as never).build(ctx("s01-sorts")).html;
    expect(html).toContain("<text");
    expect(html.indexOf("data-layout-allow-overflow")).toBeLessThan(html.indexOf("<text"));
  });
});
