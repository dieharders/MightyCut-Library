// mountShowcase — render the live component gallery into a container, generated
// from the registry + theme tokens (the React-side port of the harness's
// src/showcase/app.ts). Mounts inside a Shadow DOM so the host app's CSS reset
// (e.g. Tailwind Preflight) can't bleed into the WYSIWYG previews; the theme
// `:root` tokens are re-scoped to `:host` (isolated, still inherited by the
// shadow content), and fonts are injected document-level by loadTheme.
import { allComponents, allTreatments, getComponent } from "../components/runtime/registry";
import type { ThemeTokens } from "../components/runtime/types";
import { buildCard, el, resetRefreshers, settleAfterAttach, type Factory } from "./editor-core";
import { SHOWCASE_CHROME } from "./chrome";
import { bootstrapFx } from "./fx";
import { loadTheme } from "./load-theme";

export type ShowcaseHandle = { destroy: () => void };

const sectionHead = (title: string): HTMLElement => {
  const head = el("div", "sec-head");
  head.appendChild(el("h2", undefined, title));
  head.appendChild(el("span", "sp"));
  return head;
};

const cardsSection = (title: string, factories: Factory[], theme: ThemeTokens): HTMLElement => {
  const sec = el("section");
  sec.appendChild(sectionHead(title));
  const grid = el("div", "grid");
  for (const f of factories) grid.appendChild(buildCard(f, { theme }).el);
  sec.appendChild(grid);
  return sec;
};

const headerBand = (theme: ThemeTokens): HTMLElement => {
  const h = el("div", "bf-header");
  h.appendChild(el("span", "bf-wordmark", `${theme.name}frame`.toUpperCase()));
  h.appendChild(
    el(
      "span",
      "bf-desc",
      "Every treatment and component, rendered live from the registry. Hover a frame to replay its animation; edit any param — or add child data — to re-render.",
    ),
  );
  return h;
};

const paletteSection = (theme: ThemeTokens): HTMLElement => {
  const sec = el("section");
  sec.appendChild(sectionHead("Palette"));
  const grid = el("div", "swatches");
  for (const sw of theme.palette ?? []) {
    const cardEl = el("div", "sw");
    const chip = el("div", "chip");
    chip.style.background = `var(--${sw.varName})`;
    cardEl.appendChild(chip);
    const meta = el("div", "meta");
    meta.appendChild(el("div", "name", sw.name));
    meta.appendChild(el("div", "hex", sw.note ? `${sw.hex} · ${sw.note}` : sw.hex));
    cardEl.appendChild(meta);
    grid.appendChild(cardEl);
  }
  sec.appendChild(grid);
  return sec;
};

const typographySection = (theme: ThemeTokens): HTMLElement => {
  const sec = el("section");
  sec.appendChild(sectionHead("Typography"));
  for (const t of theme.typography ?? []) {
    const row = el("div", "type-row");
    const left = el("div");
    left.appendChild(el("div", "tok", t.token));
    left.appendChild(el("div", "m", t.spec));
    row.appendChild(left);
    const spec = el("div", "type-spec");
    const sample = el("div", undefined, t.sample);
    sample.setAttribute("style", t.style);
    spec.appendChild(sample);
    row.appendChild(spec);
    sec.appendChild(row);
  }
  return sec;
};

const hudSection = (theme: ThemeTokens): HTMLElement => {
  const sec = el("section");
  sec.appendChild(sectionHead("HUD"));
  const grid = el("div", "grid grid--full");
  grid.appendChild(buildCard(getComponent("hud"), { theme }).el);
  sec.appendChild(grid);
  return sec;
};

const decorationsSection = (theme: ThemeTokens): HTMLElement => {
  const sec = el("section");
  sec.appendChild(sectionHead("Decorations"));
  const grid = el("div", "grid");
  for (const name of theme.decorations ?? []) {
    grid.appendChild(buildCard(getComponent(name), { theme }).el);
  }
  sec.appendChild(grid);
  return sec;
};

const rulesSection = (theme: ThemeTokens): HTMLElement => {
  const sec = el("section");
  sec.appendChild(sectionHead("Frame Rules"));
  const dos = el("div", "dos");
  const ruleCard = (kind: "do" | "dont", title: string, items: string[]): HTMLElement => {
    const c = el("div", `do-card ${kind}`);
    c.appendChild(el("h4", undefined, title));
    const ul = el("ul");
    for (const it of items) ul.appendChild(el("li", undefined, it));
    c.appendChild(ul);
    return c;
  };
  dos.appendChild(ruleCard("do", "Do", theme.rules?.do ?? []));
  dos.appendChild(ruleCard("dont", "Don't", theme.rules?.dont ?? []));
  sec.appendChild(dos);
  return sec;
};

/**
 * Mount the block component gallery into `container` (inside a Shadow DOM for
 * style isolation). Returns a handle whose `destroy()` removes the resize
 * listener and clears the shadow. `themeName` defaults to 'block'.
 */
export const mountShowcase = async (
  container: HTMLElement,
  themeName = "block",
): Promise<ShowcaseHandle> => {
  bootstrapFx();
  const theme = await loadTheme(themeName);

  const shadow = container.shadowRoot ?? container.attachShadow({ mode: "open" });
  shadow.replaceChildren();

  const style = document.createElement("style");
  // Re-scope the theme's `:root` tokens to `:host` so they define on the shadow
  // host (inherited by shadow content) without leaking into the host document.
  style.textContent = `${theme.css.replace(/:root/g, ":host")}\n${SHOWCASE_CHROME}`;
  shadow.appendChild(style);

  const root = document.createElement("div");
  shadow.appendChild(root);

  resetRefreshers();
  const decoNames = new Set(theme.decorations ?? []);
  const leafComponents = allComponents().filter(
    (f) => f.componentName !== "hud" && !decoNames.has(f.componentName),
  );
  root.appendChild(headerBand(theme));
  root.appendChild(paletteSection(theme));
  root.appendChild(typographySection(theme));
  root.appendChild(cardsSection("Components", leafComponents, theme));
  root.appendChild(hudSection(theme));
  root.appendChild(decorationsSection(theme));
  root.appendChild(cardsSection("Treatments", allTreatments(), theme));
  root.appendChild(rulesSection(theme));

  const teardown = settleAfterAttach(shadow);
  return {
    destroy: () => {
      teardown();
      shadow.replaceChildren();
    },
  };
};
