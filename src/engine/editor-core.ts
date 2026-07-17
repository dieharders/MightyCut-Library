// Shared render + per-element edit machinery, extracted from the showcase so BOTH
// the showcase gallery (src/showcase/app.ts) and the standalone deck editor
// (src/editor/app.ts) build from one implementation. Every element renders via its
// real build function; its param table comes straight from its Zod schema
// (z.toJSONSchema); its params — and, for treatments, its child data / decorations /
// ground — are editable live and Zod-validated.
//
// Settle-after-attach: a card's GSAP timeline is settled to its END state so
// content is visible at rest, but gsap can only read an element's computed styles/
// layout once it is ATTACHED to the document (a detached card mis-settles the block
// tilt + any measured reveal). So each card pushes a `refresh` onto `refreshers`,
// run once by settleAfterAttach() in a rAF after the page is appended + scaled.
//
// Two-bundle note: `refreshers`/`scaleFrames` are module singletons. The showcase
// and the editor are SEPARATE iife bundles on separate pages, so each gets its own
// copy — safe. This would only collide if both were <script>-loaded on one page.
import { buildPreview } from "../components/runtime/emit";
import { getComponent } from "../components/runtime/registry";
import { rootContext } from "../components/runtime";
import { pageInFor, pageOutFor } from "../components/runtime/transitions";
import type {
  ComponentFactory,
  ThemeTokens,
  TreatmentFactory,
} from "../components/runtime/types";
import type { DeckVoLine } from "../types/deck";
import { FRAME_GROUNDS, type FrameGround } from "../types/storyboard";
import {
  TIMING_PRESETS,
  TIMING_SECONDS,
  TRANSITION_NAMES,
  type TimingPreset,
  type TransitionName,
  type TransitionSpec,
} from "../types/transitions";

// Provided by the shell (<script src=gsap>, <script src=mc.js>).
type Tl = {
  restart: () => void;
  progress: (p: number) => Tl;
  duration: () => number;
  time: (t: number) => Tl;
  pause: () => Tl;
  eventCallback: (type: string, cb: (() => void) | null) => Tl;
};
declare const gsap: { timeline: (o?: { paused?: boolean }) => Tl };
declare const MC: {
  applyAnims: (tl: unknown, anims: unknown, ctx: unknown) => void;
  showcaseCtx: (root: Element) => unknown;
};

/** Access an MC page-transition factory by name (fadeIn/slideOut/…) for live preview replay. */
const mcFn = (
  name: string,
): ((
  tl: unknown,
  target: unknown,
  at: number,
  opts: Record<string, unknown>,
) => void) =>
  (
    MC as unknown as Record<
      string,
      (
        tl: unknown,
        target: unknown,
        at: number,
        opts: Record<string, unknown>,
      ) => void
    >
  )[name];

export type Factory = ComponentFactory | TreatmentFactory;
export const nameOf = (f: Factory): string =>
  "treatmentName" in f ? f.treatmentName : f.componentName;
export const isTreatment = (f: Factory): f is TreatmentFactory =>
  "treatmentName" in f;
export const isFrameComp = (f: Factory): boolean =>
  !isTreatment(f) && (f as ComponentFactory).frame === true;

export const el = (tag: string, cls?: string, text?: string): HTMLElement => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

// Re-settle hooks: run once after the page is attached + laid out (see header).
export const refreshers: (() => void)[] = [];

export type Schema = {
  properties?: Record<string, SchemaField>;
  required?: string[];
};
export type SchemaField = {
  type?: string;
  description?: string;
  default?: unknown;
  enum?: string[];
  maxLength?: number;
  /** z.array item schema (JSON Schema `items`). */
  items?: { type?: string };
  /** z.tuple positional item schemas (JSON Schema `prefixItems`). */
  prefixItems?: { type?: string }[];
};

