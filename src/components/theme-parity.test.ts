// Theme-GENERIC parity sweep — the durable guard the block↔future port needed.
//
// Every assertion here iterates ALL_THEMES × the real registry, so a theme is held to the
// full contract the moment it joins ALL_THEMES (+ engine THEMES) — no per-theme test to
// hand-write, which is exactly how future silently drifted from block (a dropped eyebrow
// slot, an un-consumed accent, a missing --dense rule). registry.test.ts still owns the
// theme-SPECIFIC facts (block's dot-grid, future's constellation/overrides); this file owns
// the invariants that must hold for EVERY theme identically. Adding a third theme to
// ALL_THEMES turns every case below on for it automatically.
import { describe, expect, test } from "bun:test";
import { TREATMENT_NAMES } from "../types/components";
import { PALETTE_VARS } from "../types/palette";
import { BACKDROP_NAMES } from "../types/storyboard";
import "./registry"; // populate the registry
import { scrubDeterminism } from "./runtime/determinism";
import { renderScene } from "./runtime/emit";
import { rootContext } from "./runtime";
import { allComponents, allTreatments, getComponent, getTreatment, hasComponent, hasTreatment } from "./runtime/registry";
import type { ComponentFactory, ThemeTokens, TreatmentFactory } from "./runtime/types";
import { ALL_THEMES } from "./themes/all";
import { blockTheme } from "./themes/block/theme";

const VO = ["l1", "l2", "l3", "l4", "l5"];
const pctx = (theme: ThemeTokens, compId: string) => rootContext(compId, theme, { voIds: VO });
const nameOf = (f: ComponentFactory | TreatmentFactory): string =>
  "treatmentName" in f ? f.treatmentName : f.componentName;

// ---------------------------------------------------------------- skin coverage ---
// A theme owns the LOOK of every element it renders (the trios carry no css). So every
// non-decoration component + every treatment MUST have a theme.skins entry, and every
// theme.skins key must name a registered element. A forgotten skin renders that element
// completely unstyled in the deck AND the showcase — and the "examples compose" smoke
// (registry.test.ts) still passes, because composing-without-throwing ≠ being styled.
// Decorations are exempt: they tint via their own decoration engine, not a theme skin.
describe("skin coverage (tripwire)", () => {
  const skinnable = [
    ...allComponents().filter((c) => !c.decoration).map((c) => c.componentName),
    ...allTreatments().map((t) => t.treatmentName),
  ].sort();
  const registeredNames = new Set<string>([
    ...allComponents().map((c) => c.componentName),
    ...allTreatments().map((t) => t.treatmentName),
  ]);

  test.each(ALL_THEMES)("$name skins every non-decoration element it renders", (theme) => {
    const missing = skinnable.filter((name) => {
      const css = theme.skins?.[name];
      return !css || css.trim().length === 0;
    });
    expect(missing, `${theme.name} is missing a skin for: ${missing.join(", ")}`).toEqual([]);
  });

  test.each(ALL_THEMES)("$name's skins keys all name a registered element", (theme) => {
    const orphan = Object.keys(theme.skins ?? {}).filter((k) => !registeredNames.has(k));
    expect(orphan, `${theme.name} skins reference unregistered element(s): ${orphan.join(", ")}`).toEqual([]);
  });
});

