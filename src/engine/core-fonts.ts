// Shared core-font injection for every theme payload. The core chrome set (Space Grotesk /
// Inter / JetBrains Mono / Archivo Black) is a superset of block's and future's content
// fonts, so both themes inject the SAME inlined @font-face block. One idempotent guard here
// (rather than one per register-<theme>.ts) means loading several themes in a session appends
// the core set exactly once. Document-level so Shadow DOM previews inherit the faces.
import { CORE_FONTS_CSS } from "./block-fonts.generated";

let fontsInjected = false;

/** Inject the core @font-face rules once (no-op on the server / repeated calls). */
export const injectCoreFonts = (): void => {
  if (fontsInjected || typeof document === "undefined") return;
  fontsInjected = true;
  const style = document.createElement("style");
  style.dataset.mcFonts = "core";
  style.textContent = CORE_FONTS_CSS;
  document.head.appendChild(style);
};