// Coerce a form value back to the JSON type the schema expects.
export const coerce = (
  field: SchemaField,
  raw: string,
  checked?: boolean,
): unknown => {
  if (field.type === "boolean") return !!checked;
  if (field.type === "number" || field.type === "integer")
    return raw === "" ? undefined : Number(raw);
  // Array / tuple params (e.g. comparison.columns) are entered comma-separated —
  // split back to an array so schema validation gets a tuple, not a raw string.
  if (field.type === "array") {
    if (raw.trim() === "") return undefined;
    const parts = raw.split(",").map((s) => s.trim());
    const itemType = field.items?.type ?? field.prefixItems?.[0]?.type;
    return itemType === "number" || itemType === "integer"
      ? parts.map(Number)
      : parts;
  }
  return raw === "" ? undefined : raw;
};

export const inputFor = (
  field: SchemaField,
  value: unknown,
  onChange: () => void,
): HTMLElement => {
  if (field.enum) {
    const sel = el("select") as HTMLSelectElement;
    // An optional enum with no default seeds `value` undefined — offer an empty
    // option so "unset" is representable; otherwise the <select> would default to
    // the first option and the first edit would silently force that value
    // (e.g. flare `accent`, which must stay unset to keep the variant's own color).
    if (value == null) {
      const empty = el("option") as HTMLOptionElement;
      empty.value = "";
      empty.textContent = "— unset —";
      empty.selected = true;
      sel.appendChild(empty);
    }
    for (const opt of field.enum) {
      const o = el("option") as HTMLOptionElement;
      o.value = opt;
      o.textContent = opt;
      if (opt === value) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener("change", onChange);
    return sel;
  }
  if (field.type === "boolean") {
    const cb = el("input") as HTMLInputElement;
    cb.type = "checkbox";
    cb.checked = !!value;
    cb.addEventListener("change", onChange);
    return cb;
  }
  const inp = el("input") as HTMLInputElement;
  inp.type =
    field.type === "number" || field.type === "integer" ? "number" : "text";
  if (value != null) inp.value = String(value);
  inp.addEventListener("input", onChange);
  return inp;
};

export const issues = (e: {
  issues: readonly { readonly path: readonly PropertyKey[]; message: string }[];
}): string =>
  e.issues
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");

export type Instance = {
  name: string;
  params: Record<string, unknown>;
  animIn?: TransitionName;
  timeIn?: TimingPreset;
};
/** A seed instance from a loaded deck — params optional (mirrors the deck's ChildSpec). */
export type ChildInit = {
  name: string;
  params?: Record<string, unknown>;
  animIn?: TransitionName;
  timeIn?: TimingPreset;
};

// A list editor for a treatment's composed instances — used for both its repeated
// children (one type, e.g. stat-grid→stat) and its decorations (a CHOICE of types:
// starburst / slab / stripe / badge, one add button each). Each row is tagged with
// its component name and validated against that component's Zod schema. Empty ⇒ the
// treatment renders its defaults; adding rows switches to explicit composition.
// `initialRows` seeds existing instances (from a loaded deck); undefined ⇒ empty.
export const buildInstanceEditor = (
  componentNames: string[],
  title: string,
  onChange: () => void,
  initialRows?: ChildInit[],
  showTransition = false,
): { el: HTMLElement; snapshot: () => Instance[] | null } => {
  type Row = {
    name: string;
    params: Record<string, unknown>;
    el: HTMLElement;
    animIn?: TransitionName;
    timeIn?: TimingPreset;
  };
  const rows: Row[] = [];
  const list = el("div", "kids");
  const errAll = el("div", "err");

  const readRow = (row: Row): void => {
    const fields =
      (getComponent(row.name).jsonSchema() as Schema).properties ?? {};
    const next: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(fields)) {
      const ctrl = row.el.querySelector<HTMLInputElement>(
        `[data-cfield="${key}"]`,
      );
      if (!ctrl) continue;
      const val = coerce(field, ctrl.value, ctrl.checked);
      if (val !== undefined) next[key] = val;
    }
    row.params = next;
    const inSel = row.el.querySelector<HTMLSelectElement>(
      '[data-tfield="animIn"]',
    );
    const tSel = row.el.querySelector<HTMLSelectElement>(
      '[data-tfield="timeIn"]',
    );
    row.animIn = (inSel?.value || undefined) as TransitionName | undefined;
    row.timeIn = (tSel?.value || undefined) as TimingPreset | undefined;
  };

  const addRow = (compName: string, init?: ChildInit): void => {
    const factory = getComponent(compName);
    const fields = (factory.jsonSchema() as Schema).properties ?? {};
    // Seed from the component's example, overlaid with any loaded instance params,
    // so both `row.params` AND the DOM controls carry the seeded values.
    const params = {
      ...(factory.defaults() as Record<string, unknown>),
      ...(init?.params ?? {}),
    };
    const rowEl = el("div", "kid");
    const grid = el("div", "kid-fields");
    const row: Row = {
      name: compName,
      params,
      el: rowEl,
      animIn: init?.animIn,
      timeIn: init?.timeIn,
    };
    if (componentNames.length > 1)
      grid.appendChild(el("span", "kid-type", compName));
    for (const [key, field] of Object.entries(fields)) {
      const cell = el("label", "kid-cell");
      cell.appendChild(el("span", "kid-key", key));
      const ctrl = inputFor(field, params[key], () => {
        readRow(row);
        onChange();
      });
      ctrl.setAttribute("data-cfield", key);
      cell.appendChild(ctrl);
      grid.appendChild(cell);
    }
    // Per-child transition OVERRIDE — `—` (empty) inherits the treatment/agent-assigned
    // default (or the component's built-in default); a value overrides just this child.
    // Components have no exit, so IN + timing only.
    if (showTransition) {
      const tcell = (
        labelText: string,
        tfield: string,
        options: readonly string[],
        value: string | undefined,
      ): HTMLElement => {
        const cell = el("label", "kid-cell");
        cell.appendChild(el("span", "kid-key", labelText));
        const s = el("select") as HTMLSelectElement;
        s.setAttribute("data-tfield", tfield);
        const empty = el("option") as HTMLOptionElement;
        empty.value = "";
        empty.textContent = "— inherit —";
        s.appendChild(empty);
        for (const o of options) {
          const opt = el("option") as HTMLOptionElement;
          opt.value = o;
          opt.textContent = o;
          if (o === value) opt.selected = true;
          s.appendChild(opt);
        }
        if (!value) empty.selected = true;
        s.addEventListener("change", () => {
          readRow(row);
          onChange();
        });
        cell.appendChild(s);
        return cell;
      };
      grid.appendChild(
        tcell("in-anim", "animIn", TRANSITION_NAMES, init?.animIn),
      );
      grid.appendChild(
        tcell("in-time", "timeIn", TIMING_PRESETS, init?.timeIn),
      );
    }
    rowEl.appendChild(grid);
    const rm = el("button", "kid-rm", "×");
    rm.addEventListener("click", () => {
      const i = rows.indexOf(row);
      if (i >= 0) {
        rows.splice(i, 1);
        rowEl.remove();
        onChange();
      }
    });
    rowEl.appendChild(rm);
    rows.push(row);
    list.appendChild(rowEl);
  };

  const bar = el("div", "kids-bar");
  bar.appendChild(el("span", "kids-title", title));
  const btns = el("div", "kids-btns");
  for (const cn of componentNames) {
    const add = el(
      "button",
      "kids-add",
      componentNames.length > 1 ? `+ ${cn}` : `+ add ${cn}`,
    );
    add.addEventListener("click", () => {
      addRow(cn);
      onChange();
    });
    btns.appendChild(add);
  }
  bar.appendChild(btns);

  const wrap = el("div", "child-editor");
  wrap.appendChild(bar);
  wrap.appendChild(list);
  wrap.appendChild(errAll);

  // Seed existing instances from a loaded deck (name may be any registered
  // component, not just the add-button set). Unknown names are skipped.
  for (const r of initialRows ?? []) {
    try {
      addRow(r.name, r);
    } catch {
      /* unknown component in the loaded data — skip the row rather than crash */
    }
  }

  const snapshot = (): Instance[] | null => {
    for (let i = 0; i < rows.length; i++) {
      const parsed = getComponent(rows[i]!.name).schema.safeParse(
        rows[i]!.params,
      );
      if (!parsed.success) {
        errAll.textContent = `${rows[i]!.name} ${i + 1}: ${issues(parsed.error)}`;
        return null;
      }
    }
    errAll.textContent = "";
    return rows.map((r) => ({
      name: r.name,
      params: r.params,
      ...(r.animIn ? { animIn: r.animIn } : {}),
      ...(r.timeIn ? { timeIn: r.timeIn } : {}),
    }));
  };

  return { el: wrap, snapshot };
};

