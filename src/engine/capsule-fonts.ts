// Capsule's ADD-ON font injection — the per-theme counterpart to core-fonts.ts.
//
// Capsule is the first theme whose content faces are not a subset of the core chrome set:
// its display face is Bodoni Moda (--disp), which fonts.css does not declare. Rather than
// widening CORE_FONTS_CSS (which every theme payload injects, so block/future decks would
// download ~130 KB of a serif they never use), the Bodoni faces are inlined into their own
// generated module and injected here — imported ONLY by register-capsule.ts, so Vite keeps
// the payload inside capsule's lazy theme chunk.
//
// Same contract as injectCoreFonts: its OWN guard flag (so loading capsule twice, or
// alongside block/future, appends the faces exactly once), its OWN style.dataset marker
// (so the two sheets are distinguishable in devtools and never overwrite each other), and a
// no-op when there is no document (SSR / the harness's Bun-side compose path, which never
// needs injected faces — the render staging copies capsule-fonts.css into the project).
// Document-level, like core, so Shadow DOM previews inherit the faces.
import { CAPSULE_FONTS_CSS } from "./capsule-fonts.generated";

let capsuleFontsInjected = false;

/** Inject capsule's add-on @font-face rules once (no-op on the server / repeated calls). */
export const injectCapsuleFonts = (): void => {
  if (capsuleFontsInjected || typeof document === "undefined") return;
  capsuleFontsInjected = true;
  const style = document.createElement("style");
  style.dataset.mcFonts = "capsule";
  style.textContent = CAPSULE_FONTS_CSS;
  document.head.appendChild(style);
};
