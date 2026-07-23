// Tripwire + build-smoke for the component/treatment registry. Importing
// "./registry" registers every element; these tests assert the registry matches
// the COMPONENT_NAMES / TREATMENT_NAMES tuples (both directions) and that every
// element builds from its example without throwing, emits valid anims, and (for
// treatments) produces a well-formed, deterministic sub-composition.
import { describe, expect, test } from "bun:test";
import { COMPONENT_NAMES, TREATMENT_NAMES } from "../types/components";
import { PALETTE_VARS, uniquePaletteEntries } from "../types/palette";
import { BACKDROP_NAMES, FRAME_GROUNDS } from "../types/storyboard";
import { BACKDROPS, buildBackdrop } from "./primitives/backdrops";
import { DECORATION_VARIANTS } from "./primitives/decoration-shapes";
import {
  FUTURE_DECORATION_COMPONENTS,
  FUTURE_DECORATION_VARIANTS,
} from "./primitives/future-decoration-shapes";
import { iconSvg } from "./icons";
import "./registry";
import { AnimDescriptorSchema } from "./runtime/anim";
import { scrubDeterminism } from "./runtime/determinism";
import { renderScene } from "./runtime/emit";
import {
  allComponents,
  allTreatments,
  componentNames,
  hasTreatment,
  getComponent,
  getTreatment,
  treatmentNames,
} from "./runtime/registry";
import { rootContext } from "./runtime";
import type { BuildContext } from "./runtime/types";
import { blockTheme } from "./themes/block/theme";
import { futureTheme } from "./themes/future/theme";
// The live-theme barrel — every theme-generic sweep iterates THIS, not a hand-written
// [blockTheme, futureTheme] literal, so a newly converted theme (added to ALL_THEMES +
// engine THEMES) inherits every parity tripwire below automatically. The pin test
// (below) fails loudly if ALL_THEMES and the engine's loadable set ever disagree.
import { ALL_THEMES } from "./themes/all";
import { THEMES as ENGINE_THEMES } from "../engine/load-theme";

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
  // The generic sweeps are only as complete as ALL_THEMES: a theme the engine can load
  // but that is missing from ALL_THEMES would silently escape every parity tripwire.
  // Pin the two together (mirrors boxless-reveal.test.ts) so a converted-but-unlisted
  // theme fails HERE rather than shipping unchecked.
  test("ALL_THEMES covers exactly the engine-loadable THEMES", () => {
    expect([...ALL_THEMES.map((t) => t.name)].sort()).toEqual([...ENGINE_THEMES].sort());
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

/** A family's variant enum as the SCHEMA sees it — what a deck is actually validated
 *  against, rather than the map the family was declared from. */
const schemaVariants = (name: string): string[] =>
  (getComponent(name).jsonSchema() as { properties?: Record<string, { enum?: string[] }> })
    .properties?.variant?.enum ?? [];

// Both decoration engines declare their families' shape lists in ONE map
// (DECORATION_VARIANTS / FUTURE_DECORATION_VARIANTS) which each family's index.ts consumes.
// Assert the map is what actually reaches the schema, so the documented list and the enum a
// deck is validated against can't drift — and that every name in it resolves to a drawable
// shape, which is what turns a typo from a silently-wrong render into a failing test.
describe("decoration variant maps are the single source of truth", () => {
  const MAPS: [string, Record<string, readonly string[]>][] = [
    ["block", DECORATION_VARIANTS],
    ["future", FUTURE_DECORATION_VARIANTS],
  ];

  test.each(MAPS)("%s: each family's schema enum IS its map entry", (_engine, map) => {
    for (const [family, variants] of Object.entries(map)) {
      expect(schemaVariants(family), `${family}'s enum diverges from its variant map`).toEqual([
        ...variants,
      ]);
    }
  });

  // A variant name with no entry in its engine's SHAPES table doesn't fail — it falls back
  // to the engine's default shape, so the deck renders a plausible-looking WRONG decoration.
  // Distinct markup per variant is what makes that detectable: a dead name collides with
  // whichever variant the fallback draws.
  test.each(MAPS)("%s: every mapped variant draws a DISTINCT shape (no dead name)", (_engine, map) => {
    for (const [family, variants] of Object.entries(map)) {
      const drawn = new Map<string, string>();
      for (const v of variants) {
        // Build each at the same size/placement so only the SHAPE can differ.
        const html = getComponent(family)({ variant: v, x: 50, y: 50, size: 20 } as never).build(
          ctx(`sc-${family}`),
        ).html;
        expect(html.length, `${family}/${v} rendered nothing`).toBeGreaterThan(0);
        expect(
          drawn.has(html),
          `${family}/${v} draws the same shape as '${drawn.get(html)}' — a name with no SHAPES entry falls back to the default`,
        ).toBe(false);
        drawn.set(html, v);
      }
    }
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
    const seen = new Map<string, string>();
    for (const fam of FUTURE_DECORATION_COMPONENTS) {
      const variants = schemaVariants(fam);
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
      getComponent("starburst")({ variant: "triangle", x: 12, y: 88, layer: "front", accent: "accent-2" }),
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

  test("template override: cover adds an ANIMATED cyan rule + preserves the eyebrow slot", () => {
    const built = getTreatment("cover")().build(fctx("f01-cover"));
    const html = built.html;
    const ex = getTreatment("cover").defaults() as { headline: string; subtitle?: string; eyebrow?: string };
    // future's cover template adds a `.rule` underline (block's shared template has none) and
    // it now animates in via the shared coverAnim's `rule` descriptor — the element carries its
    // scoped anim class AND a `rule` descriptor targets it (was painted statically at t=0 before).
    expect(html).toContain('class="rule f01-cover-rule"');
    expect(built.anims.some((a) => a.kind === "rule" && a.target === "f01-cover-rule")).toBe(true);
    // the eyebrow slot is PRESERVED (future used to drop it entirely) — it renders when set.
    if (ex.eyebrow) expect(html).toContain(ex.eyebrow);
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
    for (const theme of ALL_THEMES) {
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
  // Iterate every live theme (not a hand-written [block, future] pair) so a newly
  // converted theme is held to the palette contract for free.
  test.each(ALL_THEMES)("$name fills all 10 roles exactly once, in canonical order", (theme) => {
    const roles = (theme.palette ?? []).map((p) => p.varName);
    expect(roles).toEqual([...PALETTE_VARS]);
  });

  test.each(ALL_THEMES)("$name emits a :root custom property per role", (theme) => {
    for (const sw of theme.palette ?? []) {
      expect(theme.css, `--${sw.varName} missing from ${theme.name}'s :root`).toContain(
        `--${sw.varName}: ${sw.hex.toLowerCase()};`,
      );
    }
  });

  // The de-dupe the showcase + every palette-colour param control render from: a colour
  // filling several roles is listed ONCE, keyed to its FIRST role (block's Oat → muted-2,
  // never muted-3). The expected count is DERIVED from the palette's distinct hexes — not a
  // hardcoded per-theme literal (block 8 / future 9) a new theme would have to be added to —
  // so this asserts the de-dupe agrees with the palette, generically.
  test.each(ALL_THEMES)("$name de-dupes to its unique colours, first role wins", (theme) => {
    const distinctHexes = new Set((theme.palette ?? []).map((p) => p.hex.toLowerCase())).size;
    const unique = uniquePaletteEntries(theme.palette ?? []);
    expect(unique.length).toBe(distinctHexes);
    expect(new Set(unique.map((p) => p.hex.toLowerCase())).size).toBe(distinctHexes);
    // each kept entry is the FIRST role holding that hex, in canonical order
    for (const sw of unique) {
      const first = (theme.palette ?? []).find((p) => p.hex.toLowerCase() === sw.hex.toLowerCase())!;
      expect(sw.varName).toBe(first.varName);
    }
  });

  // No skin may reintroduce a raw colour. Roles + color-mix() derivations only.
  test.each(ALL_THEMES)("$name's skins carry no hex/rgb literal", (theme) => {
    for (const [name, css] of Object.entries(theme.skins ?? {})) {
      expect(css, `${theme.name}/${name} has a colour literal`).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
    }
    expect(theme.frameCss ?? "", `${theme.name}'s frameCss has a colour literal`).not.toMatch(
      /#[0-9a-fA-F]{3,8}\b|rgba?\(/,
    );
  });

  // The complete PRE-migration colour vocabulary: block's own names and future's parallel
  // --fx-* identity layer. These are NOT leftovers to clean up — they are the fixture for
  // the migration's central promise. Roles are the only vocabulary now, and the old names
  // were REMOVED rather than aliased, so a stored deck carrying one must fail loudly at
  // validation instead of being quietly folded to a role and rendering a different colour.
  const RETIRED = [
    // block's pre-role palette
    "pink", "blue", "green", "yellow", "cream", "offwhite", "white", "black",
    // future's parallel identity layer
    "fx-cyan", "fx-panel", "fx-panel-solid", "fx-line", "fx-steel", "fx-faint", "fx-glass", "fx-rule",
  ];

  // …and the fixture can't rot into a vacuous test: if a role were ever NAMED one of these,
  // the "is rejected" cases below would be asserting the opposite of the contract.
  test("no retired name is also a live palette role", () => {
    const roles = new Set<string>(PALETTE_VARS);
    expect(RETIRED.filter((r) => roles.has(r))).toEqual([]);
  });

  test.each(RETIRED)("the retired colour name '%s' is rejected, not quietly folded to a role", (retired) => {
    // as a component accent…
    expect(() =>
      getComponent("stat")({ value: 1, label: "a", accent: retired } as never).build(ctx("s")),
    ).toThrow();
    // …and as a scene ground (FrameGround is the same role vocabulary).
    expect((FRAME_GROUNDS as readonly string[]).includes(retired)).toBe(false);
  });

  test("a role is still accepted", () => {
    const html = getComponent("stat")({ value: 1, label: "a", accent: "accent-3" }).build(ctx("s")).html;
    expect(html).toContain("var(--accent-3)");
  });
});

// ------------------------------------------------------------- accent plumbing ---
// The per-instance accent contract: a component emits a custom property carrying the
// author's chosen palette role, and EVERY theme's skin must consume it — otherwise the
// colour picker silently does nothing under that theme (which is exactly how future
// shipped: it hard-coded cyan and ignored all seven props).
describe("accent plumbing (tripwire)", () => {
  // component -> the custom property its layout() emits
  const ACCENT_PROPS: [string, string][] = [
    ["caption", "--capbar"],
    ["card", "--ic"],
    ["icon", "--icol"],
    ["pill", "--pillbg"],
    ["stat", "--dot"],
    ["bar", "--col"],
    ["rank", "--col"],
  ];

  for (const theme of ALL_THEMES) {
    test.each(ACCENT_PROPS)(`${theme.name}'s %s skin consumes %s`, (name, prop) => {
      const css = theme.skins?.[name];
      expect(css, `${theme.name} has no skin for '${name}'`).toBeTruthy();
      expect(css!, `${theme.name}/${name}.css ignores ${prop} — its colour param is dead`).toContain(
        `var(${prop}`,
      );
    });
  }

  // Completeness: ACCENT_PROPS is the hand-maintained component→prop map the sweep above
  // depends on, so a NEW component that takes a palette-role colour param but is absent
  // from the table would escape the "skin consumes the prop" check entirely. Derive the
  // accent-bearing component set from the schemas (any non-decoration whose schema has an
  // enum field valued entirely in PALETTE_VARS — the same test the WebUI's isPaletteEnum
  // uses) and assert every one is covered. Decorations tint via their own engine, not a
  // skin, so they're exempt.
  test("every accent-bearing component is in the ACCENT_PROPS map", () => {
    const covered = new Set(ACCENT_PROPS.map(([name]) => name));
    const roles = new Set<string>(PALETTE_VARS);
    const accentBearing = allComponents()
      .filter((f) => !f.decoration)
      .filter((f) => {
        const props = (f.jsonSchema() as { properties?: Record<string, { enum?: string[] }> }).properties ?? {};
        return Object.values(props).some(
          (p) => Array.isArray(p.enum) && p.enum.length > 0 && p.enum.every((v) => roles.has(v)),
        );
      })
      .map((f) => f.componentName);
    const missing = accentBearing.filter((n) => !covered.has(n));
    expect(missing, `accent-bearing components missing from ACCENT_PROPS: ${missing.join(", ")}`).toEqual([]);
  });

  // An accent param carries NO shared default, so an unset accent falls through to the
  // theme's own fallback rather than pinning every theme to block's choice.
  test.each([
    ["caption", "accentBar"],
    ["card", "accent"],
    ["icon", "accent"],
    ["pill", "variant"],
    ["stat", "accent"],
  ])("%s.%s has no shared default (theme owns the default)", (name, field) => {
    const js = getComponent(name).jsonSchema() as { properties?: Record<string, { default?: unknown }> };
    expect(js.properties?.[field]?.default, `${name}.${field} pins a default across themes`).toBeUndefined();
  });

  // …and the prop is therefore absent from the markup when unset, present when chosen.
  test("the accent prop is emitted only when an author picks one", () => {
    expect(getComponent("icon")({ name: "shield" }).build(ctx("s")).html).not.toContain("--icol");
    expect(getComponent("icon")({ name: "shield", accent: "secondary" }).build(ctx("s")).html).toContain(
      "--icol: var(--secondary)",
    );
  });

  // The chosen role must survive into the rendered scene under EVERY live theme.
  test.each(ALL_THEMES)("$name honours a per-instance accent end-to-end", (theme) => {
    const inst = getTreatment("feature-cards")().addChildren(
      getComponent("card")({ title: "T", icon: "I", accent: "accent-3" }),
    );
    const html = renderScene(inst, rootContext("s01", theme, { voIds: ["l1"] }));
    expect(html).toContain("--ic: var(--accent-3)");
  });
});

// ------------------------------------------------------------ ground resolution ---
// A scene's ground resolves: explicit override → theme.groundDefault → treatment
// canonical. The middle step lets a monochrome theme (future) pin every frame without
// an `!important`, which used to make an explicit background impossible to apply.
describe("ground resolution (tripwire)", () => {
  const fctx = (id: string) => rootContext(id, futureTheme, { voIds: ["l1", "l2"] });
  const bctx = (id: string) => rootContext(id, blockTheme, { voIds: ["l1", "l2"] });

  test("future pins every treatment to its groundDefault when no scene ground is set", () => {
    expect(futureTheme.groundDefault).toBe("muted-2");
    for (const name of TREATMENT_NAMES) {
      const html = renderScene(getTreatment(name)(), fctx(`g-${name}`));
      expect(html, `${name} did not land on future's ground default`).toContain(
        "background: var(--muted-2)",
      );
    }
  });

  test("an EXPLICIT scene ground beats the theme default (the bug !important caused)", () => {
    const html = renderScene(getTreatment("cover")(), fctx("g-x"), { ground: "accent-3" });
    expect(html).toContain("background: var(--accent-3)");
    expect(html).not.toContain("background: var(--muted-2)");
  });

  test("future's frame.css no longer force-pins the ground", () => {
    // Strip comments first — the file EXPLAINS the removed !important in prose.
    const decls = (futureTheme.frameCss ?? "").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(decls).not.toMatch(/background:[^;]*!important/);
  });

  test("block (no groundDefault) still uses each treatment's canonical ground", () => {
    expect(blockTheme.groundDefault).toBeUndefined();
    expect(renderScene(getTreatment("cover")(), bctx("g-b"))).toContain("background: var(--muted-1)");
    expect(renderScene(getTreatment("quote")(), bctx("g-q"))).toContain("background: var(--primary)");
  });

  // The dot grid is ink-on-light by default; a dark theme must be able to repaint it.
  test("the dots mask is theme-recolourable via --dot-ink", () => {
    expect(BACKDROPS.dots.build({ ground: "muted-2", theme: futureTheme, ctx: fctx("d") }).css).toContain(
      "var(--dot-ink",
    );
    expect(futureTheme.frameCss ?? "").toContain("--dot-ink");
  });

  // future's cover template dropped the eyebrow slot entirely, so typing one did nothing.
  test("future's cover renders an eyebrow when the slide sets one", () => {
    const withEyebrow = renderScene(
      getTreatment("cover")({ headline: "H", subtitle: "S", eyebrow: "Hello there" } as never),
      fctx("g-e"),
    );
    expect(withEyebrow).toContain("Hello there");
    // …and the ELEMENT still self-removes when unset (the word "eyebrow" survives in the
    // CSS rule + anim target either way, so assert on the markup, not the whole document).
    const noEyebrow = renderScene(getTreatment("cover")({ headline: "H", subtitle: "S" } as never), fctx("g-e2"));
    expect(noEyebrow).not.toContain('<div class="eyebrow"');
    expect(withEyebrow).toContain("eyebrow");
  });
});

// --------------------------------------------------- theme template overrides ---
// A theme template override may re-wrap, rename or ADD nodes, but must never DROP a
// data-slot: the schema field survives, so the editor keeps rendering a control that
// does nothing. Future shipped exactly that twice — cover and quote both dropped
// `eyebrow`, and typing one silently had no effect.
describe("theme template overrides preserve the shared markers (tripwire)", () => {
  // data-slot ids are STRICT-preserve (id-keyed): a dropped data-slot leaves the editor
  // rendering a dead control (future shipped this twice — cover + quote dropped `eyebrow`).
  // data-children is a VALUELESS marker (`<div data-children>`), so it's presence-preserve:
  // an override of a child-bearing treatment must keep the container (else treatment.ts
  // throws on child injection). data-anim is deliberately NOT blanket-checked: an override
  // may legitimately drop a data-anim that NO descriptor targets (future's stat drops `dot`,
  // which nothing animates). The correct data-anim invariant is anim-target RESOLUTION —
  // every emitted descriptor resolves to a stamped element — asserted in theme-parity.test.ts.
  const slotIds = (html: string): string[] =>
    [...html.matchAll(/data-slot="([a-z0-9-]+)"/g)].map((m) => m[1]!).sort();
  const hasChildrenContainer = (html: string): boolean => /\sdata-children(\s|>|=)/.test(html);

  // Iterate EVERY live theme's overrides (not a [block, future] literal), so a newly
  // converted theme's overrides are held to the same marker-preservation contract.
  const OVERRIDES = ALL_THEMES.flatMap((theme) =>
    Object.keys(theme.templates ?? {}).map((name) => ({ theme: theme.name, name, theme_: theme })),
  );

  test("there is at least one override to check", () => {
    expect(OVERRIDES.length).toBeGreaterThan(0);
  });

  // The shared template is the element's own trio file on disk — the registry factory
  // doesn't expose it, and reading the file is what the override is a copy OF.
  const sharedTemplate = async (name: string): Promise<string> => {
    const dir = hasTreatment(name) ? "treatments" : "primitives";
    return Bun.file(`${import.meta.dir}/${dir}/${name}/template.html`).text();
  };

  test.each(OVERRIDES)("$theme/$name keeps every shared data-slot + the data-children container", async ({ name, theme_ }) => {
    const shared = await sharedTemplate(name);
    const override = theme_.templates![name]!;
    const sharedSlots = slotIds(shared);
    expect(sharedSlots.length, `no shared data-slot found for '${name}' — the check is vacuous`).toBeGreaterThan(0);
    const missing = sharedSlots.filter((sl) => !slotIds(override).includes(sl));
    expect(missing, `${theme_.name}/${name} drops slot(s): ${missing.join(", ")}`).toEqual([]);
    // If the shared template is child-bearing, the override must keep its container.
    if (hasChildrenContainer(shared)) {
      expect(hasChildrenContainer(override), `${theme_.name}/${name} drops the data-children container`).toBe(true);
    }
  });
});

// ------------------------------------------------------- showcase example parity ---
// Each live theme supplies its OWN showcase sample copy. When one theme seeds a param
// and another doesn't, that theme's showcase card renders the field empty — it reads as
// a broken control rather than a deliberate choice, which is how future shipped a cover
// and a quote with no eyebrow. Parity is the default; genuine differences go in the
// allowlist below WITH a reason, so the omission is a decision rather than an oversight.
describe("showcase example parity across live themes (tripwire)", () => {
  const THEMES = ALL_THEMES;

  /** `${treatment}.${param}` (or `${treatment}.children.${param}`) → why it's absent. */
  const INTENTIONAL: Record<string, string> = {
    // future's chart plots packet-loss percentages; block's plots revenue in dollars.
    // A currency prefix would be wrong on it, so only block seeds one.
    "chart.children.unitPrefix": "future's chart is a percentage, not a currency",
    // block's stats are whole numbers (92, 3, 40); future's leads with 99.7, so only
    // future needs a decimal place.
    "stat-grid.children.decimals": "block's stat examples are integers",
  };

  const paramsOf = (t: (typeof THEMES)[number], name: string) =>
    Object.keys(t.examples?.[name]?.params ?? {});
  const childKeysOf = (t: (typeof THEMES)[number], name: string) =>
    Object.keys((t.examples?.[name]?.children ?? [])[0] ?? {});

  test.each(TREATMENT_NAMES.map((n) => [n]))("%s seeds the same example params under every theme", (name) => {
    const union = [...new Set(THEMES.flatMap((t) => paramsOf(t, name)))];
    for (const t of THEMES) {
      const missing = union
        .filter((p) => !paramsOf(t, name).includes(p))
        .filter((p) => !(`${name}.${p}` in INTENTIONAL));
      expect(missing, `${t.name}'s '${name}' example omits: ${missing.join(", ")}`).toEqual([]);
    }
  });

  test.each(TREATMENT_NAMES.map((n) => [n]))("%s seeds the same example CHILD fields under every theme", (name) => {
    const union = [...new Set(THEMES.flatMap((t) => childKeysOf(t, name)))];
    for (const t of THEMES) {
      if (childKeysOf(t, name).length === 0) continue; // childless treatment under this theme
      const missing = union
        .filter((k) => !childKeysOf(t, name).includes(k))
        .filter((k) => !(`${name}.children.${k}` in INTENTIONAL));
      expect(missing, `${t.name}'s '${name}' child omits: ${missing.join(", ")}`).toEqual([]);
    }
  });
});