// Transition controls — a compact row of dropdowns to assign a transition. Components
// get animIn + timeIn (whole-element entrance); treatments add animOut + timeOut (the
// whole scene page in/out). Empty ⇒ unset (the element/scene keeps its byte-identical
// default). Shared by the showcase (try-out) and the deck editor (assign + save).
export const buildTransitionControls = (
  isT: boolean,
  initial: TransitionSpec | undefined,
  onChange: () => void,
): { el: HTMLElement; snapshot: () => TransitionSpec | undefined } => {
  const row = el("div", "trans-row");
  const sel = (
    labelText: string,
    options: readonly string[],
    value: string | undefined,
  ): HTMLSelectElement => {
    const field = el("label", "trans-field");
    field.appendChild(el("span", "trans-label", labelText));
    const s = el("select", "trans-select") as HTMLSelectElement;
    const empty = el("option") as HTMLOptionElement;
    empty.value = "";
    empty.textContent = "— inherit —";
    s.appendChild(empty);
    for (const o of options) {
      const opt = el("option") as HTMLOptionElement;
      opt.value = o;
      opt.textContent = o;
      if (o === value) opt.selected = true;
      s.appendChild(opt);
    }
    if (!value) empty.selected = true;
    s.addEventListener("change", onChange);
    field.appendChild(s);
    row.appendChild(field);
    return s;
  };
  const animIn = sel("in-anim", TRANSITION_NAMES, initial?.animIn);
  const timeIn = sel("in-time", TIMING_PRESETS, initial?.timeIn);
  const animOut = isT
    ? sel("out-anim", TRANSITION_NAMES, initial?.animOut)
    : null;
  const timeOut = isT
    ? sel("out-time", TIMING_PRESETS, initial?.timeOut)
    : null;
  const snapshot = (): TransitionSpec | undefined => {
    const t: TransitionSpec = {};
    if (animIn.value) t.animIn = animIn.value as TransitionName;
    if (timeIn.value) t.timeIn = timeIn.value as TimingPreset;
    if (animOut?.value) t.animOut = animOut.value as TransitionName;
    if (timeOut?.value) t.timeOut = timeOut.value as TimingPreset;
    return Object.keys(t).length ? t : undefined;
  };
  return { el: row, snapshot };
};