// -------------------------------------------------------- anim-target resolution ---
// The invariant dom.ts:stampAnims advertises ("verify every declared anim target exists in
// the template") but nothing asserted. qualifyAnim scopes a descriptor target to
// `${prefix}-${id}`; stampAnims writes the SAME class onto the data-anim element. An
// element's OWN anim targets (anim.ts) are theme-independent, but each theme may override
// the template — so two invariants matter, and BOTH allow a legitimately-optional target:
//
//   (1) TYPO GUARD: every own target id must be stamped by SOME template variant (the shared
//       trio template OR any theme's override). A target in NO variant is a dead descriptor —
//       a rename/typo in anim.ts that silently no-ops on every theme. This tolerates a
//       theme-specific optional element (future's cover `.rule`, present only in future's
//       override): it's in the union, so it passes; block emitting the same no-op descriptor
//       is fine (mc.js:385 skips a missing target, exactly as it does for a pruned slot).
//   (2) OVERRIDE PRESERVATION: a template override must keep every data-anim id that the
//       shared template stamps AND a descriptor targets. Dropping a TARGETED+shared id (e.g.
//       future's cover override dropping `headline`) silently kills that reveal on that theme.
//       Dropping an UNtargeted shared id is fine (future's stat drops `dot` — nothing animates
//       it), so `dot` is correctly excluded (targeted ∩ shared only).
describe("anim-target resolution (tripwire)", () => {
  const stampedIds = (html: string): Set<string> =>
    new Set([...html.matchAll(/data-anim="([a-z0-9-]+)"/g)].map((m) => m[1]!));
  const sharedTemplate = async (name: string): Promise<string> => {
    const dir = hasTreatment(name) ? "treatments" : "primitives";
    return Bun.file(`${import.meta.dir}/${dir}/${name}/template.html`).text();
  };
  const factoryByName = (name: string): ComponentFactory | TreatmentFactory =>
    hasTreatment(name) ? getTreatment(name) : getComponent(name);
  // An element's OWN local anim targets (not children/decorations/backdrop), theme-independent
  // (anim.ts doesn't branch on theme, so build under any theme — block, which uses shared
  // templates). Own targets scope to `${compId}-<id>` with no `__cN`/`__dN` segment; the
  // backdrop's `${compId}-bg` is a canvas class, not a data-anim, so drop kind==="backdrop".
  const ownTargets = (name: string): Set<string> => {
    const compId = "S";
    const built = factoryByName(name)().build(pctx(blockTheme, compId));
    const ids = new Set<string>();
    for (const a of built.anims) {
      if (a.kind === "backdrop") continue;
      const m = a.target.match(/^S-([a-z0-9-]+)$/);
      if (m) ids.add(m[1]!);
    }
    return ids;
  };

  // Decorations render from a shared in-code template (DECO_TEMPLATE / FX_DECO_TEMPLATE),
  // not a per-folder template.html, and carry a single trivial `item` target — exclude them
  // from the file-read typo guard (they're never themed via templates/skins either).
  const ALL_NAMES = [...allComponents().filter((c) => !c.decoration), ...allTreatments()].map(nameOf);

  test.each(ALL_NAMES.map((n) => [n]))("%s: every own anim target exists in some template variant (no dead descriptor)", async (name) => {
    const variants = stampedIds(await sharedTemplate(name));
    for (const theme of ALL_THEMES) {
      const tpl = theme.templates?.[name];
      if (tpl) for (const id of stampedIds(tpl)) variants.add(id);
    }
    const dead = [...ownTargets(name)].filter((id) => !variants.has(id));
    expect(dead, `${name}: anim target(s) [${dead.join(", ")}] exist in no template variant — a typo/rename in anim.ts`).toEqual([]);
  });

  const OVERRIDES = ALL_THEMES.flatMap((theme) =>
    Object.keys(theme.templates ?? {}).map((name) => ({ theme: theme.name, name, theme_: theme })),
  );

  test.each(OVERRIDES)("$theme/$name override keeps every TARGETED shared data-anim id", async ({ name, theme_ }) => {
    const shared = stampedIds(await sharedTemplate(name));
    const override = stampedIds(theme_.templates![name]!);
    const mustSurvive = [...ownTargets(name)].filter((id) => shared.has(id)); // targeted ∩ shared
    const dropped = mustSurvive.filter((id) => !override.has(id));
    expect(dropped, `${theme_.name}/${name} drops targeted data-anim id(s): ${dropped.join(", ")} — that reveal silently no-ops`).toEqual([]);
  });
});

