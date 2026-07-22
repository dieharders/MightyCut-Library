import template from "./template.html" with { type: "text" };
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
  frame: true,
  example: {
    brand: true,
    title: true,
    counter: true,
    progress: true,
    brandName: "MightyCut",
    tagline: "// themed decks",
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