// Captions editor — one text input per VO/caption line, in order. The lines already
// exist (the generator authored one per caption); this edits their TEXT only, so the
// caption SPLIT stays owned by the build (no add/remove/reorder here). Each input keeps
// its line `id` so the deck POST can map edits back to spec.json.voiceover[]. Editing a
// caption does NOT re-synthesize the voiceover — a future polish pass reconciles that.
export const buildVoEditor = (
  initialVo: DeckVoLine[],
  onChange: () => void,
): { el: HTMLElement; snapshot: () => DeckVoLine[] } => {
  const wrap = el("div", "vo-editor");
  const bar = el("div", "vo-bar");
  bar.appendChild(el("span", "vo-title", "captions"));
  bar.appendChild(
    el(
      "span",
      "vo-note",
      "Editing requires re-render of voiceover and timings",
    ),
  );
  wrap.appendChild(bar);
  const list = el("div", "vo-list");
  const rows: { id: string; input: HTMLInputElement }[] = [];
  initialVo.forEach((line, i) => {
    const row = el("label", "vo-row");
    row.appendChild(el("span", "vo-key", `caption ${i + 1}`));
    const input = el("input", "vo-input") as HTMLInputElement;
    input.type = "text";
    input.value = line.text;
    input.addEventListener("input", onChange);
    row.appendChild(input);
    list.appendChild(row);
    rows.push({ id: line.id, input });
  });
  wrap.appendChild(list);
  const snapshot = (): DeckVoLine[] =>
    rows.map(({ id, input }) => ({ id, text: input.value }));
  return { el: wrap, snapshot };
};

