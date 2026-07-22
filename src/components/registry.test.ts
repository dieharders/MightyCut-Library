// Tripwire + build-smoke for the component/treatment registry. Importing
// "./registry" registers every element; these tests assert the registry matches
// the COMPONENT_NAMES / TREATMENT_NAMES tuples (both directions) and that every
// element builds from its example without throwing, emits valid anims, and (for
// treatments) produces a well-formed, deterministic sub-composition.
import { describe, expect, test } from "bun:test";
import { COMPONENT_NAMES, TREATMENT_NAMES } from "../types/components";
import { BACKDROP_NAMES } from "../types/storyboard";
import { BACKDROPS, buildBackdrop } from "./primitives/backdrops";
import { iconSvg } from "./icons";
import "./registry";
import { AnimDescriptorSchema } from "./runtime/anim";
import { scrubDeterminism } from "./runtime/determinism";
import { renderScene } from "./runtime/emit";
import {
  allComponents,
  allTreatments,
  componentNames,
  getComponent,
  getTreatment,
  treatmentNames,
} from "./runtime/registry";
import { rootContext } from "./runtime";
import type { BuildContext } from "./runtime/types";
import { blockTheme } from "./themes/block/theme";

const ctx = (compId: string): BuildContext => rootContext(compId, blockTheme, { voIds: ["l1", "l2", "l3", "l4", "l5"] });

describe("registry vocabulary (tripwire)", () => {
  test("component registry == COMPONENT_NAMES, both directions", () => {
    expect(componentNames()).toEqual([...COMPONENT_NAMES].sort());
  });
  test("treatment registry == TREATMENT_NAMES, both directions", () => {
    expect(treatmentNames()).toEqual([...TREATMENT_NAMES].sort());
  });
  test("every treatment name resolves", () => {
    for (const t of TREATMENT_NAMES) expect(getTreatment(t).treatmentName).toBe(t);
  });
  test("every component name resolves", () => {
    for (const c of COMPONENT_NAMES) expect(getComponent(c).componentName).toBe(c);
  });
});

describe("component build-smoke", () => {
  for (const factory of allComponents()) {
    test(`${factory.componentName}: builds from example + valid anims + JSON schema`, () => {
      const inst = factory();
      const r = inst.build(ctx(`sc-${factory.componentName}`));
      expect(r.html.length).toBeGreaterThan(0);
      expect(r.html).not.toContain("data-slot");
      expect(r.html).not.toContain("data-anim");
      expect(r.html).not.toContain("data-html");
      for (const a of r.anims) expect(AnimDescriptorSchema.safeParse(a).success).toBe(true);
      // jsonSchema is TypeBox-compilable (the Pi tool bridge) — just assert it exists
      expect(typeof factory.jsonSchema()).toBe("object");
    });
  }
});

describe("byte-stability (determinism)", () => {
  for (const factory of allTreatments()) {
    test(`${factory.treatmentName}: two builds are byte-identical`, () => {
      const a = renderScene(factory(), ctx(`s01-${factory.treatmentName}`));
      const b = renderScene(factory(), ctx(`s01-${factory.treatmentName}`));
      expect(a).toBe(b);
    });
  }
  // The chrome/decorative components (caption, pill, cta, list-number, flare,
  // icon, hud) are children of no treatment, so they get no transitive byte
  // coverage above — assert their builds are deterministic directly.
  for (const factory of allComponents()) {
    test(`${factory.componentName}: two builds are byte-identical`, () => {
      const a = factory().build(ctx(`sc-${factory.componentName}`));
      const b = factory().build(ctx(`sc-${factory.componentName}`));
      expect(a.html).toBe(b.html);
      expect(JSON.stringify(a.anims)).toBe(JSON.stringify(b.anims));
    });
  }
});

describe("treatment build-smoke", () => {
  for (const factory of allTreatments()) {
    test(`${factory.treatmentName}: default scene is well-formed + deterministic`, () => {
      const inst = factory();
      const compId = `s01-${factory.treatmentName}`;
      const html = renderScene(inst, ctx(compId));
      expect(html).toContain(`data-composition-id="${compId}"`);
      expect(html).toContain(`window.__timelines["${compId}"]`);
      expect(html).toContain(`.${compId}-root .block-frame`);
      expect(html).toContain(`background: var(--${inst.ground})`);
      // block's canonical backdrop mask paints over every scene's ground
      expect(html).toContain("mc-backdrop--dots");
      expect(html).not.toContain("data-slot");
      expect(html).not.toContain("data-anim");
      expect(html).not.toContain("data-children");
      expect(() => scrubDeterminism(html)).not.toThrow();
      // anims are valid descriptors
      const built = inst.build(ctx(compId));
      for (const a of built.anims) expect(AnimDescriptorSchema.safeParse(a).success).toBe(true);
      // every own example string field must actually RENDER (guards a missing
      // fill — a treatment whose own slot shows the template placeholder instead
      // of its content).
      const ex = factory.defaults() as Record<string, unknown>;
      for (const [k, v] of Object.entries(ex)) {
        if (typeof v === "string" && v.length > 2) {
          const esc = v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          expect(html.includes(v) || html.includes(esc), `${factory.treatmentName}: own field '${k}' ("${v}") did not render`).toBe(true);
        }
      }
    });
  }
});

