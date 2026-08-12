import template from "./template.html" with { type: "text" };
import geometryCss from "./geometry.css" with { type: "text" };
import { component } from "../../runtime/component";
import { hudAnim } from "./anim";
import { HudSchema } from "./schema";

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
  // is not a theme's to restate. runtime/component.ts JOINS this with `theme.skins.hud`, which
  // paints inside it — that join is the single definition of "the HUD's stylesheet", and every
  // consumer takes it from here. The showcase, the WebUI preview and the editor get it by
  // building the component; the RENDER gets it the same way, because the harness's `chromeCss`
  // reads `buildNode(...).css` rather than `theme.skins.hud` (which is paint only).
  //
  // This used to be hand-concatenated onto `skins.hud` in all six theme.ts files instead —
  // twelve expressions with nothing asserting the join. Dropping one shipped a deck whose HUD
  // had no positions at all, in the MP4 only. theme-parity.test.ts now pins the join.
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