/** What a card reports back on snapshot — the fields the editor owns for a scene. */
export type CardSnapshot = {
  name: string;
  params: Record<string, unknown>;
  children: Instance[];
  decorations: Instance[];
  ground?: FrameGround;
  transition?: TransitionSpec;
  /** Present only for deck-scene cards (seeded with `initialVo`); the edited caption lines. */
  vo?: DeckVoLine[];
};

export type CardOpts = {
  compId?: string;
  label?: string;
  initial?: Record<string, unknown>;
  /** Seed the treatment's child list from a loaded deck. */
  initialChildren?: ChildInit[];
  /** Seed the treatment's decoration list from a loaded deck. */
  initialDecorations?: ChildInit[];
  /** Seed the ground override select (shown on every treatment; undefined ⇒ inherit). */
  initialGround?: FrameGround;
  /** Seed the transition controls (from a loaded deck scene). */
  initialTransition?: TransitionSpec;
  /** Seed the per-slide Captions section (a deck scene's VO lines). Absent/empty ⇒ no
   *  Captions section (e.g. the component showcase gallery, which has no VO). */
  initialVo?: DeckVoLine[];
  /** Theme tokens (palette/decorations/`:root` css) — threaded into the render context
   *  and the decoration-family list, so the card is theme-agnostic. Required. */
  theme?: ThemeTokens;
};

