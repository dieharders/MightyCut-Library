// mountEditor — the deck editor as an embeddable function (the React-side port of
// the harness's src/editor/app.ts). Loads a DeckDocument, renders each scene as a
// live editable card (reusing buildCard), and saves the edited deck back through a
// caller-supplied `onSave` callback. The vanilla version's window/`?store=` globals
// become function params:
//   window.__DECK__ / __SAMPLE_DECK__  → opts.deck / opts.sample
//   ?store= + localStorage             → opts.onSave (the caller persists)
//   window.MC_EDITOR_ONSAVE            → opts.onSave
// Edits round-trip losslessly via applySceneEdit (unknown fields survive). Mounts in
// a Shadow DOM for style isolation, mirroring mountShowcase.
import { getTreatment } from "../components/runtime/registry";
import type { ThemeTokens } from "../components/runtime/types";
import {
  applySceneEdit,
  DeckDocumentSchema,
  type DeckDocument,
  type DeckScene,
  type SceneEdit,
} from "../types/deck";
import {
  buildCard,
  type CardSnapshot,
  el,
  resetRefreshers,
  settleAfterAttach,
} from "./editor-core";
import { SHOWCASE_CHROME, EDITOR_CHROME } from "./chrome";
import { bootstrapFx } from "./fx";
import { loadTheme } from "./load-theme";

export type EditorHandle = {
  /** Replace the loaded deck (validates; renders from the raw object for lossless round-trip). */
  load: (raw: unknown) => void;
  /** Remove the resize listener + clear the shadow. */
  destroy: () => void;
};

export type MountEditorOptions = {
  /** The working deck to edit (host-provided; e.g. the WebUI's localStorage copy or baseline). */
  deck?: unknown;
  /** Fallback deck when `deck` is absent (e.g. a bundled sample). */
  sample?: unknown;
  /** Save handler — receives the edited DeckDocument. When provided, a Save button is shown
   *  (the caller owns persistence, e.g. saveDeck + a preview rebuild). Absent ⇒ Export only. */
  onSave?: (doc: DeckDocument) => void;
  /** Theme value to load (default 'block'; falls back if a deck names an unloadable theme). */
  themeName?: string;
};

type Card = {
  scene: DeckScene;
  snapshot: (() => CardSnapshot | null) | null;
  lastEdit: SceneEdit | null;
};

