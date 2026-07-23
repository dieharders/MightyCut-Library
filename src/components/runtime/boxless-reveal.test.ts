// Box-less (display:contents) roots and their reveals — theme-agnostic.
//
// A component whose root is `display: contents` generates NO box of its own, so a
// whole-element reveal aimed at it must be RETARGETED onto its children (mc.js's
// applyAnims does this at runtime, because whether a root is box-less is the active
// THEME's choice). Two invariants follow, and both are per-BEHAVIOUR, not per-theme:
//
//   1. the reveal lands on the children, not the box-less root (else: invisible), and
//   2. it CASCADES across them — one reveal fanned onto N boxes staggers.
//
// (2) is the regression this file was added for: such a component's default reveal is a
// `staggerIn` over exactly those children, and the build-time one-reveal-per-box dedupe
// DROPS it when a transition is picked — so assigning any transition (even the same one)
// used to flatten the ledger Row's left→right cascade into a lockstep pop.
//
// mc.js is browser JS and this runner has no DOM, so it is loaded into a sandbox with a
// fake `window` + `getComputedStyle` and a timeline that RECORDS tweens: the real
// interpreter, driven by real descriptors from the real build path, over every theme.
import { describe, expect, test } from "bun:test";
import { THEMES } from "../../engine/load-theme";
import { COMPONENT_NAMES, TREATMENT_NAMES } from "../../types/components";
import { TRANSITION_NAMES, type TransitionName } from "../../types/transitions";
import "../registry"; // populate the registry
import { ALL_THEMES } from "../themes/all";
import type { AnimDescriptor } from "./anim";
import { rootContext } from "./index";
import { hasComponent, getComponent, hasTreatment, getTreatment } from "./registry";
import { elementIn } from "./transitions";
import type { ThemeTokens } from "./types";

/* ------------------------------------------------------------- mc sandbox --- */

type Tween = { target: unknown; vars: Record<string, unknown>; at: number };
type Fake = { tweens: Tween[]; kidsOf: (target: string) => object[] };

const MC_SRC = await Bun.file(`${import.meta.dir}/../../../assets/fx/mc.js`).text();

/** mc.js is an IIFE ending in `window.MC = MC` — hand it a window plus a computed-style
 *  shim that reports each fake element's `display`. */
const loadMc = () => {
  const win: Record<string, unknown> = {};
  const getComputedStyle = (el: { display?: string }) => ({ display: el.display ?? "block" });
  new Function("window", "getComputedStyle", MC_SRC)(win, getComputedStyle);
  return win.MC as { applyAnims: (tl: unknown, anims: unknown, ctx: unknown) => unknown };
};

const MC = loadMc();

/**
 * Run descriptors through the REAL interpreter against fake elements: every target
 * resolves to its own element with `childCount` children, and the targets named in
 * `boxLess` report `display: contents` (so applyAnims must retarget those).
 */
const run = (anims: AnimDescriptor[], boxLess: string[], childCount = 3): Fake => {
  const els = new Map<string, { display: string }>();
  const kids = new Map<string, object[]>();
  const idOf = (sel: string) => sel.replace(/^\./, "").replace(/\s*>\s*\*$/, "");
  const elFor = (sel: string) => {
    const id = idOf(sel);
    if (!els.has(id)) els.set(id, { display: boxLess.includes(id) ? "contents" : "block" });
    return els.get(id)!;
  };
  const kidsFor = (sel: string) => {
    const id = idOf(sel);
    if (!kids.has(id)) kids.set(id, Array.from({ length: childCount }, (_, i) => ({ id, i })));
    return kids.get(id)!;
  };

  const tweens: Tween[] = [];
  const tl: Record<string, unknown> = {};
  const record = (target: unknown, vars: Record<string, unknown>, at: number) => {
    tweens.push({ target, vars, at });
    return tl;
  };
  tl.from = record;
  tl.to = record;
  tl.fromTo = (t: unknown, _from: unknown, vars: Record<string, unknown>, at: number) =>
    record(t, vars, at);

  MC.applyAnims(tl, anims, {
    q: elFor,
    qa: kidsFor,
    at: (_id: string, fb: number) => fb ?? 0,
    atIndex: (n: number) => 0.4 + 0.2 * n,
    lineId: () => "",
    leadIn: 0.4,
    voCount: 2,
    dur: 8,
    page: {},
  });
  return { tweens, kidsOf: (target: string) => kidsFor(target) };
};

const PICKABLE = TRANSITION_NAMES.filter((n) => n !== "none");

/* --------------------------------------- (1)+(2), kind by kind, theme-free --- */

