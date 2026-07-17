// Transition catalog — the runtime half of the shared transition vocabulary
// (names + timing presets live in ../../types/transitions). One name drives three
// surfaces, all from the SAME data so they can't drift:
//   - elementIn(): the component whole-element entrance, as an AnimDescriptor fed
//     through the same MC.applyAnims interpreter as every other reveal.
//   - sceneEntranceJs()/sceneExitJs(): the treatment whole-PAGE transition, emitted
//     as GSAP statement strings that run inside the sub-composition <script> where
//     the scene duration `dur` is in scope (so the OUT can anchor to scene end).
//   - pageInFor()/pageOutFor(): the same page-transition spec as DATA (MC factory +
//     opts), so the showcase/editor can REPLAY a page transition live on a preview
//     timeline without re-deriving the mapping.
//
// Byte-preservation: for the DEFAULT (unset timing, per-element opts) each element's
// entrance descriptor reproduces its pre-transition anim.ts descriptor EXACTLY —
// `elementIn` omits the `opts` key when empty and omits `dur` unless a timing is set.
import { TIMING_SECONDS, type TimingPreset, type TransitionName } from "../../types/transitions";
import type { AnimDescriptor } from "./anim";

/** The treatment page-entrance used when no scene transition is assigned (legacy soft fade). */
export const DEFAULT_ENTRANCE = 'tl.from(page, { opacity: 0, duration: 0.3, ease: "power2.out" }, 0);';

/** Component slide/fall travel (px) and default duration when a transition is assigned. */
const ELEM_DIST = 120;
const ELEM_DUR = 0.6;
/** Page (whole-scene) slide travel (px). */
const PAGE_SLIDE = 140;

type Opts = Record<string, number | string | boolean>;

/**
 * The whole-element entrance descriptor for a component, or `null` for `none`.
 * `factory`-style names (fadeIn/riseIn/scaleIn) carry MC-factory opts (`dur`/`dist`);
 * `from`-style names (slide/fall/wipe) carry raw GSAP vars (the `from` kind is passed
 * straight to `tl.from`). `time` is always the first VO line (the treatment offsets it
 * per child).
 */
export const elementIn = (
  name: TransitionName,
  target: string,
  timeSec?: number,
  extraOpts?: Opts,
): AnimDescriptor | null => {
  const time = { at: "line", n: 0 } as const;
  const mk = (kind: AnimDescriptor["kind"], opts: Opts): AnimDescriptor => {
    const o = Object.keys(opts).length ? opts : undefined;
    return o ? { kind, target, time, opts: o } : { kind, target, time };
  };
  const dur: Opts = timeSec != null ? { dur: timeSec } : {}; // MC-factory duration key
  const gsapDur = timeSec ?? ELEM_DUR; // raw gsap `duration`
  switch (name) {
    case "none":
      return null;
    case "fade":
      return mk("fadeIn", { ...(extraOpts ?? {}), ...dur });
    case "rise":
      return mk("riseIn", { ...(extraOpts ?? {}), ...dur });
    case "scale":
      return mk("scaleIn", { ...(extraOpts ?? {}), ...dur });
    case "pop":
      return mk("scaleIn", { from: 0.8, ease: "back.out(2)", ...(extraOpts ?? {}), ...dur });
    case "fall":
      return mk("from", { y: -ELEM_DIST, opacity: 0, duration: gsapDur, ease: "power3.out" });
    case "slide-left":
      return mk("from", { x: -ELEM_DIST, opacity: 0, duration: gsapDur, ease: "power3.out" });
    case "slide-right":
      return mk("from", { x: ELEM_DIST, opacity: 0, duration: gsapDur, ease: "power3.out" });
    case "slide-up":
      return mk("from", { y: ELEM_DIST, opacity: 0, duration: gsapDur, ease: "power3.out" });
    case "slide-down":
      return mk("from", { y: -ELEM_DIST, opacity: 0, duration: gsapDur, ease: "power3.out" });
    case "wipe":
      return mk("from", { clipPath: "inset(0 100% 0 0)", duration: gsapDur, ease: "power2.inOut" });
  }
};

