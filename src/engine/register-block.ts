// The BLOCK theme payload — the lazy per-theme chunk. Importing this module
// (only ever via `loadTheme('block')`'s dynamic import) pulls in every element
// trio (they are block-only today) + the block theme tokens, registers them in
// the runtime registry, and injects the block content fonts (inlined). Vite
// code-splits this into its own chunk, so the base engine ships without any
// theme and the WebUI fetches one payload per theme.
import "../components/registry"; // side-effect: registerComponent/registerTreatment for every element
import { blockTheme } from "../components/themes/block/theme";
import type { ThemeTokens } from "../components/runtime/types";
import { CORE_FONTS_CSS } from "./block-fonts.generated";

let fontsInjected = false;

/** Inject the core @font-face rules once (document-level so Shadow DOM inherits them).
 *  The core chrome set is a superset of block's content fonts (Space Grotesk / Inter). */
const injectBlockFonts = (): void => {
  if (fontsInjected || typeof document === "undefined") return;
  fontsInjected = true;
  const style = document.createElement("style");
  style.dataset.mcFonts = "core";
  style.textContent = CORE_FONTS_CSS;
  document.head.appendChild(style);
};

export const registerBlock = (): ThemeTokens => {
  injectBlockFonts();
  return blockTheme;
};
