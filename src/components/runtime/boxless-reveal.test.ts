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
import { BACKDROPS } from "../primitives/backdrops";
import "../registry"; // populate the registry
import { ALL_THEMES } from "../themes/all";
import { REVEAL_KINDS, type AnimDescriptor } from "./anim";
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
  const els = new Map<string, { display: string; getContext: () => null }>();
  const kids = new Map<string, object[]>();
  const idOf = (sel: string) => sel.replace(/^\./, "").replace(/\s*>\s*\*$/, "");
  const elFor = (sel: string) => {
    const id = idOf(sel);
    // `getContext` makes the fake element canvas-shaped, so a canvas FX (MC.particleBg,
    // the constellation backdrop) runs its real factory here. Returning null is enough:
    // the FX skips painting but still schedules its clock tween, which is the part under
    // test — the sandbox has no canvas to paint onto.
    if (!els.has(id))
      els.set(id, {
        display: boxLess.includes(id) ? "contents" : "block",
        getContext: () => null,
      });
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

/* ------------------------------------------- one reveal per box, behaviourally --- */

// Two from-style reveals on ONE box make GSAP's immediateRender read the first's
// from-state (opacity 0) as the second's END value — the box reveals, then vanishes for
// good. component.ts dedupes at build time; mc.js guards the descriptor lists it can't
// reach (hand-authored, or scenes baked + hand-locked before that fix).
//
// Driven through the real interpreter rather than grepped out of mc.js's source: the
// kind list comes from runtime/anim.ts, so this doubles as the parity check that the TS
// REVEAL_KINDS and mc.js's mirrored literal agree.
describe("a second whole-box reveal on an already-revealed box is skipped", () => {
  const at = { at: "line", n: 0 } as const;

  test.each(REVEAL_KINDS.map((k) => [k]))("'%s' twice on one box tweens it once", (kind) => {
    const f = run(
      [
        { kind, target: "x", time: at },
        { kind, target: "x", time: at },
      ],
      [],
    );
    expect(f.tweens).toHaveLength(1);
  });

  // The guard is per resolved BOX, not per target string — which is why the matrix below
  // excludes staggerIn. A `staggerIn` always resolves to the target's CHILDREN while the
  // whole-element kinds resolve to the element itself, so on a normal root the two claim
  // different boxes and legitimately stack (a parent fading while its children cascade is
  // not the immediateRender clash). They collide only when the root is box-less and the
  // whole-element reveal is retargeted onto those same children — asserted below.
  const WHOLE_BOX = REVEAL_KINDS.filter((k) => k !== "staggerIn");

  test.each(WHOLE_BOX.flatMap((a) => WHOLE_BOX.filter((b) => b !== a).map((b) => [a, b])))(
    "a '%s' reveal blocks a following '%s' on the same box",
    (first, second) => {
      const f = run(
        [
          { kind: first, target: "x", time: at },
          { kind: second, target: "x", time: at },
        ],
        [],
      );
      expect(f.tweens).toHaveLength(1);
    },
  );

  test.each(WHOLE_BOX)("'%s' and a staggerIn are different boxes on a NORMAL root", (kind) => {
    const f = run(
      [
        { kind, target: "x", time: at },
        { kind: "staggerIn", target: "x", time: at },
      ],
      [],
    );
    expect(f.tweens).toHaveLength(2);
  });

  test.each(WHOLE_BOX)("'%s' and a staggerIn collide on a BOX-LESS root (both are the kids)", (kind) => {
    const f = run(
      [
        { kind, target: "x", time: at },
        { kind: "staggerIn", target: "x", time: at },
      ],
      ["x"],
    );
    expect(f.tweens).toHaveLength(1);
    expect(f.tweens[0].target).toBe(f.kidsOf("x"));
  });

  // The non-reveal kinds are to/fromTo tweens (or a from on a sub-part's scale alone), so
  // they legitimately STACK on a reveal and must survive it. `backdrop` is exercised in its
  // own block below. This is the invariant component.ts's build-time filter now matches:
  // it drops a same-target internal only when the internal is itself a reveal.
  test.each(["rule", "float", "countUp", "growBar"])(
    "'%s' still fires on a box that already has a reveal",
    (kind) => {
      const f = run(
        [
          { kind: "fadeIn", target: "x", time: at },
          { kind, target: "x", time: at } as AnimDescriptor,
        ],
        [],
      );
      expect(f.tweens.length, `${kind} was swallowed by the reveal guard`).toBeGreaterThan(1);
    },
  );

  test("independent boxes each keep their own reveal", () => {
    const f = run(
      [
        { kind: "riseIn", target: "x", time: at },
        { kind: "riseIn", target: "y", time: at },
      ],
      [],
    );
    expect(f.tweens).toHaveLength(2);
  });
});

/* ------------------------------------------------------- backdrop FX dispatch --- */

// A `backdrop` descriptor names its canvas FX factory by string. That name is ALLOWLISTED,
// not looked up freely on MC: a bare `MC[o.fn]` resolves an inherited Object.prototype
// member — or any other MC export — to a function, which then throws on `.addTo` and takes
// the whole scene's timeline build down with it.
describe("backdrop FX dispatch is allowlisted", () => {
  const backdrop = (fn: string): AnimDescriptor => ({
    kind: "backdrop",
    target: "bg",
    time: { at: "seconds", t: 0 },
    opts: { fn, seed: "s", colorRgb: "52,225,255" },
  });

  test("the real FX name drives a tween off the scene clock", () => {
    expect(run([backdrop("particleBg")], []).tweens).toHaveLength(1);
  });

  test.each(["constructor", "toString", "hasOwnProperty", "valueOf"])(
    "the inherited member '%s' is not callable as an FX",
    (fn) => {
      expect(() => run([backdrop(fn)], [])).not.toThrow();
      expect(run([backdrop(fn)], []).tweens).toHaveLength(0);
    },
  );

  test.each(["riseIn", "applyAnims", "seededRandom", "nope"])(
    "the non-allowlisted MC export '%s' is a no-op, not a crash",
    (fn) => {
      expect(() => run([backdrop(fn)], [])).not.toThrow();
      expect(run([backdrop(fn)], []).tweens).toHaveLength(0);
    },
  );

  // The allowlist lives in mc.js (browser JS — it can't import the registry), so a NEW
  // animated backdrop design would ship an `fn` mc.js silently refuses to run. Close that
  // loop by driving every registered design's real descriptor through the real interpreter:
  // an un-allowlisted name schedules nothing, and this fails.
  test("every registered backdrop design's FX is allowlisted in mc.js", () => {
    const theme = ALL_THEMES[0]!;
    for (const [name, design] of Object.entries(BACKDROPS)) {
      const built = design.build({
        ground: "muted-2",
        theme,
        ctx: rootContext("bd", theme, { voIds: ["l1"] }),
      });
      for (const a of built.anims) {
        if (a.kind !== "backdrop") continue;
        expect(
          run([a], []).tweens.length,
          `backdrop '${name}' names FX '${String(a.opts?.fn)}', which mc.js's BACKDROP_FX allowlist does not carry`,
        ).toBeGreaterThan(0);
      }
    }
  });
});

/* ----------------------------------------------- display lookups are memoized --- */

// getComputedStyle FLUSHES pending style, and a scene runs ONE applyAnims over every
// descriptor — so an un-memoized lookup costs a style recalc per anim, several of them for
// the same element (a picked entrance and the element's own internals share a target).
describe("display:contents is resolved once per target", () => {
  test("N descriptors on one target cost ONE getComputedStyle call", () => {
    let calls = 0;
    const win: Record<string, unknown> = {};
    const gcs = (el: { display?: string }) => {
      calls++;
      return { display: el.display ?? "block" };
    };
    new Function("window", "getComputedStyle", MC_SRC)(win, gcs);
    const mc = win.MC as { applyAnims: (tl: unknown, a: unknown, c: unknown) => unknown };

    const el = { display: "block" };
    const tl: Record<string, unknown> = {};
    tl.from = tl.to = () => tl;
    tl.fromTo = () => tl;
    mc.applyAnims(
      tl,
      [
        { kind: "fadeIn", target: "x", time: { at: "line", n: 0 } },
        { kind: "countUp", target: "x", time: { at: "line", n: 0 } },
        { kind: "float", target: "x", time: { at: "line", n: 0 } },
        { kind: "rule", target: "x", time: { at: "line", n: 0 } },
      ],
      {
        q: () => el,
        qa: () => [],
        at: (_id: string, fb: number) => fb ?? 0,
        atIndex: () => 0,
        lineId: () => "",
        leadIn: 0.4,
        voCount: 2,
        dur: 8,
        page: {},
      },
    );
    expect(calls).toBe(1);
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