// --------------------------------------------------------- per-theme scene smoke ---
// Every treatment must build a well-formed, deterministic scene under EVERY theme — the
// generic counterpart to registry.test.ts's block-only build-smoke + the future tripwire,
// so a newly ported theme's whole treatment set is smoke-tested for free.
describe("every treatment builds a clean scene under every theme", () => {
  for (const theme of ALL_THEMES) {
    test.each(TREATMENT_NAMES.map((n) => [n]))(`${theme.name}/%s`, (name) => {
      const compId = `sc-${theme.name}-${name}`;
      const html = renderScene(getTreatment(name)(), pctx(theme, compId));
      expect(html).toContain(`data-composition-id="${compId}"`);
      expect(html).toContain(`.${compId}-root .block-frame`);
      expect(html).not.toContain("data-slot");
      expect(html).not.toContain("data-anim");
      expect(html).not.toContain("data-children");
      expect(() => scrubDeterminism(html)).not.toThrow();
      // seeded backdrops are deterministic per compId → byte-identical rebuild
      expect(renderScene(getTreatment(name)(), pctx(theme, compId))).toBe(html);
    });
  }
});

// --------------------------------------------------------- canonical backdrop ---
// A theme's canonical backdrop mask must actually paint on a scene (block dots / future
// constellation). Generic: whatever ThemeTokens.backdrop the theme declares must render.
describe("canonical backdrop renders (tripwire)", () => {
  test.each(ALL_THEMES)("$name paints its declared backdrop mask", (theme) => {
    if (!theme.backdrop || theme.backdrop === "plain") return; // a theme may opt out of a mask
    const html = renderScene(getTreatment("cover")(), pctx(theme, `bd-${theme.name}`));
    expect(html, `${theme.name} declares backdrop '${theme.backdrop}' but no scene painted it`).toContain(
      `mc-backdrop--${theme.backdrop}`,
    );
  });
});

// --------------------------------------------------------- shared backdrop pool ---
// Backdrops are SHARED, unlike decorations: each theme contributes one signature design to
// the pool (block → dots, future → constellation) and EVERY theme may then use EVERY design.
// That only holds if no design depends on the theme that authored it — so sweep the full
// cross-product (every BACKDROP_NAMES design × every theme) and assert each one paints, and
// paints deterministically. A design that reads a theme-specific token fails here rather
// than rendering invisibly in someone else's deck.
describe("shared backdrop pool (tripwire)", () => {
  const DESIGNS = BACKDROP_NAMES.filter((b) => b !== "plain");

  for (const theme of ALL_THEMES) {
    test.each(DESIGNS.map((d) => [d]))(`${theme.name} can paint the shared '%s' design`, (name) => {
      const compId = `bd-${theme.name}-${name}`;
      const html = renderScene(getTreatment("cover")(), pctx(theme, compId), { backdrop: name });
      expect(html, `${theme.name} could not paint shared design '${name}'`).toContain(`mc-backdrop--${name}`);
      // seeded/animated designs included: same compId ⇒ byte-identical rebuild
      expect(renderScene(getTreatment("cover")(), pctx(theme, compId), { backdrop: name })).toBe(html);
    });
  }

  test.each(ALL_THEMES)("$name's default backdrop is a design in the shared pool", (theme) => {
    const canonical = theme.backdrop ?? "plain";
    expect(
      (BACKDROP_NAMES as readonly string[]).includes(canonical),
      `${theme.name}'s default backdrop '${canonical}' is not a registered design`,
    ).toBe(true);
  });
});

