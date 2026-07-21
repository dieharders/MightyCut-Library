// Root chrome — the structural CSS for the harness-generated ROOT composition
// (index.html): the page reset, the backdrop layer, and the HUD / caption-rail clips.
// This is the furniture that persists across the whole deck, as opposed to the
// per-scene slide content the component/treatment system owns.
//
// Authored as CODE in src/ (imported as text, the same convention as every component
// and theme stylesheet) and WRITTEN into each project's assets/ by the harness
// (copyProjectAssets) rather than shipped as a static file — mirroring how
// blockTheme.css becomes a project's tokens.css.
//
// STRUCTURE ONLY: the active theme's skin (block's .bf-hud* / .bf-cap*) is linked
// after it and wins on any shared property. This is what replaces the go-forward
// render path's dependency on the legacy assets/base.css.
import chromeCss from "./chrome.css" with { type: "text" };

export const ROOT_CHROME_CSS = chromeCss;
