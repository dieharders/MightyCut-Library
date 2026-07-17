import { type TimingPreset, type TransitionName } from "../../types/transitions";
import type { AnimDescriptor } from "./anim";
/** The treatment page-entrance used when no scene transition is assigned (legacy soft fade). */
export declare const DEFAULT_ENTRANCE = "tl.from(page, { opacity: 0, duration: 0.3, ease: \"power2.out\" }, 0);";
type Opts = Record<string, number | string | boolean>;
/**
 * The whole-element entrance descriptor for a component, or `null` for `none`.
 * `factory`-style names (fadeIn/riseIn/scaleIn) carry MC-factory opts (`dur`/`dist`);
 * `from`-style names (slide/fall/wipe) carry raw GSAP vars (the `from` kind is passed
 * straight to `tl.from`). `time` is always the first VO line (the treatment offsets it
 * per child).
 */
export declare const elementIn: (name: TransitionName, target: string, timeSec?: number, extraOpts?: Opts) => AnimDescriptor | null;
/** A whole-page transition: which MC factory to call + the opts (besides `dur`) it takes. */
export type PageSpec = {
    fn: string;
    opts: Opts;
};
/** The page IN spec for a name (null for `none`) — used by the emitter AND the live preview. */
export declare const pageInFor: (name: TransitionName) => PageSpec | null;
/** The page OUT spec for a name (null for `none`). */
export declare const pageOutFor: (name: TransitionName) => PageSpec | null;
/** Page-entrance statement(s) for a treatment; `page`/`dur` are in scope. Runs from t=0
 *  for the clamped IN duration. Returns `DEFAULT_ENTRANCE` for `none`. */
export declare const sceneEntranceJs: (animIn: TransitionName, timeIn?: TimingPreset) => string;
/** Page-exit statement(s) for a treatment; anchored to scene end (`dur`), clamped so the
 *  OUT never starts before the IN finishes. Returns `""` for `none`. */
export declare const sceneExitJs: (animOut: TransitionName, timeIn?: TimingPreset, timeOut?: TimingPreset) => string;
export {};
