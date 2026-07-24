// Professional's ADD-ON font injection — the per-theme counterpart to core-fonts.ts.
//
// Professional is the first theme whose content faces are ENTIRELY outside the core chrome set:
// Libre Baskerville (--disp, serif headlines) and IBM Plex Sans (--body/--mono, everything else),
// neither of which fonts.css declares. Rather than widening CORE_FONTS_CSS (which every theme
// payload injects), both faces are inlined into their own generated module and injected here —
// imported ONLY by register-professional.ts, so Vite keeps the payload inside professional's lazy
// theme chunk and no other theme downloads it. (Because professional uses NO core face,
// register-professional injects only this — not the core set — so a professional deck carries just
// the two faces it actually uses.)
//
// Same contract as injectCoreFonts: its OWN guard flag (idempotent across repeated loads), its OWN
// style.dataset marker (distinguishable in devtools), and a no-op when there is no document (SSR /
// the Bun-side compose path, where render staging copies professional-fonts.css into the project).
// Document-level, like core, so Shadow DOM previews inherit the faces.
import { PROFESSIONAL_FONTS_CSS } from "./professional-fonts.generated";

let professionalFontsInjected = false;

/** Inject professional's add-on @font-face rules once (no-op on the server / repeated calls). */
export const injectProfessionalFonts = (): void => {
  if (professionalFontsInjected || typeof document === "undefined") return;
  professionalFontsInjected = true;
  const style = document.createElement("style");
  style.dataset.mcFonts = "professional";
  style.textContent = PROFESSIONAL_FONTS_CSS;
  document.head.appendChild(style);
};