// ---------------------------------------------------------- decoration ownership ---
// Decorations are the ONE element family a theme owns outright: block's neobrutalist
// starburst/slab/stripe/badge, future's luminous node/reticle/glyph/signal. Two mechanisms
// keep them apart — the intrinsic `decoration` flag (holds every family out of the showcase
// Components grid under EVERY theme) and the per-theme roster (what this theme offers). The
// sweep below is the generic version of registry.test.ts's block-only/future-only checks: a
// newly ported theme must bring its OWN four families, not roster someone else's.
describe("decoration ownership (tripwire)", () => {
  test.each(ALL_THEMES)("$name rosters decorations, and only registered decoration components", (theme) => {
    expect(theme.decorations?.length, `${theme.name} rosters no decorations`).toBeGreaterThan(0);
    const bad = (theme.decorations ?? []).filter((n) => {
      if (!hasComponent(n)) return true;
      return !getComponent(n).decoration; // a non-decoration component can't be rostered as one
    });
    expect(bad, `${theme.name} rosters non-decoration or unregistered element(s): ${bad.join(", ")}`).toEqual([]);
  });

  test("no two themes roster the same decoration family", () => {
    const owner = new Map<string, string>();
    const shared: string[] = [];
    for (const theme of ALL_THEMES) {
      for (const name of theme.decorations ?? []) {
        const prev = owner.get(name);
        if (prev) shared.push(`${name} (${prev} + ${theme.name})`);
        else owner.set(name, theme.name);
      }
    }
    expect(shared, `decoration families rostered by more than one theme: ${shared.join(", ")}`).toEqual([]);
  });

  test("every decoration component is rostered by exactly one theme (no orphans)", () => {
    const rostered = new Set(ALL_THEMES.flatMap((t) => t.decorations ?? []));
    const orphans = allComponents()
      .filter((c) => c.decoration)
      .map((c) => c.componentName)
      .filter((n) => !rostered.has(n));
    expect(orphans, `decoration component(s) no theme offers: ${orphans.join(", ")}`).toEqual([]);
  });
});

// -------------------------------------------------- default-decoration suppression ---
// suppressDefaultDecorations gates a treatment's defaultDecorations (block's cover star /
// closing slab). A theme that owns its look via the backdrop (future's constellation) sets
// it so those neobrutalist shapes never render off-theme or shift the reveal cascade. Assert
// the gate works for EVERY theme by its own flag — cover ships defaults, so its `__d0` marker
// is present exactly when the theme does NOT suppress.
describe("suppressDefaultDecorations gate (tripwire)", () => {
  test.each(ALL_THEMES)("$name renders cover's default decorations iff it does not suppress", (theme) => {
    const html = renderScene(getTreatment("cover")(), pctx(theme, `dd-${theme.name}`));
    const hasDefaultDeco = html.includes("__d0-item");
    expect(hasDefaultDeco, `${theme.name}: suppress=${!!theme.suppressDefaultDecorations} but __d0 present=${hasDefaultDeco}`).toBe(
      !theme.suppressDefaultDecorations,
    );
  });
});

