// Determinism guard for emitted animation JS — mirrors the frame-builder scrub
// (src/pipeline/frame-builder.ts). HyperFrames renders by SEEKING a paused GSAP
// timeline, so any wall-clock / non-deterministic control flow would capture
// different frames on re-render. String literals are stripped first so a hostile
// param value (e.g. suffix: "setInterval") can't trip the check.

const BANNED = [
  "Math.random",
  "Date.now",
  "setTimeout",
  "setInterval",
  "requestAnimationFrame",
  "repeat: -1",
  "repeat:-1",
];

const STRIP_STRINGS = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;

/** Throw if `js` contains a banned non-deterministic token (outside string literals). */
export const scrubDeterminism = (js: string, where = "component"): void => {
  const scrubbed = js.replace(STRIP_STRINGS, '""');
  for (const banned of BANNED) {
    if (scrubbed.includes(banned)) {
      throw new Error(`determinism scrub (${where}): emitted JS contains '${banned}'`);
    }
  }
};
