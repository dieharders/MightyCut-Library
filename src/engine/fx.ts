// FX bootstrap — the deterministic animation runtime (gsap + window.MC) is
// theme-agnostic and loads ONCE at engine startup, kept as globals to match
// mc.js's existing contract (window.gsap / window.MC), exactly as the render
// pipeline consumes it. The two files are inlined from the shared assets so the
// engine is self-contained; injecting gsap first (mc.js tweens through it).
import gsapSrc from "../../assets/fx/gsap.min.js?raw";
import mcSrc from "../../assets/fx/mc.js?raw";

let booted = false;

const inject = (src: string): void => {
  const s = document.createElement("script");
  s.textContent = src;
  document.head.appendChild(s);
};

/** Inject gsap + mc.js as globals once. Safe to call before every mountPreview. */
export const bootstrapFx = (): void => {
  if (booted || typeof document === "undefined") return;
  booted = true;
  const w = window as unknown as { gsap?: unknown; MC?: unknown };
  if (!w.gsap) inject(gsapSrc);
  if (!w.MC) inject(mcSrc);
};
