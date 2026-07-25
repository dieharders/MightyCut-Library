// Standard's ADD-ON font injection — the per-theme counterpart to core-fonts.ts.
//
// Standard names two families: Inter (--body/--mono), which IS in the core chrome set, and Playfair
// Display (--disp), which is not. So — like capsule, and unlike professional (whose faces are
// entirely its own) — register-standard.ts injects BOTH core and this sheet, and a standard deck
// pays for exactly one extra family. Widening CORE_FONTS_CSS instead would tax every other theme's
// deck with a high-contrast didone none of them use.
//
// Playfair ships as TWO faces: the upright and a true ITALIC. That matters here more than it would
// elsewhere — standard's cover and closing headlines carry an emphasised <em> clause, and without a
// real italic file the browser would synthesise an oblique from the upright, which on a didone
// reads as a sheared serif rather than a drawn one.
//
// Same contract as injectCoreFonts: its OWN guard flag (idempotent across repeated loads), its OWN
// style.dataset marker (distinguishable in devtools, and never overwriting core's), and a no-op
// when there is no document (SSR / the Bun-side compose path, where render staging copies
// standard-fonts.css into the project instead). Document-level, like core, so Shadow DOM previews
// inherit the faces.
import { STANDARD_FONTS_CSS } from "./standard-fonts.generated";

let standardFontsInjected = false;

/** Inject standard's add-on @font-face rules once (no-op on the server / repeated calls). */
export const injectStandardFonts = (): void => {
  if (standardFontsInjected || typeof document === "undefined") return;
  standardFontsInjected = true;
  const style = document.createElement("style");
  style.dataset.mcFonts = "standard";
  style.textContent = STANDARD_FONTS_CSS;
  document.head.appendChild(style);
};