// ------------------------------------------------------------ ground resolution ---
// A monochrome theme pins every frame via groundDefault (no `!important`, which used to make
// an explicit scene ground impossible). Generic over ALL_THEMES: a theme WITH a groundDefault
// lands every treatment on it; a theme without one uses each treatment's canonical ground;
// and NO theme may reintroduce a `background: … !important` in its frameCss.
describe("ground resolution (tripwire)", () => {
  test.each(ALL_THEMES)("$name: groundDefault (if set) pins every treatment", (theme) => {
    if (!theme.groundDefault) return; // themes without a default keep each treatment's canonical ground
    for (const name of TREATMENT_NAMES) {
      const html = renderScene(getTreatment(name)(), pctx(theme, `g-${theme.name}-${name}`));
      expect(html, `${theme.name}/${name} did not land on groundDefault --${theme.groundDefault}`).toContain(
        `background: var(--${theme.groundDefault})`,
      );
    }
  });

  test.each(ALL_THEMES)("$name: an explicit scene ground beats the theme default", (theme) => {
    const html = renderScene(getTreatment("cover")(), pctx(theme, `gx-${theme.name}`), { ground: "accent-3" });
    expect(html).toContain("background: var(--accent-3)");
  });

  test.each(ALL_THEMES)("$name's frameCss never force-pins the ground with !important", (theme) => {
    const decls = (theme.frameCss ?? "").replace(/\/\*[\s\S]*?\*\//g, ""); // strip prose that may discuss !important
    expect(decls).not.toMatch(/background:[^;]*!important/);
  });
});

// ------------------------------------------------------------- caption alignment ---
// Block's caption is the reference (default/left alignment); every theme must match it, so a
// theme can't silently re-diverge (future shipped `text-align: center`). Compare each theme's
// `.cap-text` alignment to block's — whatever block uses is the contract.
describe("caption alignment parity (block is the reference)", () => {
  const capTextAlign = (theme: ThemeTokens): string => {
    const css = theme.skins?.caption ?? "";
    const m = css.match(/\.cap-text\s*\{[^}]*\btext-align\s*:\s*([a-z]+)/s);
    return m ? m[1]! : "default";
  };
  const reference = capTextAlign(blockTheme);

  test.each(ALL_THEMES)("$name caption cap-text alignment matches block", (theme) => {
    expect(
      capTextAlign(theme),
      `${theme.name}'s caption cap-text alignment (${capTextAlign(theme)}) diverges from block's (${reference})`,
    ).toBe(reference);
  });
});

// ----------------------------------------------------------------- font coverage ---
// Every font family a theme names in its :root font tokens must be a face the render can
// actually load — i.e. present in the always-staged core chrome set. (Both live themes use
// only core families; a future theme shipping a non-core woff2 would need it wired into
// staging AND added to the allowance below — the failure here is the prompt to do so, which
// is exactly the point: a mis-named or unstaged family renders in a fallback face silently.)
describe("font coverage (tripwire)", () => {
  const familiesOf = (theme: ThemeTokens): string[] => {
    // token lines look like `--disp: "Inter", sans-serif;` — pull the FIRST quoted family.
    const out = new Set<string>();
    for (const m of theme.css.matchAll(/--[a-z0-9-]+:\s*"([^"]+)"/g)) out.add(m[1]!);
    return [...out];
  };

  /** The families the core set actually DECLARES — read off each `@font-face`'s own
   *  `font-family:` so the match is exact. A plain `CORE_FONTS_CSS.includes(fam)` would
   *  pass a theme naming "Inter" against a face for "Inter Tight" (or any family whose
   *  name is a substring of a declared one), i.e. green while the render silently falls
   *  back to a system face. */
  const coreFamilies = async (): Promise<Set<string>> => {
    const { CORE_FONTS_CSS } = await import("../engine/block-fonts.generated");
    return new Set([...CORE_FONTS_CSS.matchAll(/font-family:\s*"([^"]+)"/g)].map((m) => m[1]!));
  };

  test("the core set declares faces to check against (the sweep isn't vacuous)", async () => {
    expect((await coreFamilies()).size).toBeGreaterThan(0);
  });

  test.each(ALL_THEMES)("$name's content font families are covered by the core faces", async (theme) => {
    const declared = await coreFamilies();
    const missing = familiesOf(theme).filter((fam) => !declared.has(fam));
    expect(missing, `${theme.name} names font families with no @font-face in the core set: ${missing.join(", ")}`).toEqual([]);
  });
});

// ------------------------------------------------------------------ palette sanity ---
// A light check that every theme fills the 10 roles (registry.test.ts asserts order + :root
// emission + de-dupe in depth; this keeps the parity file self-contained for the invariant it
// most depends on — every skin's var(--role) resolves because the role is defined).
describe("palette completeness (tripwire)", () => {
  test.each(ALL_THEMES)("$name defines all 10 palette roles", (theme) => {
    const roles = new Set((theme.palette ?? []).map((p) => p.varName));
    const missing = PALETTE_VARS.filter((r) => !roles.has(r));
    expect(missing, `${theme.name} is missing palette role(s): ${missing.join(", ")}`).toEqual([]);
  });
});