// The 7 chrome / decorative / composite components added alongside the showcase
// rework. Each exercises its own new surface: text render, the data-slot variant
// gate (flare), the rawFill raw-HTML seam (icon), and the boolean part gate (hud).
describe("new library components", () => {
  const build = (name: string, params?: Record<string, unknown>) =>
    getComponent(name)(params as never).build(ctx(`sc-${name}`));

  test("caption renders its pill text + accent bar", () => {
    const r = build("caption");
    expect(r.html).toContain("Captions render in the theme");
    expect(r.html).toContain("cap-bar");
  });
  test("pill renders label + variant background token", () => {
    const r = build("pill", { text: "Eyebrow", variant: "green" });
    expect(r.html).toContain("Eyebrow");
    expect(r.css.length).toBeGreaterThan(0);
    expect(r.html).toContain("var(--green)"); // layout-set --pillbg
  });
  test("cta renders label + arrow; arrow self-removes when off", () => {
    expect(build("cta").html).toContain("→");
    const noArrow = build("cta", { text: "Go", arrow: false }).html;
    expect(noArrow).toContain("Go");
    expect(noArrow).not.toContain("→");
    expect(noArrow).not.toContain("cta-arrow"); // optional slot pruned
  });
  test("list-number renders numeral + text", () => {
    const r = build("list-number", { num: "07", text: "Seventh item" });
    expect(r.html).toContain("07");
    expect(r.html).toContain("Seventh item");
  });
  test("decoration families render the selected shape + placement (var-driven)", () => {
    const star = build("starburst", { variant: "star", x: 80, y: 20, size: 12, accent: "yellow" }).html;
    expect(star).toContain("<polygon"); // star shape as inline SVG
    expect(star).toContain("--d-x: 80%"); // x placement
    expect(star).toContain("var(--yellow)"); // accent → SVG fill
    expect(build("starburst", { variant: "circle" }).html).toContain("--d-radius: 50%"); // box shape
    expect(build("slab", { variant: "square", layer: "front" }).html).toContain("--d-z: 5"); // foreground z-index
    expect(build("slab", { variant: "rhombus" }).html).toContain("<polygon");
    expect(build("stripe", { variant: "stripe" }).html).toContain("repeating-linear-gradient");
    expect(build("badge", { variant: "capsule" }).html).toContain("--d-radius: 999px");
  });
  test("the 4 decoration families have DISJOINT variant lists (no shared shapes)", () => {
    const families = ["starburst", "slab", "stripe", "badge"];
    const seen = new Map<string, string>();
    for (const fam of families) {
      const variants = ((getComponent(fam).jsonSchema() as { properties?: Record<string, { enum?: string[] }> }).properties?.variant?.enum) ?? [];
      expect(variants.length).toBeGreaterThan(0);
      for (const v of variants) {
        expect(seen.has(v), `shape '${v}' appears in both '${seen.get(v)}' and '${fam}'`).toBe(false);
        seen.set(v, fam);
      }
    }
  });
  test("icon injects raw inline SVG via rawFill (no data-html leak)", () => {
    const r = build("icon", { name: "shield" });
    expect(r.html).toContain("<svg");
    expect(r.html).toContain("<path");
    expect(r.html).toContain('stroke="currentColor"');
    expect(r.html).not.toContain("data-html");
  });
  test("iconSvg falls back to sparkles for an unknown name (never throws)", () => {
    // The fallback is only reachable at the iconSvg layer — the Icon component's
    // Zod enum rejects unknown names before iconSvg runs.
    const fallback = iconSvg("definitely-not-an-icon");
    expect(fallback).toContain("<svg");
    expect(fallback).toContain("<path"); // sparkles paths
    expect(iconSvg("shield")).not.toBe(fallback); // a known name yields different paths
  });
  test("hud renders own text fields + gates each part by its boolean", () => {
    const full = build("hud").html;
    for (const s of ["MightyCut", "Overview", "01 / 06"]) expect(full).toContain(s);
    expect(full).toContain("hud-brand");
    expect(full).toContain("hud-title");
    const noBrand = build("hud", { brand: false }).html;
    expect(noBrand).not.toContain("hud-brand"); // whole subtree pruned
    expect(noBrand).toContain("hud-title"); // other parts intact
  });
  test("hud is a frame composite; leaf components are not", () => {
    expect(getComponent("hud").frame).toBe(true);
    expect(getComponent("stat").frame).toBeFalsy();
  });
});