export const buildCard = (
  factory: Factory,
  opts: CardOpts = {},
): { el: HTMLElement; snapshot: () => CardSnapshot | null } => {
  const name = nameOf(factory);
  const kind = isTreatment(factory) ? "treatment" : "component";
  const compId = opts.compId ?? `sc-${name}`;
  const theme = opts.theme;
  if (!theme) throw new Error("buildCard: opts.theme is required");
  const schema = factory.jsonSchema() as Schema;
  const fields = schema.properties ?? {};
  const useFrame = isTreatment(factory) || isFrameComp(factory);

  const card = el("div", "card");
  const head = el("div", "card-head");
  head.appendChild(el("span", "card-name", opts.label ?? name));
  head.appendChild(el("span", "card-kind", kind));
  card.appendChild(head);

  const stage = el(
    "div",
    useFrame ? "stage stage--frame" : "stage stage--comp",
  );
  if (isFrameComp(factory)) stage.classList.add("stage--chrome");
  const inner = el("div", "stage-inner");
  stage.appendChild(inner);
  card.appendChild(stage);
  const err = el("div", "err");
  card.appendChild(err);

  // Seed the live params from the example (+ any section/scene override).
  const current: Record<string, unknown> = {
    ...(factory.defaults() as Record<string, unknown>),
    ...(opts.initial ?? {}),
  };

  const childApi =
    isTreatment(factory) && factory.childComponent
      ? buildInstanceEditor(
          [factory.childComponent],
          `children · ${factory.childComponent} (empty = defaults)`,
          () => applyRender(),
          opts.initialChildren,
          true,
        )
      : null;
  // Any treatment can carry decorations — a CHOICE of families (starburst / slab /
  // stripe / badge), each an add button. Offered on every treatment card.
  const decoApi = isTreatment(factory)
    ? buildInstanceEditor(
        [...(theme.decorations ?? [])],
        "decorations · background / foreground",
        () => applyRender(),
        opts.initialDecorations,
        true,
      )
    : null;

  // Captions section — deck-scene cards only (seeded with the slide's VO lines). Editing
  // caption text doesn't affect the card's visual preview, so it takes a no-op onChange;
  // its values are read on save (snapshot) and written back to spec.json by the deck POST.
  const voApi =
    opts.initialVo && opts.initialVo.length
      ? buildVoEditor(opts.initialVo, () => {})
      : null;

  // Ground override — a full-bleed background swatch offered on every treatment
  // card. Empty ⇒ the treatment's canonical ground (buildPreview stamps it); a
  // choice overrides it (the same background-var swap the renderer's buildScene does).
  let groundSel: HTMLSelectElement | null = null;
  if (isTreatment(factory)) {
    groundSel = el("select", "ground-select") as HTMLSelectElement;
    const inherit = el("option") as HTMLOptionElement;
    inherit.value = "";
    inherit.textContent = "— inherit —";
    if (!opts.initialGround) inherit.selected = true;
    groundSel.appendChild(inherit);
    for (const g of FRAME_GROUNDS) {
      const o = el("option") as HTMLOptionElement;
      o.value = g;
      o.textContent = g;
      if (g === opts.initialGround) o.selected = true;
      groundSel.appendChild(o);
    }
    groundSel.addEventListener("change", () => applyRender());
  }

  let tl: Tl | null = null;
  let resetTime = 0; // timeline position of the resting (static) frame
  let hasOut = false; // treatment carries a page OUT ⇒ auto-return to static after a replay
  let replayToken = 0; // guards the deferred auto-return against a newer replay
  // After an out-bearing treatment replays to the end (the "gone" frame), hold it briefly
  // then snap back to the static hold shot — so the card never stays blank. Guarded so a
  // newer replay (re-hover / edit) cancels a pending return.
  const scheduleReturn = (): void => {
    if (!hasOut || !tl) return;
    const token = ++replayToken;
    const thisTl = tl;
    thisTl.eventCallback("onComplete", () => {
      window.setTimeout(() => {
        if (tl === thisTl && token === replayToken) {
          thisTl.time(resetTime);
          thisTl.pause();
        }
      }, 800);
    });
  };
  // Play the card from the top, then (for out-bearing treatments) auto-return to static.
  const replay = (): void => {
    if (!tl) return;
    tl.restart();
    scheduleReturn();
  };
  // Transition controls (in/out + timing). Changing one re-renders AND replays so the
  // effect is immediately visible; hover replays it again. Frame composites (the HUD)
  // are persistent chrome, not scene content — they have no entrance/exit, so no controls.
  const transApi = isFrameComp(factory)
    ? null
    : buildTransitionControls(isTreatment(factory), opts.initialTransition, () => {
        applyRender();
        replay();
      });
  const render = (
    params: Record<string, unknown>,
    kids: Instance[] | null,
    decos: Instance[] | null,
  ): void => {
    try {
      const inst = factory(params as never);
      if (childApi && isTreatment(factory) && kids && kids.length) {
        (inst as ReturnType<TreatmentFactory>).addChildren(
          ...kids.map((k) => {
            const c = getComponent(k.name)(k.params as never);
            if (k.animIn || k.timeIn)
              c.withTransition({ animIn: k.animIn, timeIn: k.timeIn });
            return c;
          }),
        );
      }
      if (decoApi && isTreatment(factory) && decos && decos.length) {
        (inst as ReturnType<TreatmentFactory>).addDecorations(
          ...decos.map((d) => {
            const c = getComponent(d.name)(d.params as never);
            if (d.animIn || d.timeIn)
              c.withTransition({ animIn: d.animIn, timeIn: d.timeIn });
            return c;
          }),
        );
      }
      const trans = transApi?.snapshot();
      // Component: the entrance IS an element anim, so apply it before buildPreview so the
      // preview's anim list carries it (and hover-replays it).
      if (!isTreatment(factory) && trans) {
        (inst as ReturnType<ComponentFactory>).withTransition({
          animIn: trans.animIn,
          timeIn: trans.timeIn,
        });
      }
      const preview = buildPreview(
        inst,
        rootContext(compId, theme, { mode: "showcase" }),
      );
      // Apply a chosen ground the same way the renderer's buildScene does — swap the
      // background var stamped on the page root by buildPreview.
      const g = groundSel?.value;
      const html = g
        ? preview.html.replace(
            /background:\s*var\(--[a-z]+\)/,
            `background: var(--${g})`,
          )
        : preview.html;
      inner.innerHTML = `<style>${preview.css}</style>${html}`;
      // Build paused + settle so content is VISIBLE at rest; hover replays from the top.
      tl = gsap.timeline({ paused: true });
      MC.applyAnims(tl, preview.anims, MC.showcaseCtx(inner));
      // Treatment: the whole-PAGE transition isn't part of buildPreview's anims, so REPLAY
      // it live on the page wrapper — page IN at t=0, page OUT after the content holds.
      // Settle to the HOLD frame (post-entrance, pre-exit) so the card is visible at rest.
      hasOut = false;
      let settled = false;
      if (isTreatment(factory) && trans) {
        // buildPreview wraps the scene as `.${compId}-root` (no separate render-path
        // `-page` wrapper), so animate the scene root — it carries the ground + content.
        const page = inner.querySelector(`.${compId}-root`);
        if (page) {
          const inSpec =
            trans.animIn && trans.animIn !== "none"
              ? pageInFor(trans.animIn)
              : null;
          const outSpec =
            trans.animOut && trans.animOut !== "none"
              ? pageOutFor(trans.animOut)
              : null;
          if (inSpec)
            mcFn(inSpec.fn)(tl, page, 0, {
              dur: TIMING_SECONDS[trans.timeIn ?? "short"],
              ...inSpec.opts,
            });
          const holdTime = tl.duration();
          if (outSpec) {
            mcFn(outSpec.fn)(tl, page, holdTime, {
              dur: TIMING_SECONDS[trans.timeOut ?? "short"],
              ...outSpec.opts,
            });
            tl.time(holdTime); // settle to the HOLD frame (post-entrance, pre-exit)
            resetTime = holdTime;
            hasOut = true;
            settled = true;
          }
        }
      }
      if (!settled) {
        tl.progress(1);
        resetTime = tl.duration();
      }
      err.textContent = "";
    } catch (e) {
      err.textContent = (e as Error).message;
    }
  };

  const readMainForm = (): Record<string, unknown> | null => {
    const next: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(fields)) {
      const ctrl = card.querySelector<HTMLInputElement | HTMLSelectElement>(
        `[data-field="${key}"]`,
      );
      if (!ctrl) continue;
      const val = coerce(
        field,
        (ctrl as HTMLInputElement).value,
        (ctrl as HTMLInputElement).checked,
      );
      if (val !== undefined) next[key] = val;
    }
    const parsed = factory.schema.safeParse(next);
    if (!parsed.success) {
      err.textContent = issues(parsed.error);
      return null;
    }
    // Clear a stale main-form error even when render is later skipped (e.g. a
    // child row is still invalid — that error surfaces separately in the editor).
    err.textContent = "";
    return parsed.data as Record<string, unknown>;
  };

  // A user edit (main param, child, decoration, or ground) reads the live form; an
  // invalid child/decoration row short-circuits render (its error surfaces there).
  function applyRender(): void {
    const params = readMainForm();
    if (!params) return;
    const kids = childApi ? childApi.snapshot() : null;
    if (childApi && kids === null) return;
    const decos = decoApi ? decoApi.snapshot() : null;
    if (decoApi && decos === null) return;
    render(params, kids, decos);
  }

  const table = el("table", "params");
  for (const [key, field] of Object.entries(fields)) {
    const tr = el("tr");
    const label = el("td", "p-name");
    label.appendChild(el("code", undefined, key));
    if (field.description)
      label.appendChild(el("div", "p-desc", field.description));
    tr.appendChild(label);
    const cell = el("td", "p-input");
    const ctrl = inputFor(field, current[key], applyRender);
    ctrl.setAttribute("data-field", key);
    cell.appendChild(ctrl);
    tr.appendChild(cell);
    table.appendChild(tr);
  }
  card.appendChild(table);
  if (voApi) card.appendChild(voApi.el);
  if (transApi) {
    const tOuter = el("div", "trans-outer");
    tOuter.appendChild(el("span", "trans-title", "transition"));
    tOuter.appendChild(transApi.el);
    card.appendChild(tOuter);
  }
  if (groundSel) {
    const gRow = el("div", "ground-row");
    gRow.appendChild(el("span", "ground-label", "background"));
    gRow.appendChild(groundSel);
    card.appendChild(gRow);
  }
  if (childApi) card.appendChild(childApi.el);
  if (decoApi) card.appendChild(decoApi.el);

  // Detached first paint (best-effort so the card has content immediately); the
  // settle rAF re-renders it once attached so tilt/measured reveals are correct.
  render(
    current,
    childApi ? (childApi.snapshot() ?? []) : [],
    decoApi ? (decoApi.snapshot() ?? []) : [],
  );
  refreshers.push(() =>
    render(
      current,
      childApi ? (childApi.snapshot() ?? []) : [],
      decoApi ? (decoApi.snapshot() ?? []) : [],
    ),
  );

  stage.addEventListener("mouseenter", replay);
  // Leaving an out-bearing card mid-cycle immediately restores its static shot.
  stage.addEventListener("mouseleave", () => {
    if (tl && hasOut) {
      replayToken++;
      tl.time(resetTime);
      tl.pause();
    }
  });

  const snapshot = (): CardSnapshot | null => {
    const params = readMainForm();
    if (!params) return null;
    const kids = childApi ? childApi.snapshot() : [];
    if (childApi && kids === null) return null;
    const decos = decoApi ? decoApi.snapshot() : [];
    if (decoApi && decos === null) return null;
    const transition = transApi?.snapshot();
    return {
      name,
      params,
      children: kids ?? [],
      decorations: decos ?? [],
      ...(groundSel && groundSel.value
        ? { ground: groundSel.value as FrameGround }
        : {}),
      ...(transition ? { transition } : {}),
      ...(voApi ? { vo: voApi.snapshot() } : {}),
    };
  };

  return { el: card, snapshot };
};

/** Clear the per-mount refresher queue (call before (re)building a mount's cards). */
export const resetRefreshers = (): void => {
  refreshers.length = 0;
};

// Scale each 1920×1080 frame to fit its (responsive) card width. `root` scopes the
// query so the engine works inside a Shadow DOM (where document.querySelectorAll
// can't see the mounted subtree) — defaults to `document` for standalone use.
export const scaleFrames = (root: ParentNode = document): void => {
  root.querySelectorAll<HTMLElement>(".stage--frame").forEach((s) => {
    const inner = s.querySelector<HTMLElement>(".stage-inner");
    if (inner) inner.style.transform = `scale(${s.clientWidth / 1920})`;
  });
};

// Re-settle every card once it's ATTACHED + laid out — the fix for the "renders
// correctly only after I touch it" behavior: a detached card mis-settles gsap.
// Call once, after the page's cards are appended. Returns a teardown that removes
// the resize listener (so a React unmount doesn't leak it).
export const settleAfterAttach = (root: ParentNode = document): (() => void) => {
  const onResize = (): void => scaleFrames(root);
  requestAnimationFrame(() => {
    scaleFrames(root);
    for (const r of refreshers) r();
  });
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
};