describe("a whole-element entrance on a box-less root (every catalog transition)", () => {
  test.each(PICKABLE)("'%s' tweens the CHILDREN, staggered", (name: TransitionName) => {
    const f = run([elementIn(name, "x")!], ["x"]);
    expect(f.tweens).toHaveLength(1);
    expect(f.tweens[0].target, `'${name}' still tweens the box-less root`).toBe(f.kidsOf("x"));
    expect(f.tweens[0].vars.stagger, `'${name}' fires the children in lockstep`).toBeTruthy();
  });

  test.each(PICKABLE)("'%s' on a normal root is untouched (one box, no stagger)", (name) => {
    const f = run([elementIn(name, "x")!], []);
    expect(f.tweens).toHaveLength(1);
    expect(f.tweens[0].target).not.toBe(f.kidsOf("x"));
    expect(f.tweens[0].vars.stagger).toBeUndefined();
  });

  test("a box-less root with ONE child is not staggered (nothing to cascade)", () => {
    const f = run([elementIn("rise", "x")!], ["x"], 1);
    expect(f.tweens[0].vars.stagger).toBeUndefined();
  });

  test("a descriptor's own `each` wins over the default fan-out stagger", () => {
    const f = run(
      [{ kind: "riseIn", target: "x", time: { at: "line", n: 0 }, opts: { each: 0.4 } }],
      ["x"],
    );
    expect(f.tweens[0].vars.stagger).toMatchObject({ each: 0.4 });
  });

  test("the descriptor's own opts are never mutated (the showcase replays them)", () => {
    const d: AnimDescriptor = { kind: "riseIn", target: "x", time: { at: "line", n: 0 } };
    run([d], ["x"]);
    expect(d.opts).toBeUndefined();
  });
});

/* -------------------------------- (2) end-to-end, over EVERY theme + element --- */

const PREFIX = "s01";

/** The scoped anim class stamped on an element's ROOT (`class="row s01-item"`), i.e. the
 *  target a whole-element reveal aims at — or null when the root carries no data-anim. */
const rootTarget = (html: string): string | null => {
  const cls = /^<[a-z][^>]*\sclass="([^"]*)"/i.exec(html)?.[1] ?? "";
  return cls.split(/\s+/).find((c) => c.startsWith(`${PREFIX}-`)) ?? null;
};

/** Does `theme` make this element's ROOT box-less? Read off the resolved skin the build
 *  returns, so it follows whichever theme owns the element's look. */
const isBoxLess = (css: string, name: string): boolean =>
  new RegExp(`\\.${name}\\b[^{]*\\{[^}]*display:\\s*contents`).test(css);

type Case = { theme: string; label: string; anims: AnimDescriptor[]; target: string };

/** Build every registered element under `theme` — with its DEFAULT reveal and with each
 *  pickable transition — keeping the ones whose root that theme made box-less. */
const boxLessCases = (theme: ThemeTokens): Case[] => {
  const out: Case[] = [];
  for (const name of [...COMPONENT_NAMES, ...TREATMENT_NAMES]) {
    for (const tr of [null, ...PICKABLE] as (TransitionName | null)[]) {
      const inst = hasComponent(name)
        ? getComponent(name)()
        : hasTreatment(name)
          ? getTreatment(name)()
          : null;
      if (!inst) continue;
      if (tr && inst.kind === "component") inst.withTransition({ animIn: tr });
      else if (tr) continue; // treatments carry a PAGE transition, not an element entrance
      const built = inst.build(rootContext(PREFIX, theme, { voIds: ["l1", "l2", "l3"] }));
      const target = rootTarget(built.html);
      if (!target || !isBoxLess(built.css, name)) continue;
      out.push({
        theme: theme.name,
        label: `${name} ${tr ? `+ ${tr}` : "(default)"}`,
        anims: built.anims,
        target,
      });
    }
  }
  return out;
};

const BOX_LESS = ALL_THEMES.flatMap(boxLessCases);

describe("every box-less element, in every theme, cascades", () => {
  // The sweep is only as generic as ALL_THEMES — pin it to the themes the engine can
  // actually load, so converting a theme without listing it fails here rather than
  // quietly leaving it out of every theme-generic sweep.
  test("ALL_THEMES covers every theme the engine loads", () => {
    expect([...ALL_THEMES.map((t) => t.name)].sort()).toEqual([...THEMES].sort());
  });

  // If nothing is box-less anywhere the sweep passes vacuously — fail loudly instead.
  test("the sweep found box-less roots to check, in every theme", () => {
    expect(BOX_LESS.length).toBeGreaterThan(0);
    expect(new Set(BOX_LESS.map((c) => c.theme)).size).toBe(ALL_THEMES.length);
  });

  test.each(BOX_LESS.map((c) => [`${c.theme}: ${c.label}`, c] as const))(
    "%s reveals its children staggered",
    (_label, c) => {
      const f = run(c.anims, [c.target]);
      const kids = f.kidsOf(c.target);
      const reveals = f.tweens.filter((t) => t.target === kids);
      expect(reveals.length, "the box-less root's children never reveal").toBeGreaterThan(0);
      for (const r of reveals) expect(r.vars.stagger, "the children reveal in lockstep").toBeTruthy();
    },
  );
});