// The treatment → child component link that the CLI/agent/spec-map already used,
// now formalized on the def (drives the showcase child editor).
describe("treatment → childComponent link", () => {
  const expected: Record<string, string | undefined> = {
    "stat-grid": "stat",
    "feature-cards": "card",
    timeline: "step",
    agenda: "agenda-item",
    comparison: "row",
    chart: "bar",
    "bar-ranking": "rank",
    cover: undefined,
    quote: undefined,
    "closing-plate": undefined,
  };
  for (const [t, child] of Object.entries(expected)) {
    test(`${t} → ${child ?? "(none)"}`, () => {
      expect(getTreatment(t).childComponent).toBe(child as never);
      if (child) expect(getComponent(child).componentName).toBe(child); // resolves
    });
  }
});

// Any treatment can carry positioned fore/background decoration components; a few
// treatments (cover, closing-plate) ship default decorations, and addDecorations
// overrides them.
describe("treatment decorations", () => {
  test("cover renders its default decorations (positioned shapes)", () => {
    const html = renderScene(getTreatment("cover")(), ctx("s01-cover"));
    expect(html).toContain("__d0-item"); // first decoration's scoped anim marker
    expect(html).toContain("__d1-item"); // second decoration (the tilt-rect)
    expect(html).toContain("<polygon"); // the default star as inline SVG
    expect(html).toContain("drop-shadow"); // the decoration's block hard shadow (scoped css)
  });
  test("addDecorations overrides defaults + honors coords/layer (any family)", () => {
    const inst = getTreatment("stat-grid")().addDecorations(
      getComponent("starburst")({ variant: "triangle", x: 12, y: 88, layer: "front", accent: "green" }),
      getComponent("badge")({ variant: "shield", x: 90, y: 10, accent: "yellow" }),
    );
    const html = inst.build(ctx("s01-stat-grid")).html;
    expect(html).toContain("--d-x: 12%"); // starburst placement honored
    expect(html).toContain("<polygon"); // triangle + shield as inline SVG
    expect(html).toContain("--d-z: 5"); // foreground layer
    expect(html).toContain("var(--green)"); // accent
    expect(html).toContain("__d0-item"); // two decorations appended
    expect(html).toContain("__d1-item");
  });
  test("a treatment with decorations still builds deterministically", () => {
    const a = renderScene(getTreatment("closing-plate")(), ctx("s01-closing-plate"));
    const b = renderScene(getTreatment("closing-plate")(), ctx("s01-closing-plate"));
    expect(a).toBe(b);
  });
});

// Regression: the ranked-bar fill must reveal via `scaleX` on a static-width
// element (like `bar`'s scaleY), NOT by animating layout `width` — which snapshots
// ~0 before the scaled/aspect-ratio container lays out and leaves the bar empty.
describe("rank fill reveal (scaleX, not width)", () => {
  test("rank grows its fill via growBar scaleX; never animates width", () => {
    const r = getComponent("rank")().build(ctx("sc-rank"));
    const grow = r.anims.find((a) => a.kind === "growBar");
    expect(grow?.opts?.prop).toBe("scaleX");
    expect(JSON.stringify(r.anims)).not.toContain('"width"');
    expect(r.css).toContain("transform-origin: left center"); // static-width fill
    expect(r.css).toContain("width: var(--fill");
  });
  test("rank builds are byte-identical (determinism)", () => {
    const a = getComponent("rank")().build(ctx("sc-rank"));
    const b = getComponent("rank")().build(ctx("sc-rank"));
    expect(a.html).toBe(b.html);
    expect(JSON.stringify(a.anims)).toBe(JSON.stringify(b.anims));
  });
});

// The backdrop-mask registry: every non-"plain" BACKDROP_NAMES entry must resolve
// to a design, "plain" must resolve to no mask, and each design must build.
describe("backdrop registry (tripwire)", () => {
  const input = { ground: "cream" as const, theme: blockTheme, ctx: ctx("s01-bd") };

  test("every BACKDROP_NAMES value (except plain) has a registered design", () => {
    for (const name of BACKDROP_NAMES) {
      if (name === "plain") continue;
      expect(BACKDROPS[name], `no design registered for backdrop '${name}'`).toBeDefined();
    }
    // no orphan designs (registry ⊆ the enum)
    for (const key of Object.keys(BACKDROPS)) {
      expect((BACKDROP_NAMES as readonly string[]).includes(key), `design '${key}' missing from BACKDROP_NAMES`).toBe(true);
    }
  });

  test("'plain' (and an unknown name) resolve to no mask", () => {
    expect(buildBackdrop("plain", input)).toBeNull();
    expect(buildBackdrop("nope", input)).toBeNull();
  });

  test("each design builds a full-bleed overlay node + css", () => {
    for (const [name, design] of Object.entries(BACKDROPS)) {
      const r = design.build(input);
      expect(r.node.tag, `design '${name}' must build an element`).toBe("div");
      expect(r.node.attrs.class).toContain(`mc-backdrop--${name}`);
      expect(r.css).toContain(".mc-backdrop");
      expect(Array.isArray(r.anims)).toBe(true);
    }
  });
});