/** A whole-page transition: which MC factory to call + the opts (besides `dur`) it takes. */
export type PageSpec = { fn: string; opts: Opts };

const PAGE_IN: Partial<Record<TransitionName, PageSpec>> = {
  fade: { fn: "fadeIn", opts: {} },
  rise: { fn: "riseIn", opts: { dist: 40 } },
  fall: { fn: "fallIn", opts: { dist: 40 } },
  scale: { fn: "scaleIn", opts: {} },
  pop: { fn: "scaleIn", opts: { from: 0.8, ease: "back.out(2)" } },
  "slide-left": { fn: "slideIn", opts: { x: -PAGE_SLIDE } },
  "slide-right": { fn: "slideIn", opts: { x: PAGE_SLIDE } },
  "slide-up": { fn: "slideIn", opts: { y: PAGE_SLIDE } },
  "slide-down": { fn: "slideIn", opts: { y: -PAGE_SLIDE } },
  wipe: { fn: "wipeIn", opts: {} },
};

const PAGE_OUT: Partial<Record<TransitionName, PageSpec>> = {
  fade: { fn: "fadeOut", opts: {} },
  rise: { fn: "riseOut", opts: { dist: 40 } },
  fall: { fn: "fallOut", opts: { dist: 40 } },
  scale: { fn: "scaleOut", opts: {} },
  pop: { fn: "scaleOut", opts: {} },
  "slide-left": { fn: "slideOut", opts: { x: -PAGE_SLIDE } },
  "slide-right": { fn: "slideOut", opts: { x: PAGE_SLIDE } },
  "slide-up": { fn: "slideOut", opts: { y: -PAGE_SLIDE } },
  "slide-down": { fn: "slideOut", opts: { y: PAGE_SLIDE } },
  wipe: { fn: "wipeOut", opts: {} },
};

/** The page IN spec for a name (null for `none`) — used by the emitter AND the live preview. */
export const pageInFor = (name: TransitionName): PageSpec | null => PAGE_IN[name] ?? null;
/** The page OUT spec for a name (null for `none`). */
export const pageOutFor = (name: TransitionName): PageSpec | null => PAGE_OUT[name] ?? null;

/** Serialize page-transition opts to the inline `, key: value` tail (strings quoted). */
const optStr = (o: Opts): string =>
  Object.entries(o)
    .map(([k, v]) => `, ${k}: ${typeof v === "string" ? JSON.stringify(v) : v}`)
    .join("");

/** Page-entrance statement(s) for a treatment; `page`/`dur` are in scope. Runs from t=0
 *  for the clamped IN duration. Returns `DEFAULT_ENTRANCE` for `none`. */
export const sceneEntranceJs = (animIn: TransitionName, timeIn: TimingPreset = "short"): string => {
  const p = pageInFor(animIn);
  if (!p) return DEFAULT_ENTRANCE;
  const tIn = TIMING_SECONDS[timeIn];
  return `var _din = Math.min(${tIn}, dur);\n          MC.${p.fn}(tl, page, 0, { dur: _din${optStr(p.opts)} });`;
};

/** Page-exit statement(s) for a treatment; anchored to scene end (`dur`), clamped so the
 *  OUT never starts before the IN finishes. Returns `""` for `none`. */
export const sceneExitJs = (
  animOut: TransitionName,
  timeIn: TimingPreset = "short",
  timeOut: TimingPreset = "short",
): string => {
  const p = pageOutFor(animOut);
  if (!p) return "";
  const tIn = TIMING_SECONDS[timeIn];
  const tOut = TIMING_SECONDS[timeOut];
  return `var _dout = Math.min(${tOut}, Math.max(0, dur - Math.min(${tIn}, dur)));\n          MC.${p.fn}(tl, page, dur - _dout, { dur: _dout${optStr(p.opts)} });`;
};
