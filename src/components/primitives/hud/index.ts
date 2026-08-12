import template from "./template.html" with { type: "text" };
import geometryCss from "./geometry.css" with { type: "text" };
import { component } from "../../runtime/component";
import { hudAnim } from "./anim";
import { HudSchema } from "./schema";

/**
 * The HUD's shared geometry — every position and box in the band, exported because it has TWO
 * consumers and neither can be the other's.
 *
 * `Hud`'s own `css` below covers everything that builds through the component runtime (the
 * showcase, the WebUI preview, the editor). The RENDER does not: the harness stages a theme's
 * `skins.hud` STRING straight to `<project>/assets/chrome.css` (`chromeCss` in the harness's
 * components/chrome.ts) and only ever takes `.node` off the built component, so it never sees a
 * `def.css`. It imports this instead.
 *
 * That split is exactly why the concatenation cannot simply move into the component: doing only
 * that empties the deck's chrome sheet of every HUD position while every test and preview still
 * looks right. Two named consumers of one export is the fix; six hand-written `hudGeometryCss +
 * hudCss` expressions in six theme.ts files was not.
 */
export const HUD_GEOMETRY_CSS: string = geometryCss;

/** The full-frame HUD overlay — brand (top-left) · title pill (top-right) · slide
 *  counter (bottom-right) · progress track (bottom), each gated by a boolean. A
 *  `frame` composite: the showcase renders it in a 1920×1080 frame slot. In the
 *  real render the harness still owns the root #hud chrome (legacy frameHud); this
 *  is the library/showcase piece. Gating uses the data-slot seam: omit a part's key
 *  to keep it, set it null to remove its whole subtree (pruneRemoved).
 *
 *  Structure (this template) + behavior (schema/anim) are shared across every theme;
 *  the SKIN is theme-owned (`theme.skins.hud` — e.g. themes/block-hud.css), styling
 *  the standard `.hud`/`.hud-*` class names below. So a new theme just adds its skin. */
export const Hud = component({
  name: "hud",
  schema: HudSchema,
  template,
  // SHARED, not a fallback skin: the band is the box `--safe-top` reserves for, so its geometry
  // is not a theme's to restate. Emitted ahead of `theme.skins.hud`, which paints inside it.
  css: geometryCss,
  frame: true,
  example: {
    brand: true,
    title: true,
    counter: true,
    progress: true,
    // These TWO are not just showcase filler — the harness's `gen-theme-previews.ts` reads them
    // (`bandCopy`, which takes `brandName` and `tagline` and nothing else) to caption the
    // theme-picker thumbnails, so this is the ONE place that text lives. They name what the card
    // IS ("the Cover of a Sample Deck") rather than carrying invented branding: the band is
    // identical on all six thumbnails, so anything brand-shaped there reads as content the user
    // is choosing between when it is the same on every card.
    brandName: "Cover",
    tagline: "Sample Deck",
    // Showcase only — nothing outside this repo reads them.
    titleText: "Overview",
    counterText: "01 / 06",
    progressPct: 60,
  },
  fill: (p) => {
    const f: Record<string, string | null | undefined> = {
      "brand-name": p.brandName,
      tagline: p.tagline,
      "title-text": p.titleText,
      "counter-text": p.counterText,
    };
    if (!p.brand) f.brand = null;
    if (!p.title) f.title = null;
    if (!p.counter) f.counter = null;
    if (!p.progress) f.progress = null;
    return f;
  },
  layout: (p) => ({ "--pfill": (p.progressPct / 100).toString() }),
  // No `animIn`: the HUD is persistent chrome (always on screen), not scene content,
  // so it has no whole-element entrance transition — only its internal reveal below.
  anim: hudAnim,
});
