import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { serializeAnims, offsetAnim, qualifyAnim, toSlot, type AnimDescriptor } from "./anim";
import { component } from "./component";
import { scopeCss, collectCss } from "./css";
import { scrubDeterminism } from "./determinism";
import { renderScene } from "./emit";
import { treatment } from "./treatment";
import type { BuildContext, ThemeTokens } from "./types";

const THEME: ThemeTokens = { name: "test", css: ":root{--pink:#f0a;--offwhite:#fff}" };
const ctx = (compId: string): BuildContext => ({ compId, idPrefix: compId, theme: THEME, mode: "render" });

// --- an inline stat-like component + a grid treatment (no trio files needed) ---
const StatSchema = z.object({
  value: z.number(),
  label: z.string(),
  suffix: z.string().optional(),
  decimals: z.number().int().default(0),
});
const Stat = component({
  name: "stat",
  schema: StatSchema,
  template: `<div class="stat" data-anim="item"><div class="stat-number" data-slot="number" data-anim="number">240</div><div class="stat-label" data-slot="label">Label</div></div>`,
  css: `.stat { text-align: center }\n.stat-number { font-size: 6cqw }`,
  example: { value: 240, label: "Output" },
  fill: (p) => ({ number: `0${p.suffix ?? ""}`, label: p.label }),
  anim: (p) => [
    { kind: "riseIn", target: "item", time: { at: "line", n: 0 } },
    { kind: "countUp", target: "number", time: { at: "line", n: 0, plus: 0.1 }, opts: { to: p.value, decimals: p.decimals, suffix: p.suffix ?? "" } },
  ],
});

const GridSchema = z.object({ headline: z.string() });
const StatGrid = treatment({
  name: "stat-grid",
  schema: GridSchema,
  template: `<div class="stat-grid"><h3 class="hd" data-slot="headline" data-anim="headline">Headline</h3><div class="row" data-children></div></div>`,
  css: `.stat-grid { container-type: size }\n.row { display: grid; grid-template-columns: repeat(var(--cols,3),1fr) }`,
  ground: "pink",
  example: { headline: "Numbers that matter" },
  defaultChildren: () => [Stat({ value: 10, label: "A" }), Stat({ value: 20, label: "B" })],
  layout: (n) => ({ "--cols": String(Math.min(n, 4)), ...(n > 3 ? { "--dense": "1" } : {}) }),
  anim: () => [{ kind: "riseIn", target: "headline", time: { at: "line", n: 0, plus: 0.1 }, opts: { dist: 32 } }],
});

// A decoration (background accent) + a treatment with a trailing caption, for slot-order tests.
const Deco = component({
  name: "deco",
  schema: z.object({}),
  template: `<div class="deco" data-anim="shape">x</div>`,
  css: `.deco { position: absolute }`,
  example: {},
  anim: () => [{ kind: "fadeIn", target: "shape", time: { at: "leadIn" } }],
});

const Captioned = treatment({
  name: "captioned",
  schema: GridSchema,
  template: `<div class="cg"><h3 data-slot="headline" data-anim="headline">H</h3><div class="row" data-children></div><p data-anim="caption">c</p></div>`,
  css: `.cg { container-type: size }`,
  ground: "pink",
  example: { headline: "H" },
  defaultChildren: () => [Stat({ value: 1, label: "a" }), Stat({ value: 2, label: "b" })],
  anim: (_p, n) => [
    { kind: "riseIn", target: "headline", time: { at: "line", n: 0 } },
    { kind: "riseIn", target: "caption", time: { at: "line", n, plus: 0.2 } },
  ],
});

// A childless treatment with a leadIn "frame" (eyebrow) + a line-0 title + an index secondary —
// mirrors quote/cover, exercising the frame-leads-then-title slot ordering.
const Framed = treatment({
  name: "framed",
  schema: z.object({ title: z.string() }),
  template: `<div class="fr"><span data-slot="eyebrow" data-anim="eyebrow">e</span><h3 data-slot="title" data-anim="title">t</h3><p data-anim="sub">s</p></div>`,
  css: `.fr { display: grid }`,
  ground: "pink",
  example: { title: "T" },
  defaultChildren: () => [],
  fill: (p) => ({ eyebrow: "e", title: p.title }),
  anim: () => [
    { kind: "fadeIn", target: "eyebrow", time: { at: "leadIn" } },
    { kind: "fadeIn", target: "title", time: { at: "line", n: 0 } },
    { kind: "fadeIn", target: "sub", time: { at: "index", n: 1 } },
  ],
});

describe("scopeCss", () => {
  test("prefixes each selector with the scene root", () => {
    const out = scopeCss(`.stat { color: red }\n.a, .b { x: 1 }`, "s02-impact");
    expect(out).toContain(".s02-impact-root .stat {");
    expect(out).toContain(".s02-impact-root .a");
    expect(out).toContain(".s02-impact-root .b");
  });
  test("does not double-prefix and strips comments", () => {
    const out = scopeCss(`/* note */ .x { y: 1 }`, "s01");
    expect(out).not.toContain("/* note */");
    expect((out.match(/\.s01-root/g) ?? []).length).toBe(1);
  });
});