export const mountEditor = async (
  container: HTMLElement,
  opts: MountEditorOptions = {},
): Promise<EditorHandle> => {
  bootstrapFx();
  const themeName = opts.themeName ?? "block";
  const theme: ThemeTokens = await loadTheme(themeName);

  const shadow = container.shadowRoot ?? container.attachShadow({ mode: "open" });
  shadow.replaceChildren();
  const style = document.createElement("style");
  style.textContent = `${theme.css.replace(/:root/g, ":host")}\n${SHOWCASE_CHROME}\n${EDITOR_CHROME}`;
  shadow.appendChild(style);
  const rootEl = document.createElement("div");
  shadow.appendChild(rootEl);

  // --- toolbar ---
  const toolbar = el("div", "toolbar");
  toolbar.appendChild(el("span", "tb-title", "DECK EDITOR"));
  const themeLabel = el("span", "tb-theme");
  toolbar.appendChild(themeLabel);
  toolbar.appendChild(el("span", "tb-spacer"));

  const fileInput = el("input") as HTMLInputElement;
  fileInput.type = "file";
  fileInput.accept = "application/json,.json";
  fileInput.style.display = "none";

  const loadBtn = el("button", "tb-btn", "Load deck.json");
  loadBtn.addEventListener("click", () => fileInput.click());
  const exportBtn = el("button", "tb-btn", "Export deck.json");
  const saveBtn = el("button", "tb-btn tb-btn--primary", "Save");
  // Save is shown only when the caller wired persistence (mirrors the vanilla
  // editor's "embedded only" Save-button rule, keyed on onSave instead of ?store=).
  if (opts.onSave) toolbar.append(loadBtn, exportBtn, saveBtn, fileInput);
  else toolbar.append(loadBtn, exportBtn, fileInput);

  const msg = el("div", "tb-msg");
  const deckGrid = el("div", "grid");
  rootEl.append(toolbar, msg, deckGrid);

  const setMsg = (text: string, isError = false): void => {
    msg.textContent = text;
    msg.className = isError ? "tb-msg tb-msg--err" : "tb-msg";
  };

  let cards: Card[] = [];
  let currentDoc: DeckDocument | null = null;

  const renderDeck = (doc: DeckDocument): void => {
    currentDoc = doc;
    themeLabel.textContent = `theme: ${doc.theme}  ·  ${doc.scenes.length} slides`;
    deckGrid.replaceChildren();
    cards = [];
    doc.scenes.forEach((scene, i) => {
      const compId = `ed-${String(i + 1).padStart(2, "0")}-${scene.id}`;
      const label = `${i + 1}. ${scene.id} · ${scene.treatment}`;
      try {
        const built = buildCard(getTreatment(scene.treatment), {
          theme,
          compId,
          label,
          initial: scene.params,
          initialChildren: scene.children,
          initialDecorations: scene.decorations,
          initialGround: scene.ground,
          initialTransition: scene.transition,
          initialVo: scene.vo,
        });
        deckGrid.appendChild(built.el);
        cards.push({ scene, snapshot: built.snapshot, lastEdit: null });
      } catch (e) {
        const errCard = el("div", "card");
        const head = el("div", "card-head");
        head.appendChild(el("span", "card-name", label));
        head.appendChild(el("span", "card-kind", "unrenderable"));
        errCard.appendChild(head);
        errCard.appendChild(el("div", "err", (e as Error).message));
        deckGrid.appendChild(errCard);
        cards.push({ scene, snapshot: null, lastEdit: null });
      }
    });
    settleAfterAttach(shadow);
  };

  const gatherDeck = (): { doc: DeckDocument; invalidIds: string[] } | null => {
    if (!currentDoc) return null;
    const scenes: DeckScene[] = [];
    const invalidIds: string[] = [];
    for (const c of cards) {
      if (!c.snapshot) {
        scenes.push(c.scene);
        continue;
      }
      const snap = c.snapshot();
      if (snap) {
        c.lastEdit = {
          params: snap.params,
          children: snap.children,
          decorations: snap.decorations,
          ground: snap.ground,
          transition: snap.transition,
          vo: snap.vo,
        };
      } else {
        invalidIds.push(c.scene.id);
      }
      scenes.push(c.lastEdit ? applySceneEdit(c.scene, c.lastEdit) : c.scene);
    }
    return { doc: { ...currentDoc, scenes }, invalidIds };
  };

  const gatherForWrite = (): { doc: DeckDocument; warn: string } | null => {
    const res = gatherDeck();
    if (!res) return null;
    const warn = res.invalidIds.length
      ? ` (slides with errors kept their last valid values: ${res.invalidIds.join(", ")})`
      : "";
    return { doc: res.doc, warn };
  };

  exportBtn.addEventListener("click", () => {
    const g = gatherForWrite();
    if (!g) return;
    const json = `${JSON.stringify(g.doc, null, 2)}\n`;
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = el("a") as HTMLAnchorElement;
    a.href = url;
    a.download = "deck.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMsg(`Exported deck.json (${g.doc.scenes.length} slides)${g.warn}.`, g.warn !== "");
  });

  saveBtn.addEventListener("click", () => {
    if (!opts.onSave) return;
    const g = gatherForWrite();
    if (!g) return;
    setMsg(`Saved ${g.doc.scenes.length} slides${g.warn}.`, g.warn !== "");
    opts.onSave(g.doc);
  });

  const loadFromUnknown = (raw: unknown, source: string): void => {
    const parsed = DeckDocumentSchema.safeParse(raw);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .slice(0, 4)
        .join("; ");
      setMsg(`${source} is not a valid deck: ${detail}`, true);
      return;
    }
    // Render from the RAW object so fields the schema doesn't model survive a round-trip.
    renderDeck(raw as DeckDocument);
    setMsg(`Loaded ${source}.`);
  };

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let raw: unknown;
      try {
        raw = JSON.parse(String(reader.result));
      } catch (e) {
        setMsg(`Could not parse ${file.name}: ${(e as Error).message}`, true);
        return;
      }
      loadFromUnknown(raw, file.name);
      fileInput.value = "";
    };
    reader.readAsText(file);
  });

  // --- initial load: provided deck → sample → empty prompt ---
  const injected = opts.deck ?? opts.sample;
  if (injected) loadFromUnknown(injected, opts.deck ? "the deck" : "the sample deck");
  else setMsg("Load a deck.json to begin.");

  return {
    load: (raw: unknown) => loadFromUnknown(raw, "the deck"),
    destroy: () => shadow.replaceChildren(),
  };
};
