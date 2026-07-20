import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { serializeAnims, offsetAnim, qualifyAnim, type AnimDescriptor } from "./anim";
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
  test("default children compose, child anims offset + uniquely scoped, css deduped", () => {
    const r = StatGrid().build(ctx("s03-metrics"));
    // two default stats -> two uniquely-scoped children
    expect(r.html).toContain("s03-metrics__c0-item");
    expect(r.html).toContain("s03-metrics__c1-item");
    expect(r.html).toContain('--cols: 2');
    // .stat css inlined exactly once even though two stats
    expect((r.css.match(/\/\* stat \*\//g) ?? []).length).toBe(1);
    // child c1 keyed to a later line than c0 (base 1 + index)
    const c0 = r.anims.find((a) => a.target === "s03-metrics__c0-item")!;
    const c1 = r.anims.find((a) => a.target === "s03-metrics__c1-item")!;
    expect((c0.time as { n: number }).n).toBe(1);
    expect((c1.time as { n: number }).n).toBe(2);
    // headline anim present + scoped
    expect(r.anims.some((a) => a.target === "s03-metrics-headline")).toBe(true);
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