describe("collectCss", () => {
  test("dedupes by component name", () => {
    const out = collectCss([
      { name: "stat", css: ".stat{a:1}" },
      { name: "stat", css: ".stat{a:1}" },
      { name: "card", css: ".card{b:2}" },
    ]);
    expect((out.match(/\.stat\{/g) ?? []).length).toBe(1);
    expect(out).toContain(".card{b:2}");
  });
});

describe("anim helpers", () => {
  test("offsetAnim shifts line n and stagger", () => {
    const a: AnimDescriptor = { kind: "riseIn", target: "item", time: { at: "line", n: 0 } };
    const o = offsetAnim(a, 2, 0.32);
    expect(o.time).toEqual({ at: "line", n: 2, plus: 0.32 });
  });
  test("qualifyAnim fully-qualifies the target", () => {
    const a: AnimDescriptor = { kind: "fadeIn", target: "item", time: { at: "leadIn" } };
    expect(qualifyAnim(a, "s02__c1").target).toBe("s02__c1-item");
  });
  test("toSlot re-anchors to a cascade slot, preserving the element's internal plus", () => {
    const a: AnimDescriptor = { kind: "countUp", target: "number", time: { at: "line", n: 0, plus: 0.1 } };
    const s = toSlot(a, 3, 0.5);
    expect(s.time).toEqual({ at: "slot", n: 3, plus: 0.1, d: 0.5 });
    expect(s.kind).toBe("countUp"); // element keeps its own transition + kind
  });
  test("serializeAnims emits one MC.applyAnims call and escapes </", () => {
    const js = serializeAnims([{ kind: "fadeIn", target: "s01-x", time: { at: "leadIn" }, opts: { suffix: "</script>" } }]);
    expect(js).toContain("MC.applyAnims(tl,");
    expect(js).not.toContain("</script>");
    expect(js).toContain("<\\/script>");
  });
  test("empty anims serialize to nothing", () => {
    expect(serializeAnims([])).toBe("");
  });
});

describe("component build", () => {
  test("fills slots, stamps scoped markers, strips annotations, qualifies anims", () => {
    const r = Stat({ value: 42, label: "Uptime", suffix: "%" }).build(ctx("sc-stat"));
    expect(r.html).toContain("sc-stat-item");
    expect(r.html).toContain("sc-stat-number");
    expect(r.html).toContain("Uptime");
    expect(r.html).not.toContain("data-slot");
    expect(r.html).not.toContain("data-anim");
    expect(r.anims.map((a) => a.target)).toEqual(["sc-stat-item", "sc-stat-number"]);
    // countUp targets the seeded "0" and animates to the real value
    const countUp = r.anims.find((a) => a.kind === "countUp");
    expect(countUp?.opts?.to).toBe(42);
  });
  test("fail-loud on invalid params", () => {
    expect(() => Stat({ value: "nope" as unknown as number, label: "x" }).build(ctx("s"))).toThrow();
  });
});

describe("treatment composition", () => {
  test("default children compose into ordered cascade slots (title → child 0 → child 1), css deduped", () => {
    const r = StatGrid().build(ctx("s03-metrics"));
    // two default stats -> two uniquely-scoped children
    expect(r.html).toContain("s03-metrics__c0-item");
    expect(r.html).toContain("s03-metrics__c1-item");
    expect(r.html).toContain('--cols: 2');
    // .stat css inlined exactly once even though two stats
    expect((r.css.match(/\/\* stat \*\//g) ?? []).length).toBe(1);
    // no decorations → headline is the title slot (0); children cascade at slots 1 and 2
    const headline = r.anims.find((a) => a.target === "s03-metrics-headline")!;
    const c0 = r.anims.find((a) => a.target === "s03-metrics__c0-item")!;
    const c1 = r.anims.find((a) => a.target === "s03-metrics__c1-item")!;
    expect(headline.time).toEqual({ at: "slot", n: 0, plus: 0.1, d: 0.5 });
    expect(c0.time).toEqual({ at: "slot", n: 1, plus: 0, d: 0.5 });
    expect(c1.time).toEqual({ at: "slot", n: 2, plus: 0, d: 0.5 });
    // the child's own internal reveal (countUp) rides the SAME slot, keeping its own +0.1
    const c0num = r.anims.find((a) => a.target === "s03-metrics__c0-number")!;
    expect(c0num.time).toEqual({ at: "slot", n: 1, plus: 0.1, d: 0.5 });
  });

  test("decorations reveal first (slot 0), pushing the title and children back a slot", () => {
    const r = StatGrid().addDecorations(Deco()).build(ctx("s04-deco"));
    const deco = r.anims.find((a) => a.target === "s04-deco__d0-shape")!;
    const headline = r.anims.find((a) => a.target === "s04-deco-headline")!;
    const c0 = r.anims.find((a) => a.target === "s04-deco__c0-item")!;
    expect(deco.time).toEqual({ at: "slot", n: 0, plus: 0, d: 0.5 });
    expect(headline.time).toEqual({ at: "slot", n: 1, plus: 0.1, d: 0.5 });
    expect(c0.time).toEqual({ at: "slot", n: 2, plus: 0, d: 0.5 });
  });

  test("a trailing caption (line n≥1) lands just after the last child", () => {
    const r = Captioned().build(ctx("s05-cap"));
    const caption = r.anims.find((a) => a.target === "s05-cap-caption")!;
    // 2 children at slots 1,2 → caption at slot 3 (childBase 1 + childCount 2)
    expect(caption.time).toEqual({ at: "slot", n: 3, plus: 0.2, d: 0.5 });
  });

  test("a leadIn frame (eyebrow) leads; the title + its index secondary fall to later slots", () => {
    const r = Framed().build(ctx("s06-fr"));
    const eyebrow = r.anims.find((a) => a.target === "s06-fr-eyebrow")!;
    const title = r.anims.find((a) => a.target === "s06-fr-title")!;
    const sub = r.anims.find((a) => a.target === "s06-fr-sub")!;
    // eyebrow frame at slot 0; title bumped to slot 1; index secondary to slot 2 (no collision)
    expect(eyebrow.time).toEqual({ at: "slot", n: 0, plus: 0, d: 0.5 });
    expect(title.time).toEqual({ at: "slot", n: 1, plus: 0, d: 0.5 });
    expect(sub.time).toEqual({ at: "slot", n: 2, plus: 0, d: 0.5 });
  });

  test("addChildren overrides defaults and >3 triggers dense layout", () => {
    const r = StatGrid()
      .addChildren(Stat({ value: 1, label: "a" }), Stat({ value: 2, label: "b" }), Stat({ value: 3, label: "c" }), Stat({ value: 4, label: "d" }))
      .build(ctx("s"));
    expect(r.html).toContain("--cols: 4");
    expect(r.html).toContain("--dense: 1");
  });

  test("buildScene → wrapSubComposition yields a valid, deterministic sub-composition", () => {
    const html = renderScene(StatGrid(), { compId: "s03-metrics", idPrefix: "s03-metrics", theme: THEME, mode: "render", voIds: ["l1", "l2", "l3"] });
    expect(html).toContain('data-composition-id="s03-metrics"');
    expect(html).toContain('window.__timelines["s03-metrics"]');
    expect(html).toContain("MC.applyAnims(tl,");
    expect(html).toContain("background: var(--pink)");
    expect(html).toContain(".s03-metrics-root .stat-grid");
    expect(html).not.toContain("data-slot");
    // determinism holds
    expect(() => scrubDeterminism(html)).not.toThrow();
  });

  test("scene scoping isolates two instances of the same treatment", () => {
    const a = StatGrid().build(ctx("s01"));
    const b = StatGrid().build(ctx("s02"));
    expect(a.html).toContain("s01__c0-item");
    expect(a.html).not.toContain("s02__c0-item");
    expect(b.html).toContain("s02__c0-item");
    expect(b.html).not.toContain("s01__c0-item");
  });
});

describe("ground override via wrapSubComposition parts", () => {
  test("storyboard ground replaces the canonical ground", () => {
    const html = renderScene(StatGrid(), ctx("s"), { ground: "blue" });
    expect(html).toContain("background: var(--blue)");
    expect(html).not.toContain("background: var(--pink)");
  });
});

describe("backdrop mask", () => {
  const DOTS: ThemeTokens = { ...THEME, backdrop: "dots" };
  const dotsCtx = (compId: string): BuildContext => ({ compId, idPrefix: compId, theme: DOTS, mode: "render" });

  test("a theme WITHOUT a backdrop paints no mask (byte-stable)", () => {
    const html = renderScene(StatGrid(), ctx("s"));
    expect(html).not.toContain("mc-backdrop");
    // the ground colour is unaffected
    expect(html).toContain("background: var(--pink)");
  });

  test("the theme's canonical backdrop paints the mask overlay", () => {
    const html = renderScene(StatGrid(), dotsCtx("s"));
    expect(html).toContain("mc-backdrop mc-backdrop--dots");
    expect(html).toContain("background-size: 3.625rem 3.625rem");
    // mask overlays the ground; the ground colour is still stamped
    expect(html).toContain("background: var(--pink)");
    expect(() => scrubDeterminism(html)).not.toThrow();
  });

  test("a scene override to 'plain' removes the mask for that scene only", () => {
    const html = renderScene(StatGrid(), dotsCtx("s"), { backdrop: "plain" });
    expect(html).not.toContain("mc-backdrop");
  });

  test("a scene override selects a different mask design", () => {
    const html = renderScene(StatGrid(), ctx("s"), { backdrop: "dots" });
    expect(html).toContain("mc-backdrop--dots");
  });
});
