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
import { REM_GRID } from "./runtime/css";
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

// ------------------------------------------------------------- headline accent ---
// The cover/closing key word (docs/THEME-AUTHORING.md §3). The runtime splits the final word of
// a `data-accent` headline into `<span class="headline-accent">`; the EMPHASIS itself is the theme's,
// so a theme that never styles `.headline-accent` renders the beat flat while every other theme has
// it — exactly the silent look-drift this file exists to catch. Generic, so a new theme is held to
// it the moment it joins ALL_THEMES.
describe("headline accent (tripwire)", () => {
  const ACCENTED = ["cover", "closing-plate"] as const;
  // An emphasis DEVICE, not just any rule: a `.headline-accent {}` that sets margin would satisfy
  // "has a rule" while still rendering the key word identically to the rest of the line, which is
  // the exact drift being guarded. These four are the only devices §3 allows.
  const DEVICE = /\b(color|font-style|font-weight|background(-clip)?)\s*:/;

  test.each(ALL_THEMES)("$name styles the headline accent in its frameCss", (theme) => {
    const decls = (theme.frameCss ?? "").replace(/\/\*[\s\S]*?\*\//g, ""); // prose may name the class
    const rule = /h3[^{}]*\.headline-accent\b[^{}]*\{([^}]*)\}/.exec(decls);
    expect(rule, `${theme.name}: no \`h3 .headline-accent\` rule in frame.css (docs §3)`).not.toBeNull();
    expect(rule![1]!, `${theme.name}: \`.headline-accent\` rule states no emphasis device`).toMatch(DEVICE);
  });

  for (const theme of ALL_THEMES) {
    test.each(ACCENTED.map((n) => [n]))(`${theme.name}/%s emits the accent span`, (name) => {
      const html = renderScene(getTreatment(name)(), pctx(theme, `ac-${theme.name}-${name}`));
      expect(html).toContain('<span class="headline-accent">');
      expect(html).not.toContain("data-accent");
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

// ------------------------------------------------------ default decorations ---
// Decoration defaults live on the THEME (theme.decorationDefaults), keyed by treatment —
// the only place that can name shapes from a theme's own exclusive roster. That is also
// what replaced the old `suppressDefaultDecorations` flag: nothing off-theme can leak in,
// so there is nothing left to suppress. Every theme must dress the three hero frames with
// its OWN families, and an explicit (even empty) addDecorations() must still win.
//
// The map's KEY is `FrameTreatment` (runtime/types.ts), so a misspelled frame name is a
// compile error rather than a set that sits there rendering nothing — which is why the
// sweeps below police only the VALUES. They run over every DECLARED key, not just the hero
// three, so a theme that later dresses `timeline` or `chart` is held to the same rules.
const HERO_TREATMENTS = ["cover", "closing-plate", "quote"] as const;

type DressedFrame = keyof NonNullable<ThemeTokens["decorationDefaults"]>;
const dressedFrames = (theme: ThemeTokens): DressedFrame[] =>
  Object.keys(theme.decorationDefaults ?? {}) as DressedFrame[];

describe("theme decoration defaults (tripwire)", () => {
  test.each(ALL_THEMES)("$name dresses every hero frame", (theme) => {
    for (const t of HERO_TREATMENTS) {
      const declared = theme.decorationDefaults?.[t]?.length;
      expect(declared, `${theme.name}/${t} declares no default decorations`).toBeGreaterThan(0);
    }
  });

  test.each(ALL_THEMES)("$name declares only families it rosters, on every frame it dresses", (theme) => {
    const roster = new Set(theme.decorations ?? []);
    for (const t of dressedFrames(theme)) {
      const foreign = (theme.decorationDefaults?.[t] ?? []).map((d) => d.name).filter((n) => !roster.has(n));
      expect(foreign, `${theme.name}/${t} uses decoration(s) it does not roster: ${foreign.join(", ")}`).toEqual([]);
    }
  });

  test.each(ALL_THEMES)("$name renders its declared defaults on every frame it dresses", (theme) => {
    for (const t of dressedFrames(theme)) {
      const count = theme.decorationDefaults?.[t]?.length ?? 0;
      const html = renderScene(getTreatment(t)(), pctx(theme, `dd-${theme.name}-${t}`));
      for (let i = 0; i < count; i++) {
        expect(html, `${theme.name}/${t} did not render default decoration ${i}`).toContain(`__d${i}-item`);
      }
      expect(html, `${theme.name}/${t} rendered MORE decorations than it declares`).not.toContain(`__d${count}-item`);
    }
  });

  // The showcase's "delete every row" path: an explicit empty override must render bare,
  // NOT fall back to the theme's defaults (which is what `decorations?.length` used to do).
  test.each(ALL_THEMES)("$name: an explicit empty override renders a bare frame", (theme) => {
    const html = renderScene(getTreatment("cover")().addDecorations(), pctx(theme, `bare-${theme.name}`));
    expect(html, `${theme.name}: cover kept a decoration despite an empty override`).not.toContain("__d0-item");
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

// -------------------------------------------------------------------- type scale ---
// A theme's font sizes are TOKENS, the same way its colours are: `theme.ts` declares an 8-step
// scale in `sizeTokens`, `tokensCss` emits it into the same `:root`, and a skin NAMES a step
// instead of writing a number. Before this, all 270 font-sizes in the library were hand-typed
// rem literals, which is why "normalize all title font sizes" (8fb19d7) had to be a 60-file
// manual sweep — there was nothing to normalize AGAINST.
//
// The scale is PER THEME. Only the shape is shared: 8 steps, ascending, on the 0.125rem grid,
// no two closer than 1.10x. The steps themselves are the theme's own ramp — block starts at
// 1.75rem because it has no small copy, creative's display step is 12rem — and nothing here
// compares one theme's numbers to another's. That is deliberate: the cross-theme thing being
// guarded is the DISCIPLINE, not the sizes.
//
// The two top steps are ANCHORED to real frames rather than chosen freely, which is what makes
// the scale re-derivable: `3xl` IS the content-frame h3 (8fb19d7's normalisation, previously
// guarded by nothing at all) and `4xl` IS the cover + closing display size. The jump between
// them is a leap, not a step, so only the WORKING ramp carries the 1.45x cap.
const TEXT_STEPS = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "max"] as const;
const CONTENT_TREATMENTS = [
  "agenda", "bar-ranking", "chart", "comparison", "feature-cards", "stat-grid", "timeline",
] as const;
/** Where a step name sits in the ramp; -1 for an unknown/undefined name. */
const stepIndex = (s: string | undefined): number =>
  TEXT_STEPS.indexOf(s as (typeof TEXT_STEPS)[number]);

/** All six themes are on the scale, so every case below covers ALL_THEMES unconditionally. (This
 *  was a staged rollout — one theme at a time, each render-verified before the next — behind a
 *  `SCALE_PENDING` set that has now emptied and been removed.) */
const SCALED = ALL_THEMES;

/** `hud` is excluded from the scale by decision, not by oversight — it is being reworked
 *  separately. Skipped at the FILE level rather than allowlisted selector-by-selector, so that
 *  rework doesn't have to touch this test. */
const SKIP_SKINS = new Set(["hud"]);

/** Selectors allowed to keep a font-size literal instead of naming a step.
 *
 *  IT IS EMPTY, and that is the point: every font-size in every skin now names a step. It was the
 *  stat figure in all six themes — that size sits between the content headline and the display
 *  size, and nothing else in a deck wants type in that band — until `4xl` was given to it outright
 *  and the cover moved up to `max`. Keep it empty if you can; an entry here is a decision to
 *  review, not a place to park a number. */
const OFF_SCALE: Record<string, readonly string[]> = {};

/** The theme's scale, read off its emitted `:root`. `css` IS the contract — size tokens ride it
 *  exactly like --disp/--body/--mono do, so there is no ThemeTokens field to drift from. */
const sizeScale = (theme: ThemeTokens): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const m of theme.css.matchAll(/--font-size-([a-z0-9]+):\s*([\d.]+)rem;/g)) {
    out[m[1]!] = Number(m[2]);
  }
  return out;
};

/** Resolve a font-size VALUE to rem — a `var(--font-size-*)` through the scale, a literal as
 *  itself. Throws on a step the theme's `:root` doesn't define: that typo renders at the
 *  browser default (16px) and reads as a layout bug, not as a missing variable. */
const resolveFontSize = (theme: ThemeTokens, value: string): number => {
  const tok = /var\(\s*--font-size-([a-z0-9]+)\s*\)/.exec(value);
  if (tok) {
    const rem = sizeScale(theme)[tok[1]!];
    if (rem === undefined) {
      throw new Error(`${theme.name}: a skin names --font-size-${tok[1]}, which its :root does not define`);
    }
    return rem;
  }
  const lit = /([\d.]+)rem/.exec(value);
  if (!lit) throw new Error(`${theme.name}: unparseable font-size '${value}'`);
  return Number(lit[1]);
};

/** Every font-size declaration in a stylesheet as [selector, value]. Skins are FLAT — one rule
 *  per selector, one declaration per line, no nesting or at-rules (runtime/css.ts requires it so
 *  `scopeCss`'s tokenizer stays sufficient) — so a line walk is exact and needs no CSS parser.
 *  Comments are stripped FIRST: several skins discuss font sizes in prose. */
const fontSizeDecls = (css: string): Array<{ selector: string; value: string }> => {
  const out: Array<{ selector: string; value: string }> = [];
  let selector = "";
  for (const raw of css.replace(/\/\*[\s\S]*?\*\//g, "").split("\n")) {
    const line = raw.trim();
    const open = line.indexOf("{");
    if (open >= 0) selector = line.slice(0, open).trim();
    const m = /\bfont-size\s*:\s*([^;]+);/.exec(line);
    if (m) out.push({ selector, value: m[1]!.trim() });
  }
  return out;
};

/** The step a treatment's `h3` names, e.g. "3xl" — or undefined if it writes a literal. */
const h3Step = (theme: ThemeTokens, treatment: string): string | undefined => {
  const value = fontSizeDecls(theme.skins?.[treatment] ?? "").find(
    (d) => d.selector === `.${treatment} h3`,
  )?.value;
  return /var\(\s*--font-size-([a-z0-9]+)\s*\)/.exec(value ?? "")?.[1];
};

/** Every stylesheet a theme owns, named — frame + each skin, minus the ones off the scale. */
const scaledSheets = (theme: ThemeTokens): Array<{ name: string; css: string }> => [
  ...(theme.frameCss ? [{ name: "frame", css: theme.frameCss }] : []),
  ...Object.entries(theme.skins ?? {})
    .filter(([name]) => !SKIP_SKINS.has(name))
    .map(([name, css]) => ({ name, css })),
];

describe("type scale (tripwire)", () => {
  // Runs for EVERY theme, migrated or not — a theme part-way onto the scale is worse than one
  // fully off it, because the missing steps resolve to nothing and render at 16px.
  test.each(ALL_THEMES)("$name declares the whole scale", (theme) => {
    expect(
      Object.keys(sizeScale(theme)).sort(),
      `${theme.name}'s :root steps don't match the 8-step vocabulary`,
    ).toEqual([...TEXT_STEPS].sort());
  });

  test.each(SCALED)("$name's steps ascend, sit on the grid, and stay 1.10x apart", (theme) => {
    const scale = sizeScale(theme);
    const rems = TEXT_STEPS.map((s) => scale[s]!);
    const contentStep = h3Step(theme, "stat-grid");

    for (const [i, rem] of rems.entries()) {
      expect(
        Math.abs(rem / REM_GRID - Math.round(rem / REM_GRID)),
        `${theme.name}'s --font-size-${TEXT_STEPS[i]} (${rem}rem) is off the ${REM_GRID}rem grid`,
      ).toBeLessThan(1e-9);
    }

    for (let i = 1; i < rems.length; i++) {
      const ratio = rems[i]! / rems[i - 1]!;
      const pair = `${TEXT_STEPS[i - 1]}→${TEXT_STEPS[i]}`;
      expect(
        ratio,
        `${theme.name}'s ${pair} ratio is ${ratio.toFixed(3)} — a step you can't tell from its neighbour isn't a step`,
      ).toBeGreaterThanOrEqual(1.1);
      // Only the WORKING ramp is capped — the steps up to and including the content headline.
      // Above it are DISPLAY sizes, and the gaps between them are supposed to be leaps: most
      // themes leap once (headline → cover), creative twice (headline → statement → cover).
      if (i <= stepIndex(contentStep)) {
        expect(ratio, `${theme.name}'s ${pair} ratio is ${ratio.toFixed(3)} — too big a gap to be one step`).toBeLessThanOrEqual(1.45);
      }
    }
  });

  test.each(SCALED)("$name writes no font-size literal outside its declared display sizes", (theme) => {
    const allowed = new Set(OFF_SCALE[theme.name] ?? []);
    const strays: string[] = [];
    for (const { name, css } of scaledSheets(theme)) {
      for (const { selector, value } of fontSizeDecls(css)) {
        if (value.includes("var(--font-size-")) continue;
        if (allowed.has(selector)) continue;
        strays.push(`${name}.css → ${selector} { font-size: ${value} }`);
      }
    }
    expect(strays, `${theme.name} writes a font-size number instead of naming a step:\n  ${strays.join("\n  ")}`).toEqual([]);
  });

  test.each(SCALED)("$name uses every step it declares", (theme) => {
    const used = new Set<string>();
    for (const { css } of scaledSheets(theme)) {
      for (const m of css.matchAll(/var\(\s*--font-size-([a-z0-9]+)\s*\)/g)) used.add(m[1]!);
    }
    const dead = TEXT_STEPS.filter((s) => !used.has(s));
    expect(dead, `${theme.name} declares --font-size-${dead.join(", --font-size-")} but no skin names it`).toEqual([]);
  });

  // The normalisations the scale is anchored to. Nothing guarded either before: 8fb19d7 put all
  // seven content headlines on one size by hand, and a later edit could quietly undo it.
  //
  // What's asserted is the RELATIONSHIP, not a step name. Which name the content headline lands on
  // is a per-theme consequence of how many display sizes that theme needs — five themes spend two
  // slots up there and land on `3xl`, creative spends three and lands on `2xl`. Pinning the name
  // would forbid that without protecting anything.
  test.each(SCALED)("$name anchors its headlines to the scale", (theme) => {
    const contentStep = h3Step(theme, "stat-grid");
    expect(contentStep, `${theme.name}'s .stat-grid h3 must name a step`).toBeDefined();
    if (!contentStep) return; // unreachable — the assertion above throws; this narrows the type

    // 1. All seven content treatments share ONE headline size. This is 8fb19d7's normalisation.
    for (const t of CONTENT_TREATMENTS) {
      expect(h3Step(theme, t), `${theme.name}'s .${t} h3 diverges from the shared content headline`).toBe(
        contentStep,
      );
    }
    // 2. The cover takes the TOP step, which exists for it alone — `max` is the one size in the
    //    scale sized against the full frame rather than against a component or a plate.
    expect(h3Step(theme, "cover"), `${theme.name}'s .cover h3 must be --font-size-max`).toBe("max");
    // 3. The closing plate is a display frame too: it names a step, and one above the headline.
    //    Most themes share the cover's; creative's measure is narrower, so it takes its own.
    const closing = h3Step(theme, "closing-plate");
    expect(closing, `${theme.name}'s .closing-plate h3 must name a step`).toBeDefined();
    expect(
      stepIndex(closing),
      `${theme.name}'s .closing-plate h3 (${closing}) must sit above the content headline (${contentStep})`,
    ).toBeGreaterThan(stepIndex(contentStep));
  });
});

// ------------------------------------------------------------------ caption scale ---
// A caption is ROOT CHROME: the consumer stamps one box per VO line into a rail laid OVER
// live scene content (see block/caption.css for the full rule). It is therefore sized
// against the rail, not against the treatment it covers. Every theme once carried a
// 3.625rem (58px) "cross-theme convention" reasoned from the caption card in isolation; in
// a real deck those boxes covered the comparison table and clipped headlines.
//
// A BAND, not exact values — per-theme tuning inside the band is a design call, re-inflating
// past it is the regression. Block is also the reference for spread: no theme may drift far
// from it, so one theme can't quietly reintroduce its own scale.
describe("caption scale (tripwire)", () => {
  const MIN_REM = 1.4;
  const MAX_REM = 2.0;
  // Resolved, not read literally: a skin names a step now (see "type scale" above), so the band
  // has to be measured on what the step RESOLVES to. Matching `[^;]+` rather than `[\d.]+rem`
  // is what keeps this working for a tokenized skin and a not-yet-migrated one alike.
  const capTextRem = (theme: ThemeTokens): number => {
    const css = theme.skins?.caption ?? "";
    const m = css.match(/\.cap-text\s*\{[^}]*\bfont-size\s*:\s*([^;]+);/s);
    if (!m) throw new Error(`${theme.name}'s caption skin declares no .cap-text font-size`);
    return resolveFontSize(theme, m[1]!.trim());
  };
  const reference = capTextRem(blockTheme);

  test.each(ALL_THEMES)("$name's caption sits in the root-chrome band", (theme) => {
    const rem = capTextRem(theme);
    expect(rem, `${theme.name}'s .cap-text is ${rem}rem, outside ${MIN_REM}–${MAX_REM}rem`).toBeGreaterThanOrEqual(
      MIN_REM,
    );
    expect(rem).toBeLessThanOrEqual(MAX_REM);
  });

  test.each(ALL_THEMES)("$name's caption stays within 25% of block's", (theme) => {
    const rem = capTextRem(theme);
    expect(
      Math.abs(rem - reference) / reference,
      `${theme.name}'s .cap-text (${rem}rem) diverges from block's (${reference}rem) by more than 25%`,
    ).toBeLessThanOrEqual(0.25);
  });
});

// ----------------------------------------------------------------- font coverage ---
// Every font family a theme names in its :root font tokens must be a face the browser can
// actually load. A family with no @font-face anywhere renders in a silent system fallback —
// green tests, wrong deck — so this sweep pins each theme's names against the faces that are
// genuinely inlined into the engine.
//
// TWO SOURCES OF DECLARED FACES, and the second one is an EXTENSION, not a loosening:
//   • CORE — assets/fonts.css, inlined into block-fonts.generated.ts and injected by
//     core-fonts.ts for EVERY theme payload. Space Grotesk / Inter / JetBrains Mono /
//     Archivo Black.
//   • THAT THEME'S OWN ADD-ON — assets/fonts/<theme>-fonts.css, inlined into
//     <theme>-fonts.generated.ts and injected by register-<theme>.ts ALONE (capsule →
//     Bodoni Moda, which is deliberately kept out of core so block/future decks don't
//     download a serif they never use).
//
// Why this is still as strict as the core-only check it replaces:
//   1. The add-on set is read from the REAL GENERATED MODULE — the same bytes the browser
//      injects — not from a hardcoded allowlist of family names. A name can only be credited
//      if an @font-face for it is actually inlined into the engine bundle. Allowlisting the
//      string "Bodoni Moda" would have been the loosening; reading the payload is not.
//   2. The union is PER THEME, not global. Capsule's Bodoni does not become legal for block:
//      each theme is checked against core ∪ its own add-on, so a theme naming a family that
//      only some OTHER theme ships still fails.
//   3. Both sides are parsed the same exact way (each @font-face's own `font-family:`), so a
//      theme naming "Inter" can't pass against a declared "Inter Tight" — substring matching
//      would be green while the render fell back to a system face.
//   4. A typo'd ADDON_FONT_CSS key can't hide a hole: the theme it was meant to cover simply
//      isn't credited with its add-on and fails the main sweep below.
//   5. The second test keeps the extension from going vacuous — an add-on module that
//      inlined nothing (a broken generator run, a renamed source stylesheet) would otherwise
//      silently degrade a theme back to core-only coverage AND ship a face-less <style>.
// The one thing this file cannot see is whether register-<theme>.ts remembers to inject the
// module; that wiring is one line and lives in engine/register-<theme>.ts next to the import.
describe("font coverage (tripwire)", () => {
  const familiesOf = (theme: ThemeTokens): string[] => {
    // token lines look like `--disp: "Inter", sans-serif;` — pull the FIRST quoted family.
    const out = new Set<string>();
    for (const m of theme.css.matchAll(/--[a-z0-9-]+:\s*"([^"]+)"/g)) out.add(m[1]!);
    return [...out];
  };

  /** The families a stylesheet actually DECLARES — read off each `@font-face`'s own
   *  `font-family:` so the match is exact. A plain `CSS.includes(fam)` would pass a theme
   *  naming "Inter" against a face for "Inter Tight" (or any family whose name is a
   *  substring of a declared one), i.e. green while the render silently falls back to a
   *  system face. Used for BOTH the core set and the per-theme add-ons, so the two sides
   *  are held to identical standards. */
  const facesIn = (css: string): Set<string> =>
    new Set([...css.matchAll(/font-family:\s*"([^"]+)"/g)].map((m) => m[1]!));

  const coreFamilies = async (): Promise<Set<string>> => {
    const { CORE_FONTS_CSS } = await import("../engine/block-fonts.generated");
    return facesIn(CORE_FONTS_CSS);
  };

  /** theme name → its generated add-on module's CSS (the payload register-<theme>.ts
   *  injects). Themes absent from this map have no add-on and are checked against core
   *  alone, exactly as before. Add a row here in the same change that adds the ADDONS row
   *  in scripts/gen-inline-fonts.mjs and the inject call in register-<theme>.ts. */
  const ADDON_FONT_CSS: Record<string, () => Promise<string>> = {
    capsule: async () => (await import("../engine/capsule-fonts.generated")).CAPSULE_FONTS_CSS,
    professional: async () => (await import("../engine/professional-fonts.generated")).PROFESSIONAL_FONTS_CSS,
    standard: async () => (await import("../engine/standard-fonts.generated")).STANDARD_FONTS_CSS,
  };

  const addonFamilies = async (themeName: string): Promise<Set<string>> => {
    const load = ADDON_FONT_CSS[themeName];
    return load ? facesIn(await load()) : new Set<string>();
  };

  test("the core set declares faces to check against (the sweep isn't vacuous)", async () => {
    expect((await coreFamilies()).size).toBeGreaterThan(0);
  });

  test.each(Object.keys(ADDON_FONT_CSS).map((n) => [n]))(
    "%s's add-on font module declares at least one face (the extension isn't vacuous)",
    async (name) => {
      const faces = await addonFamilies(name);
      expect(
        faces.size,
        `${name} has an add-on font module but it declares no @font-face — re-run \`pnpm gen:fonts\` and check assets/fonts/${name}-fonts.css`,
      ).toBeGreaterThan(0);
    },
  );

  test.each(ALL_THEMES)("$name's content font families are covered by core + its own add-on faces", async (theme) => {
    const declared = new Set([...(await coreFamilies()), ...(await addonFamilies(theme.name))]);
    const missing = familiesOf(theme).filter((fam) => !declared.has(fam));
    expect(
      missing,
      `${theme.name} names font families with no @font-face in the core set or in ${theme.name}'s add-on module: ${missing.join(", ")} — inline the woff2 (scripts/gen-inline-fonts.mjs ADDONS) and inject it from register-${theme.name}.ts`,
    ).toEqual([]);
  });

  // The sweeps above prove a theme's `:root` families are really LOADED. This one proves its
  // SHOWCASE PROSE describes the faces it loads. A theme's `rules` and `typography[].spec` are
  // user-visible copy rendered in the theme browser, and they are the easiest thing to leave
  // behind when a port swaps a face late (professional shipped naming Space Grotesk + Inter
  // while loading Libre Baskerville + IBM Plex Sans). Every font name a theme WRITES DOWN must
  // be one it actually declares — checked against the union of ALL themes' declared families,
  // so this only fires on a name that is a real font in this library and demonstrably the wrong
  // one for that theme. Prose mentioning no font at all is fine.
  test.each(ALL_THEMES)("$name's showcase prose names only fonts it loads", async (theme) => {
    const mine = new Set(familiesOf(theme));
    const anyThemeFamilies = new Set<string>();
    for (const t of ALL_THEMES) for (const f of familiesOf(t)) anyThemeFamilies.add(f);
    const prose = [
      ...(theme.rules?.do ?? []),
      ...(theme.rules?.dont ?? []),
      ...(theme.typography ?? []).map((t) => t.spec),
      theme.description,
    ].join("   ");
    const wrong = [...anyThemeFamilies].filter((fam) => !mine.has(fam) && prose.includes(fam));
    expect(
      wrong,
      `${theme.name}'s rules/typography/description name font families it does not load: ${wrong.join(", ")} — it loads ${[...mine].join(", ")}. Update the copy (it renders in the theme browser).`,
    ).toEqual([]);
  });
});

// ------------------------------------------------------- plate / ground separation ---
// A treatment's child component is usually a PLATE — a filled box (block's card, creative's stat)
// sitting on the treatment's ground. If the plate's fill role and the ground role resolve to the
// SAME hex, the plate stops being an object: it renders as its border alone, and on a theme whose
// plates have no border it vanishes outright. Every existing sweep passes in that state, because
// the scene still builds, still has all ten roles, and still names a registered ground — which is
// exactly how creative shipped a palette edit that set muted-1 (every plate's fill) to muted-2's
// hex (the timeline + agenda ground) and flattened both frames plus the whole showcase grid.
//
// The assertion is deliberately EXACT-MATCH, not a contrast ratio. Near-tone plates are a real and
// intentional idiom here — block fills a white card on a #FFFDF5 oat canvas (1.02:1) and capsule
// does the same, letting the ink border do the separating — so a ratio threshold would either fail
// those legitimately or be set so low it caught nothing. "The two roles are literally the same
// colour" is unambiguous breakage and is what this pins.
describe("plate / ground separation (tripwire)", () => {
  /** The `background: var(--role)` of a component's own ROOT rule, if it fills one. */
  const plateRole = (css: string, cls: string): string | undefined => {
    const i = css.indexOf(`.${cls} {`);
    if (i < 0) return undefined;
    const body = css.slice(i, css.indexOf("}", i));
    return body.match(/background:\s*var\(--([a-z0-9-]+)\)/)?.[1];
  };

  test.each(ALL_THEMES)("$name: no child plate is the same colour as the ground it sits on", (theme) => {
    const hexOf = (role: string) =>
      theme.palette?.find((p) => p.varName === role)?.hex.toLowerCase();
    const clashes: string[] = [];
    for (const tname of TREATMENT_NAMES) {
      const factory = getTreatment(tname);
      const child = factory.childComponent;
      if (!child) continue; // childless treatment (cover/quote/closing) has no plate
      const ground = String(theme.groundDefault ?? factory().ground);
      const fill = plateRole(theme.skins?.[child] ?? "", child);
      if (!fill) continue; // an unfilled child (a ruled agenda row, a display:contents ledger row)
      const [gh, fh] = [hexOf(ground), hexOf(fill)];
      if (gh && fh && gh === fh) {
        clashes.push(`${tname}: .${child} fills --${fill} (${fh}) on ground --${ground} (${gh})`);
      }
    }
    expect(
      clashes,
      `${theme.name}: plate and ground resolve to the same colour, so the plate renders as its border alone — ${clashes.join("; ")}`,
    ).toEqual([]);
  });

  // The showcase Components grid renders every leaf on `previewBg`. Same failure, different
  // surface: a plate whose fill IS the preview surface reads as a missing background in the
  // theme browser even when the deck itself is fine.
  test.each(ALL_THEMES)("$name: no plate fill matches previewBg (the showcase grid surface)", (theme) => {
    const pv = theme.previewBg?.toLowerCase();
    if (!pv) return;
    const bad = ["card", "stat", "step"].filter((c) => {
      const fill = plateRole(theme.skins?.[c] ?? "", c);
      const fh = fill && theme.palette?.find((p) => p.varName === fill)?.hex.toLowerCase();
      return !!fh && fh === pv;
    });
    expect(
      bad,
      `${theme.name}: ${bad.join(", ")} fill exactly previewBg (${pv}) — they render backgroundless in the Components grid`,
    ).toEqual([]);
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
