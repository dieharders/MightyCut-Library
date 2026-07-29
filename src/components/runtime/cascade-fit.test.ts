// The ordered cascade must FINISH inside the scene it plays in.
//
// Treatments schedule their elements into ordered slots (decorations 0..N-1, then the
// title, then the children); mc.js turns a slot into a time as `leadIn + n * slotDelay`.
// slotDelay used to derive from the CAPTION COUNT alone — the more a slide narrates, the
// tighter the gap. That is the wrong axis on its own: caption count is a proxy for scene
// LENGTH, and it runs backwards at the short end. A scene narrated by one line is the
// SHORTEST kind there is, yet it got the WIDEST gap, so a treatment with many slots
// cascaded right off the end of it.
//
// Measured on the deterministic sample (one line per scene ⇒ 3.47s scenes) before the fix:
// bar-ranking's last content reveal landed at 3.10s in every theme, and capsule's cover at
// 3.40s — after the 75% mark the stills sample, and in capsule's case 0.07s before the
// scene ended. The slide simply never showed its own headline.
//
// Slot count also grows with the DECORATION count (treatment.ts hands decorations slots
// 0..N-1 ahead of the title), so a purely ambient design choice could push a headline off
// the end of its scene. That is what makes this a floor worth pinning rather than a tuning
// preference: content timing must not be a function of how many blobs a theme draws.
//
// Driven through the REAL interpreter (assets/fx/mc.js) with REAL descriptors from the
// real build path, over every theme × every treatment, so it cannot drift from either.
import { describe, expect, test } from "bun:test";
import { TREATMENT_NAMES } from "../../types/components";
import "../registry";
import { ALL_THEMES } from "../themes/all";
import { rootContext } from "./index";
import { getTreatment } from "./registry";
import type { AnimDescriptor } from "./anim";

const MC_SRC = await Bun.file(`${import.meta.dir}/../../../assets/fx/mc.js`).text();
const loadMc = (): { applyAnims: (tl: unknown, a: unknown, c: unknown) => unknown } => {
  const win: Record<string, unknown> = {};
  new Function("window", "getComputedStyle", MC_SRC)(win, () => ({ display: "block" }));
  return win.MC as { applyAnims: (tl: unknown, a: unknown, c: unknown) => unknown };
};
const MC = loadMc();

// The deterministic sample's scene shape: LEAD_IN 0.4 + one padded VO line 2.6 + TAIL_OUT
// 0.47. The shortest scene the pipeline actually produces, and the case that broke.
const LEAD_IN = 0.4;
const DUR = 3.47;
const STILL = DUR * 0.75; // snapshotTimes() samples 75% through — the critique/preview frame

/** Every reveal's fire time, by target, through the real interpreter. */
const fireTimes = (anims: AnimDescriptor[]): { target: string; at: number }[] => {
  const els = new Map<string, object>();
  const idOf = (sel: string) => sel.replace(/^\./, "").replace(/\s*>\s*\*$/, "");
  const elFor = (sel: string) => {
    const id = idOf(sel);
    if (!els.has(id)) els.set(id, { id, getContext: () => null });
    return els.get(id)!;
  };
  const out: { target: string; at: number }[] = [];
  const tl: Record<string, unknown> = {};
  const record = (target: unknown, _v: unknown, at: number) => {
    const id = (target as { id?: string })?.id ?? (Array.isArray(target) ? "" : "");
    out.push({ target: id, at: typeof at === "number" ? at : 0 });
    return tl;
  };
  tl.from = record;
  tl.to = record;
  tl.fromTo = (t: unknown, _f: unknown, v: Record<string, unknown>, at: number) => record(t, v, at);

  MC.applyAnims(tl, anims, {
    q: elFor,
    qa: (sel: string) => [elFor(sel)],
    at: (_id: string, fb: number) => fb ?? LEAD_IN,
    atIndex: (n: number) => LEAD_IN + 0.2 * n,
    lineId: () => "",
    leadIn: LEAD_IN,
    voCount: 1,
    dur: DUR,
    page: {},
  });
  return out;
};

/** Decorations are ambient garnish (idPrefix `<compId>__d<N>`); they may keep drifting in
 *  after the copy has landed. The CONTENT is what has to be on screen. */
const isDecoration = (target: string): boolean => /__d\d+-/.test(target);

describe("the ordered cascade fits inside a short scene", () => {
  for (const theme of ALL_THEMES) {
    test.each([...TREATMENT_NAMES])(`${theme.name}/%s: all content is up before the 75% still`, (name) => {
      const inst = getTreatment(name)();
      const { anims } = inst.buildNode(rootContext(`cf-${theme.name}-${name}`, theme, { voIds: ["l1"] }));
      const content = fireTimes(anims).filter((t) => t.target && !isDecoration(t.target));
      const last = content.reduce((m, t) => Math.max(m, t.at), 0);
      expect(
        last,
        `${theme.name}/${name}: last content reveal at ${last.toFixed(2)}s, after the ${STILL.toFixed(2)}s still (scene ${DUR}s)`,
      ).toBeLessThanOrEqual(STILL);
    });
  }

  test("a scene long enough for its own cascade keeps the caption-count gap", () => {
    // The ceiling only ever TIGHTENS. With room to spare, slotDelay stays at the
    // caption-count value (0.6 default − 0.1 × voCount 1 = 0.5), so slot 4 fires at
    // leadIn + 4 × 0.5 = 2.4s — unchanged by the fit.
    const anims: AnimDescriptor[] = [
      { kind: "fadeIn", target: "a", time: { at: "slot", n: 0, plus: 0, d: 0.6 } },
      { kind: "fadeIn", target: "b", time: { at: "slot", n: 4, plus: 0, d: 0.6 } },
    ];
    const els = new Map<string, object>();
    const out: number[] = [];
    const tl: Record<string, unknown> = {};
    const rec = (_t: unknown, _v: unknown, at: number) => (out.push(at), tl);
    tl.from = rec;
    tl.to = rec;
    tl.fromTo = (_t: unknown, _f: unknown, _v: unknown, at: number) => rec(_t, _v, at);
    MC.applyAnims(tl, anims, {
      q: (s: string) => (els.get(s) ?? (els.set(s, { id: s }), els.get(s)))!,
      qa: () => [],
      at: (_i: string, fb: number) => fb,
      atIndex: (n: number) => n,
      lineId: () => "",
      leadIn: LEAD_IN,
      voCount: 1,
      dur: 20, // plenty of room
      page: {},
    });
    expect(Math.max(...out)).toBeCloseTo(LEAD_IN + 4 * 0.5, 5);
  });
});
