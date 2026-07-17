import { describe, expect, test } from "bun:test";
import {
  parseFragment,
  serialize,
  find,
  findAll,
  attrEq,
  hasAttr,
  setText,
  removeWhere,
  cloneNode,
  isElement,
} from "./mini-dom";

const SAMPLE = `<div class="bframe bf-cover" data-treatment="cover">
  <div class="dg" data-deco="dot-grid"></div>
  <div class="star" data-deco="star"></div>
  <div class="body">
    <span class="pill" data-slot="eyebrow">Eyebrow</span>
    <h3 data-slot="headline">A &amp; B</h3>
    <div class="row" data-repeat="cards"><div class="c"><div class="t" data-slot="card-title">T</div></div></div>
  </div>
</div>`;

describe("mini-dom", () => {
  test("finds annotated elements", () => {
    const nodes = parseFragment(SAMPLE);
    expect(find(nodes, attrEq("data-treatment", "cover"))?.attrs.class).toBe("bframe bf-cover");
    expect(findAll(nodes, hasAttr("data-slot")).map((e) => e.attrs["data-slot"])).toEqual([
      "eyebrow", "headline", "card-title",
    ]);
    const repeat = find(nodes, attrEq("data-repeat", "cards"))!;
    expect(repeat.children.filter(isElement)).toHaveLength(1);
  });

  test("round-trips structure (attrs may re-quote, tree is preserved)", () => {
    const out = serialize(parseFragment(SAMPLE));
    expect(out).toContain('data-treatment="cover"');
    expect(out).toContain('data-slot="headline"');
    expect(out).toContain("A &amp; B");
  });

  test("setText replaces children; removeWhere prunes; clone is deep", () => {
    const root = find(parseFragment(SAMPLE), attrEq("data-treatment", "cover"))!;
    const clone = cloneNode(root);
    setText(find(clone, attrEq("data-slot", "headline"))!, "NEW");
    removeWhere(clone.children, (el) => el.attrs["data-deco"] === "star");
    const out = serialize(clone);
    expect(out).toContain(">NEW</h3>");
    expect(out).not.toContain('data-deco="star"');
    // original is untouched (deep clone)
    expect(serialize(root)).toContain("A &amp; B");
    expect(serialize(root)).toContain('data-deco="star"');
  });

  test("attribute values with commas/percent (clip-path, styles) survive", () => {
    const html = `<div style="height:42%" data-bar></div><span style="clip-path:polygon(50% 0%,61% 35%)"></span>`;
    const out = serialize(parseFragment(html));
    expect(out).toContain('style="height:42%"');
    expect(out).toContain("polygon(50% 0%,61% 35%)");
  });

  test("an unquoted attribute value ending in '/' is not mistaken for a self-close", () => {
    const nodes = parseFragment("<a href=http://x/>inside</a>");
    expect(nodes).toHaveLength(1); // <a> is an open element, not self-closed
    const a = nodes[0];
    if (a.type !== "element") throw new Error("expected element");
    expect(a.attrs.href).toBe("http://x/"); // trailing slash preserved
    expect(serialize(a.children)).toBe("inside"); // text nested, not re-parented
  });

  test("genuine self-close and void tags don't swallow siblings", () => {
    const nodes = parseFragment(`<div class="a" /><br><span>x</span>`);
    expect(nodes.filter((n) => n.type === "element")).toHaveLength(3); // div, br, span all siblings
    const span = nodes.find((n) => n.type === "element" && n.tag === "span");
    if (!span || span.type !== "element") throw new Error("expected a span element");
    expect(serialize(span.children)).toBe("x");
  });

  test("abrupt-closing empty comment <!--> does not swallow the rest of the document", () => {
    const out = serialize(parseFragment("<!--><span>kept</span>"));
    expect(out).toContain("<span>kept</span>");
  });
});
