// Tripwire + build-smoke for the component/treatment registry. Importing
// "./registry" registers every element; these tests assert the registry matches
// the COMPONENT_NAMES / TREATMENT_NAMES tuples (both directions) and that every
// element builds from its example without throwing, emits valid anims, and (for
// treatments) produces a well-formed, deterministic sub-composition.
import { describe, expect, test } from "bun:test";
import { COMPONENT_NAMES, TREATMENT_NAMES } from "../types/components";
import { PALETTE_VARS, normalizePaletteVar, uniquePaletteEntries } from "../types/palette";
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
import { futureTheme } from "./themes/future/theme";

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
    const r = build("pill", { text: "Eyebrow", variant: "accent-2" });
    expect(r.html).toContain("Eyebrow");
    expect(r.css.length).toBeGreaterThan(0);
    expect(r.html).toContain("var(--accent-2)"); // layout-set --pillbg
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
    const star = build("starburst", { variant: "star", x: 80, y: 20, size: 12, accent: "accent-1" }).html;
    expect(star).toContain("<polygon"); // star shape as inline SVG
    expect(star).toContain("--d-x: 80%"); // x placement
    expect(star).toContain("var(--accent-1)"); // accent → SVG fill
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

// Future's OWN sci-fi decoration families — the luminous-stroke counterpart to block's
// neobrutalist set. Distinct components, distinct shapes, distinct token vocabulary, so a
// theme never renders another theme's decorations.
describe("future decorations", () => {
  const build = (name: string, params?: Record<string, unknown>) =>
    getComponent(name)(params as never).build(ctx(`sc-${name}`));

  test("future families render the selected shape (inline SVG) + placement + accent glow", () => {
    const orbit = build("node", { variant: "orbit", x: 80, y: 20, size: 20, accent: "primary" }).html;
    expect(orbit).toContain("<svg"); // luminous shape as inline SVG
    expect(orbit).toContain("<circle"); // orbit = ring + core + satellite
    expect(orbit).toContain("--fd-x: 80%"); // x placement (var-driven)
    expect(orbit).toContain("var(--primary)"); // future accent → stroke/fill
    expect(orbit).toContain("drop-shadow("); // the glow filter (no hard offset)
    expect(build("node", { variant: "core", layer: "front" }).html).toContain("--fd-z: 5"); // foreground z
    expect(build("reticle", { variant: "brackets" }).html).toContain("<path"); // corner brackets
    expect(build("glyph", { variant: "hexagon", accent: "accent-2" }).html).toContain("var(--accent-2)");
    expect(build("signal", { variant: "bars" }).html).toContain("<rect"); // equalizer bars
  });

  test("the 4 future families have DISJOINT variant lists (no shared shapes)", () => {
    const families = ["node", "reticle", "glyph", "signal"];
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

  test("future's decoration roster matches its own families (and only those)", () => {
    // The theme rosters exactly the future families — no block shapes, so nothing another
    // theme owns can appear under future.
    expect([...(futureTheme.decorations ?? [])].sort()).toEqual(["glyph", "node", "reticle", "signal"]);
  });

  test("every decoration is intrinsically flagged; leaf components + the HUD are not", () => {
    // The flag is what holds a decoration out of the showcase Components grid under ANY
    // theme — block's and future's alike.
    for (const d of ["starburst", "slab", "stripe", "badge", "node", "reticle", "glyph", "signal"]) {
      expect(getComponent(d).decoration, `${d} must be flagged a decoration`).toBe(true);
    }
    for (const c of ["stat", "card", "pill", "cta", "icon", "hud"]) {
      expect(getComponent(c).decoration, `${c} must NOT be a decoration`).toBeFalsy();
    }
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
      getComponent("badge")({ variant: "shield", x: 90, y: 10, accent: "accent-1" }),
    );
    const html = inst.build(ctx("s01-stat-grid")).html;
    expect(html).toContain("--d-x: 12%"); // starburst placement honored
    expect(html).toContain("<polygon"); // triangle + shield as inline SVG
    expect(html).toContain("--d-z: 5"); // foreground layer
    expect(html).toContain("var(--accent-2)"); // accent
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
  const input = { ground: "muted-1" as const, theme: blockTheme, ctx: ctx("s01-bd") };

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

  test("constellation is animated (a backdrop anim); dots is static", () => {
    const con = BACKDROPS.constellation.build(input);
    expect(con.anims.length).toBe(1);
    expect(con.anims[0].kind).toBe("backdrop");
    expect(con.anims[0].opts?.fn).toBe("particleBg");
    expect(BACKDROPS.dots.build(input).anims.length).toBe(0);
  });
});

// FUTURE theme (tripwire) — the second live component theme. Proves the per-theme skin +
// template-override seams and the animated constellation backdrop, mirroring the block
// smoke coverage above but with futureTheme. The shared element trios are reused verbatim;
// only tokens/skins/templates/backdrop change.
describe("future theme (tripwire)", () => {
  const fctx = (compId: string): BuildContext =>
    rootContext(compId, futureTheme, { voIds: ["l1", "l2", "l3", "l4", "l5"] });

  for (const factory of allTreatments()) {
    test(`${factory.treatmentName}: future scene is well-formed + deterministic`, () => {
      const compId = `f01-${factory.treatmentName}`;
      const html = renderScene(factory(), fctx(compId));
      expect(html).toContain(`data-composition-id="${compId}"`);
      expect(html).toContain(`.${compId}-root .block-frame`);
      // future forces its navy ground (--muted-2, frameCss) + carries the constellation backdrop
      expect(html).toContain("var(--muted-2)");
      expect(html).toContain("mc-backdrop--constellation");
      expect(html).not.toContain("data-slot");
      expect(html).not.toContain("data-anim");
      expect(html).not.toContain("data-children");
      expect(() => scrubDeterminism(html)).not.toThrow();
      // byte-identical across builds (the seeded backdrop is deterministic per compId)
      expect(renderScene(factory(), fctx(compId))).toBe(html);
    });
  }

  test("template override: cover drops the eyebrow chip + adds a cyan rule", () => {
    const html = renderScene(getTreatment("cover")(), fctx("f01-cover"));
    const ex = getTreatment("cover").defaults() as { headline: string; subtitle?: string };
    expect(html).toContain('class="rule"'); // the real rule element from templates/cover.html
    expect(html).not.toContain('class="eyebrow"'); // eyebrow chip dropped (block renders it)
    expect(html).toContain(ex.headline); // shared markers preserved → headline still renders
    if (ex.subtitle) expect(html).toContain(ex.subtitle);
  });

  test("template override: quote adds a quote mark; stat drops its dot", () => {
    expect(renderScene(getTreatment("quote")(), fctx("f01-quote"))).toContain("qmark");
    const statGrid = renderScene(getTreatment("stat-grid")(), fctx("f01-stat-grid"));
    expect(statGrid).not.toContain("stat-dot"); // dropped in templates/stat.html
    expect(statGrid).toContain("stat-number"); // shared markers preserved
  });

  test("treatment skin: stat-grid renders future's skin, not block's", () => {
    const html = renderScene(getTreatment("stat-grid")(), fctx("f01-sg"));
    expect(html).toContain("var(--primary)"); // future stat skin (cyan numerals)
    expect(html).not.toContain("0.5rem 0.5rem 0 var(--dark)"); // block's stat box-shadow gone
  });

  test("constellation backdrop emits a valid, compId-scoped animated descriptor", () => {
    const built = getTreatment("cover")().build(fctx("f01-cover-a"));
    const bd = built.anims.find((a) => a.kind === "backdrop");
    expect(bd, "future scene must carry a backdrop anim").toBeDefined();
    expect(AnimDescriptorSchema.safeParse(bd).success).toBe(true);
    expect(bd?.opts?.fn).toBe("particleBg");
    expect(bd?.target).toBe("f01-cover-a-bg"); // canvas class is compId-scoped
  });

  test("core fonts cover future's content families (no add-on woff2 needed)", async () => {
    const { CORE_FONTS_CSS } = await import("../engine/block-fonts.generated");
    for (const fam of ["Space Grotesk", "Inter", "JetBrains Mono"]) {
      expect(CORE_FONTS_CSS).toContain(fam);
    }
  });

  // Every theme's examples (showcase sample copy) must compose: its params + child rows are
  // validated against each element's schema at build, so a bad field fails HERE, not as a
  // broken card in the live showcase. Covers block + future symmetrically.
  test("every theme's examples compose (params + children valid against schemas)", () => {
    for (const theme of [blockTheme, futureTheme]) {
      for (const [tname, ex] of Object.entries(theme.examples ?? {})) {
        const factory = getTreatment(tname);
        let inst = factory((ex.params ?? {}) as never);
        if (ex.children?.length) {
          const childName = factory.childComponent!;
          inst = inst.addChildren(...ex.children.map((p) => getComponent(childName)(p as never)));
        }
        const exCtx = rootContext(`ex-${theme.name}-${tname}`, theme, { voIds: ["l1", "l2", "l3"] });
        expect(() => renderScene(inst, exCtx), `${theme.name} example '${tname}' failed to compose`).not.toThrow();
      }
    }
  });
});

// ---------------------------------------------------------------- palette roles ---
// The palette contract: every theme fills exactly the 10 shared roles, once each, in
// canonical order, and defines a matching `:root` custom property. These are the
// tripwires that keep a new theme (or a hand edit) from reintroducing a private colour
// vocabulary — the exact drift this migration removed.
describe("palette roles (tripwire)", () => {
  const THEMES = [
    { theme: blockTheme, uniques: 8 },
    { theme: futureTheme, uniques: 9 },
  ];

  test.each(THEMES)("$theme.name fills all 10 roles exactly once, in canonical order", ({ theme }) => {
    const roles = (theme.palette ?? []).map((p) => p.varName);
    expect(roles).toEqual([...PALETTE_VARS]);
  });

  test.each(THEMES)("$theme.name emits a :root custom property per role", ({ theme }) => {
    for (const sw of theme.palette ?? []) {
      expect(theme.css, `--${sw.varName} missing from ${theme.name}'s :root`).toContain(
        `--${sw.varName}: ${sw.hex.toLowerCase()};`,
      );
    }
  });

  // The de-dupe the showcase + every palette-colour param control render from: a colour
  // filling several roles is listed ONCE, keyed to its FIRST role (block's Oat → muted-2,
  // never muted-3). Guards the "don't show duplicate colour options" requirement.
  test.each(THEMES)("$theme.name de-dupes to its unique colours, first role wins", ({ theme, uniques }) => {
    const unique = uniquePaletteEntries(theme.palette ?? []);
    expect(unique.length).toBe(uniques);
    expect(new Set(unique.map((p) => p.hex.toLowerCase())).size).toBe(uniques);
    // each kept entry is the FIRST role holding that hex, in canonical order
    for (const sw of unique) {
      const first = (theme.palette ?? []).find((p) => p.hex.toLowerCase() === sw.hex.toLowerCase())!;
      expect(sw.varName).toBe(first.varName);
    }
  });

  // No skin may reintroduce a raw colour. Roles + color-mix() derivations only.
  test.each(THEMES)("$theme.name's skins carry no hex/rgb literal", ({ theme }) => {
    for (const [name, css] of Object.entries(theme.skins ?? {})) {
      expect(css, `${theme.name}/${name} has a colour literal`).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
    }
    expect(theme.frameCss ?? "", `${theme.name}'s frameCss has a colour literal`).not.toMatch(
      /#[0-9a-fA-F]{3,8}\b|rgba?\(/,
    );
  });

  // Legacy decks persist the colour names that were current when they were saved, so the
  // read path must keep accepting them forever (types/palette.ts).
  test("legacy colour names still normalize to their role", () => {
    expect(normalizePaletteVar("pink")).toBe("primary");
    expect(normalizePaletteVar("offwhite")).toBe("muted-2");
    expect(normalizePaletteVar("fx-cyan")).toBe("primary");
    expect(normalizePaletteVar("fx-panel-solid")).toBe("muted-3");
    expect(normalizePaletteVar("accent-1")).toBe("accent-1"); // a role passes through
  });

  // A component composed from a pre-migration deck (accent: "pink") must still build.
  test("a legacy accent value still composes", () => {
    expect(() => getComponent("stat")({ value: 1, label: "a", accent: "pink" } as never).build(ctx("s"))).not.toThrow();
    const html = getComponent("stat")({ value: 1, label: "a", accent: "pink" } as never).build(ctx("s")).html;
    expect(html).toContain("var(--primary)");
  });
});
