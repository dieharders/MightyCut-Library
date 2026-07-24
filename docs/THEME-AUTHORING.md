# Theme Authoring Guide

How to create a new theme for the re-usable component library, wire it up, and prove it works.
Written to be followed start-to-finish by an agent or a human with no prior context.

A theme is **look only**. It never adds structure, never adds behavior, and never adds motion
— those are shared and identical under every theme via component primitives. What a theme brings is: ten colours, a
type scale, one CSS skin per element, an optional structure override here and there, one
signature backdrop design, and its own four decoration families.

Reference implementations: `src/components/themes/block/` (neobrutalist, light) and
`src/components/themes/future/` (sci-fi, dark). Read both before starting — they are the same
theme contract answered two opposite ways.

---

## 1. The model in one page

Every slide is a **treatment** (a whole-slide archetype: `cover`, `stat-grid`, `timeline`, …)
composed of **components** (leaf pieces: `stat`, `card`, `step`, …). Each is authored as a
"trio" folder — `template.html` + `schema.ts` + `anim.ts` + `index.ts` — and is **shared by
every theme**. A theme supplies the CSS those class names resolve against.

| Shared — never per-theme                                                                                | Theme-owned                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `template.html` markup + markers, `schema.ts` params, `anim.ts` motion (`primitives/*`, `treatments/*`) | one skin CSS per element (`themes/<t>/<element>.css`, wired through `skins`)                                                                           |
| the 10 palette **roles** (`src/types/palette.ts`)                                                       | which colour fills each role (`palette`)                                                                                                               |
| the 10 treatments (`FRAME_TREATMENTS`), the reveal cascade + slot timing (`runtime/treatment.ts`)       | the frame base (`frame.css`), fonts, `groundDefault`                                                                                                   |
| the transition catalog (`src/types/transitions.ts`, `runtime/transitions.ts`)                           | which backdrop design is the default (`backdrop`) + the ink hooks that restyle every design                                                            |
| the backdrop design **pool** (`primitives/backdrops.ts`) — any theme may use any design                 | its **own four decoration families** + shape engine (no other theme may roster them)                                                                   |
| the decoration _placement_ schema (`primitives/decoration-placement.ts`)                                | structure overrides (`templates/*.html`), showcase copy (`examples`, `typography`, `rules`), `previewBg`/`previewScheme`, `suppressDefaultDecorations` |

### Non-negotiable rules

1. **All 10 palette roles are defined.** There is no "unset" role.
2. **A skin never writes a colour.** No hex, no `rgb()`/`rgba()`. Name a role
   (`var(--primary)`) and derive lighter/darker/translucent with `color-mix()`.
   Enforced: `registry.test.ts` → _"$name's skins carry no hex/rgb literal"_.
3. **A theme skins every element it renders.** Trios carry no CSS of their own; an unskinned
   element renders completely unstyled — and still passes a "does it compose" smoke.
   Enforced: `theme-parity.test.ts` → _"skin coverage"_.
4. **rem on a 0.125rem grid.** Never px for geometry (see §5).
5. **A theme adds no motion code.** If you want movement, it belongs in a backdrop design or
   a decoration, not in a skin.
6. **Decorations are exclusive; backdrops are shared.** Your four decoration families are
   yours alone. Your signature backdrop goes into a common pool every theme can draw from.

---

## 2. Params — everything that drives a theme at video creation time and runtime

### Palette roles (`src/types/palette.ts`)

Ten CSS custom properties, canonical order. A skin addresses a role; the active theme decides
the hex. One colour may fill several roles; the showcase UI
de-dupes by hex via `uniquePaletteEntries`, first role wins.

```
--primary --secondary --accent-1 --accent-2 --accent-3 --muted-1 --muted-2 --muted-3 --light --dark
```

`ACCENT_CYCLE` = `primary → secondary → accent-1 → accent-2`, the order a repeated list walks
when colouring rows (stat-grid's dots, feature-card icons). A treatment may deviate
deliberately; the cycle is the default, not a law.

The same ten names are also the **ground** enum (`FRAME_GROUNDS`) and the **accent** enum on
every param that takes a colour.

### Scene-level knobs

| Knob         | Set in                                                                    | Values                               | Resolution                                                                                         |
| ------------ | ------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `ground`     | storyboard `options.ground` / deck `scene.ground`                         | any palette role                     | scene → `theme.groundDefault` → treatment's canonical `ground` (`runtime/treatment.ts: groundFor`) |
| `backdrop`   | storyboard `options.backdrop` / deck `scene.backdrop` / spec `background` | a `BACKDROP_NAMES` design            | scene → `theme.backdrop` → `plain`                                                                 |
| `transition` | storyboard `options.transition` / deck `scene.transition`                 | `{animIn, animOut, timeIn, timeOut}` | caller → the treatment's own defaults                                                              |

### Element-level knobs

| Knob                | Applies to                                        | Values                                       |
| ------------------- | ------------------------------------------------- | -------------------------------------------- |
| `accent`            | stat, card, pill, icon, caption, every decoration | a palette role                               |
| `animIn` / `timeIn` | any component (whole-element entrance)            | `TRANSITION_NAMES` / `TIMING_PRESETS`        |
| `variant`           | a decoration                                      | that family's own disjoint shape list        |
| `x`, `y`            | a decoration                                      | 0–100, page-space percent (0/0 = top-left)   |
| `size`              | a decoration                                      | percent of the 1920 design width (max 60)    |
| `rotate`            | a decoration                                      | −180…180 degrees                             |
| `layer`             | a decoration                                      | `back` (behind content) \| `front` (over it) |

### Transitions (`src/types/transitions.ts`)

Names: `none · fade · rise · fall · scale · pop · slide-left · slide-right · slide-up ·
slide-down · wipe`. Durations: `short` = 1s, `medium` = 3s, `long` = 5s (`TIMING_SECONDS`).
A **component** carries an entrance only; a **treatment** carries a whole-page IN and OUT.

### Custom properties a treatment emits and your skin must honour

A treatment's `layout()` sets these on its root; your skin decides what they mean visually.

| Prop            | Emitted by                  | Meaning                                                                                                                            |
| --------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--cols`        | stat-grid, feature-cards, … | column count (`repeat(var(--cols, 3), 1fr)`)                                                                                       |
| `--dense`       | stat-grid at 4+ children    | boolean hook for look changes a ratio can't express (tighter gap/padding)                                                          |
| `--dense-scale` | stat-grid at 4+ children    | figure shrink ratio — use as `font-size: calc(<your base> * var(--dense-scale, 1))` so you state your own scale, not two absolutes |
| `--dot`         | stat (and siblings)         | the instance's chosen accent role; block paints the corner dot with it, future paints the numeral                                  |

### Backdrop ink hooks

Every shared mask paints through `var(--<design>-ink, var(--dark))`. Set all four in your
`frame.css` — this is how you restyle a design someone else authored (§7).

```
--dot-ink   --grid-ink   --hatch-ink   --wash-ink
```

### Animation timing vocabulary (read-only for a theme)

`AnimTime` is `line` (Nth VO line) | `index` | `leadIn` | `slot` (ordered cascade slot, what
treatments actually emit) | `seconds` (page entrance only). Never hardcode seconds for content.

---

## 3. HTML structure — the marker contract

Templates are flat, viewable vanilla HTML. Build-time markers (consumed by
`runtime/dom.ts`, all stripped from the output):

| Marker             | Meaning                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `data-slot="name"` | text injection point. Escaped. An empty/null value **removes the element** (`pruneRemoved`) — that's how optional slots (subtitle, counter, cta) self-remove |
| `data-html="name"` | raw-HTML injection (inline SVG); used by `icon`                                                                                                              |
| `data-anim="id"`   | animatable target. Stamped to class `.<idPrefix>-<id>`; anim descriptors address it by the bare `id`                                                         |
| `data-children`    | a treatment's child region. **Exactly one** per treatment template                                                                                           |

Root class = the element's own name. A treatment's root also carries the shared page-wrapper
class:

```html
<!-- treatments/stat-grid/template.html -->
<div class="block-frame stat-grid">
  <div class="body">
    <h3 data-slot="headline" data-anim="headline">Headline</h3>
    <div class="row" data-children></div>
  </div>
</div>
```

`.block-frame` is the shared page wrapper under **every** theme (the name is historical — read
it as "frame"). The emitter stamps the ground background onto it, and a tripwire asserts every
scene carries `.<compId>-root .block-frame`. Your `frame.css` styles it.

### Template overrides (`ThemeTokens.templates`)

When CSS genuinely can't reach the structure (future's quote needs a quote mark; its stat has
no dot), a theme may supply a replacement template keyed by element name. The override:

- **may** re-wrap, rename, or ADD nodes;
- **may not** drop a `data-slot` — the schema field survives, so the editor keeps rendering a
  control that silently does nothing (future's cover and quote both did this with `eyebrow`).
  Style an unwanted slot away instead; it already self-removes when empty;
- **may not** drop a `data-anim` id that a descriptor targets — that reveal silently no-ops.

Both are enforced generically in `theme-parity.test.ts` → _"anim-target resolution"_.

---

## 4. Animation — what a theme may and may not touch

Motion is a JSON-serializable `AnimDescriptor` (`{kind, target, time, opts}`) interpreted by
`MC.applyAnims` (in `assets/fx/mc.js`) — the **same interpreter** in the MP4 render, the web
preview, and the showcase, which is why the showcase is WYSIWYG.

Kinds: `riseIn · fadeIn · staggerIn · scaleIn · from · rule · float · countUp · growBar ·
backdrop`.

Two rules matter to a theme author:

- **One reveal per box.** Every `REVEAL_KIND` (`riseIn`, `fadeIn`, `scaleIn`, `staggerIn`,
  `from`) compiles to a `tl.from()` on the element's own opacity. Two on one element make
  GSAP's `immediateRender` sample the first's from-state (opacity 0) as the second's END
  value — the element reveals, then vanishes for good. `runtime/component.ts` dedupes at build
  time, `mc.js` re-checks at runtime. Don't try to work around it in CSS.
- **Determinism.** No `Math.random`, `Date.now`, `setTimeout`/`setInterval`, rAF,
  `repeat: -1`, or any async/external load. Seeds come from `compId`; randomness via
  `MC.seededRandom`; WebGL only via `MC.glContext`. `scrubDeterminism` fails the build
  otherwise, and every scene must rebuild byte-identically.

A theme adds **no** anim code. If your look needs movement, it belongs in an animated backdrop
design (§7) or a decoration (§8).

---

## 5. CSS — how skins are written

Author each skin under the element's semantic class, in its own file
`themes/<theme>/<element>.css`, imported as text in `theme.ts` and wired into `skins`.

**Scoping is automatic.** Every sub-composition is imported into ONE shared DOM, so semantic
class names would cross-match between scenes. `scopeCss` prefixes every rule with the scene's
`.<compId>-root`. Never hand-scope, never nest.

**Flat rules only** — selectors + declarations, no nested at-rules. `scopeCss` is a simple
tokenizer and a test guards the assumption. rem needs no `@media`/`@container`.

**rem on the 0.125rem grid.** At the 1920 design size 1rem = 16px, so every 0.125rem multiple
lands on an even pixel (minimises sub-pixel jitter on rotated elements), and the render
document sets a viewport-derived root font-size so authored numbers are canvas-relative. For
sizes computed from params use `remGrid(n)` (`runtime/css.ts`). Sub-pixel _raster_ effects (a
1px hairline gradient stop, a text-shadow blur) may stay px on purpose.

**Colours are roles, always.** Anything lighter/darker/translucent is `color-mix()`:

```css
/* themes/future/stat.css — a glass panel with no colour literal anywhere */
.stat {
  border: 0.125rem solid color-mix(in srgb, var(--primary) 16%, transparent);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--light) 6%, transparent),
      color-mix(in srgb, var(--dark) 16%, transparent)
    ),
    color-mix(in srgb, var(--muted-3) 55%, transparent);
  border-radius: 1.25rem;
  padding: 2.25rem;
}
.stat-number {
  font-family: var(--disp);
  font-size: calc(6.5rem * var(--dense-scale, 1)); /* honour the density hook */
  color: var(--dot, var(--primary)); /* honour the instance accent */
}
```

(`color-mix()` needs Chromium 111+; the pinned render shell is 131.)

**Skins are deduped by element name** (`collectCss`), so a stat-grid with five stats inlines
`.stat` exactly once, and `frame.css` exactly once per scene.

The same CSS serves three surfaces unchanged: the MP4 render, the showcase, and the web-UI
preview (which rewrites your `:root` tokens to `:host` to scope them into a shadow root —
`engine/mount.ts`).

---

## 6. Fonts & typography — a theme brings its own

**Type is part of a theme's identity, so pick the faces your design wants.** There is no
approved list to choose from: the shared pool of installed families simply grows as themes are
added, and a family is "already there" only by coincidence of an earlier theme having wanted
it. Check what's in `assets/fonts/` — if your face is present, name it; if not, add it. The
mechanics below are the same either way.

Fonts are **self-hosted, always**. The render forbids any external fetch, so a Google Fonts
`<link>` is never an option — in a theme, a showcase, or a preview. Everything is a local
variable `woff2`.

### Where the files live

All font files live in the library, in ONE place — never in a theme folder:

```
assets/
  fonts.css                    @font-face for the always-staged families (the chrome set:
                               every deck gets these, whatever its theme)
  fonts/
    <family>.woff2             every installed face, shared across themes
    <theme>-fonts.css          @font-face for the families ONE theme adds; staged only
                               for that theme's decks
```

`fonts.css` is the always-staged set — currently the four families the root chrome and the
first themes happened to need. Treat it as "what every deck already carries", not as a canon
to design within. Everything else is a per-theme sheet.

### Declaring your faces

A theme names families in exactly one place — its `fontTokens`, which generate the `:root`
type tokens. Skins only ever say `var(--disp)` / `var(--body)` / `var(--mono)`, so the same
skin re-types itself under a different theme:

```ts
const fontTokens: Record<string, string> = {
  disp: '"Bodoni Moda", serif',      // display / headlines
  body: '"Inter", sans-serif',       // paragraphs
  mono: '"JetBrains Mono", monospace', // labels, eyebrows, counters
};
```

Name as many roles as your design needs; three is the convention, not a limit.

### Adding a face that isn't installed yet

1. **Get the file.** Download the ready-made latin variable `woff2` (e.g. Google's gstatic
   build). Do **not** subset or re-generate it — no fonttools. Drop it in
   `assets/fonts/<family>.woff2`.
2. **Declare it** in `assets/fonts/<theme>-fonts.css` — the file name IS the wiring, the
   harness finds it by theme name. Follow an existing per-theme sheet: `url("<family>.woff2")`
   relative (the woff2 sit in the same directory), and **`font-display: block`** on every face
   so the deterministic renderer never captures a fallback-font frame.
3. **Render path: automatic.** `copyProjectAssets` copies every woff2 in `assets/fonts/` into
   every project, `stageThemeFonts` copies your `<theme>-fonts.css` →
   `<project>/assets/fonts/theme-fonts.css`, and `themeStagesAddonFonts` gates the extra
   `<link>` in the generated root. No harness code change — it keys off the file existing.
4. **Preview/showcase path: NOT automatic.** `scripts/gen-inline-fonts.mjs` inlines only
   `assets/fonts.css` into `CORE_FONTS_CSS`, which `engine/core-fonts.ts` injects
   document-level. A face declared in a per-theme sheet is absent there, so the web-UI preview
   and the showcase silently render it in a fallback while the MP4 is correct. Extend
   `gen-inline-fonts.mjs` to also inline your `<theme>-fonts.css`, and inject it from your
   `register-<theme>.ts`.
5. **Expect a red test.** `theme-parity.test.ts` → *"font coverage"* asserts every family your
   `:root` tokens name has a real `@font-face` behind it. A newly added family fails until
   step 4 is done — that failure is the point. Extend the check to cover your sheet once the
   face is genuinely injected; never widen it to silence the signal.

The root's preload list (`FONT_FILES` in the harness's `root-html.ts`) covers the
always-staged families. A per-theme face is linked but not preloaded; `font-display: block`
still keeps the render correct.

### Typography — your type scale

`ThemeTokens.typography` is your theme's own scale: an array of type ROLES (block and future
both ship five — display, section heading, stat figure, body, label), each with a token name,
a human spec line, a sample string, and self-contained inline CSS the showcase renders live.
It documents the scale and drives the showcase Typography section; the actual sizes your
slides use live in your skins. Sizes and weights are yours to choose — nothing is shared here
but the shape of the field.

---

## 7. Backdrops — one shared pool

A **ground** is the scene's base colour (a palette role). A **backdrop** is a full-bleed mask
painted over it, behind the content. Designs live in one shared registry
(`primitives/backdrops.ts`) and are listed in `BACKDROP_NAMES`:

| Design          | Kind                                 | Contributed by                  |
| --------------- | ------------------------------------ | ------------------------------- |
| `plain`         | no mask (bare ground)                | —                               |
| `dots`          | static ink dot-grid                  | block                           |
| `constellation` | **animated** seeded particle network | future                          |
| `gradient`      | static soft vertical wash            | ported from the old root chrome |
| `grid`          | static 4rem ruled line grid          | ported from the old root chrome |
| `hatch`         | static 45° stripes                   | ported from the old root chrome |

**Every theme may use every design.** A theme names one as its default
(`ThemeTokens.backdrop`) — that's its signature, not its property. A scene overrides the default per slide.

**How a design stays theme-neutral.** It never names a colour: static designs paint through
`var(--<design>-ink, var(--dark))`, and the animated one resolves its canvas colour from the
**active** theme's `--primary` at build time (`particleRgb`, because canvas 2D can't read CSS
custom properties). So restyling is a four-line job in your `frame.css`:

```css
.block-frame {
  --dot-ink: var(
    --primary
  ); /* future: cyan dots read on navy; block: black on pastel */
  --grid-ink: var(--primary);
  --hatch-ink: var(--primary);
  --wash-ink: var(--primary);
}
```

Set all four even when the default (`var(--dark)`) is what you want — the hook is the knob,
and a theme that leaves it implicit teaches the next author nothing.

### Contributing a new design

Add it to `BACKDROPS` in `primitives/backdrops.ts` and to `BACKDROP_NAMES` in
`src/types/storyboard.ts`. A design returns a mini-dom node + CSS + anims:

```ts
const scanlines: BackdropDesign = {
  name: "scanlines",
  build: () => ({
    node: rootElement(`<div class="mc-backdrop mc-backdrop--scanlines"></div>`),
    css: `${BACKDROP_BASE}
.mc-backdrop--scanlines {
  opacity: 0.12;
  background-image: repeating-linear-gradient(
    0deg, var(--scan-ink, var(--dark)) 0, var(--scan-ink, var(--dark)) 0.125rem,
    transparent 0.125rem, transparent 0.5rem);
}`,
    anims: [], // static; an animated design returns a `backdrop`-kind descriptor
  }),
};
```

An **animated** design returns one `{kind: "backdrop", target: "<compId>-bg", opts: {fn}}`
descriptor whose `fn` names an `MC.*` FX; `mc.js` runs it across the scene duration. Follow
`constellation`: scope the canvas class with `ctx.idPrefix` (backdrop anims aren't run through
`qualifyAnim`, and the render's selector is document-wide) and seed from `ctx.compId` so every
frame repaints identically.

---

## 8. Decorations — every theme brings its own four

Decorations are positioned page-space flourishes any treatment can carry
(`addDecorations()`). They are the **one** place a theme authors new components, and the one
part of the system themes never share.

- Block: `starburst` (star·burst·triangle·circle) · `slab`
  (square·rectangle·rhombus·hexagon·cross) · `stripe` (stripe·bars·grid) · `badge`
  (shield·tag·ticket·capsule) — ink borders + hard offset shadows
  (`primitives/decoration-shapes.ts`).
- Future: `node` (ring·core·orbit·pulse) · `reticle` (brackets·crosshair·gauge·frame) ·
  `glyph` (hexagon·diamond·chevron·triangle) · `signal` (waveform·bars·beam) — hairline SVG
  strokes + glow (`primitives/future-decoration-shapes.ts`).

**Four families, disjoint variants.** No two families in a theme — and no two themes — render
the same shape. Ownership is two mechanisms: the intrinsic `decoration: true` flag holds every
family out of the showcase Components grid under _every_ theme, and only the owning theme
lists it in `ThemeTokens.decorations`. Nothing in the markup is theme-specific (they paint
with the shared roles), so the roster **is** the boundary.

**What you author:**

1. `primitives/<theme>-decoration-shapes.ts` — a `SHAPES` map, the
   `<THEME>_DECORATION_COMPONENTS` tuple, and a `<theme>DecorationComponent(name, example)`
   helper. Reuse `decorationSchema` from `primitives/decoration-placement.ts`; it owns the
   whole `variant`/`x`/`y`/`size`/`rotate`/`layer`/`accent` vocabulary and you only supply
   `variants`, `sizeDefault`, `accentDefault`, `accentDescription`.
2. Four one-file folders, `primitives/<family>/index.ts`, each calling that helper with its
   default placement.
3. Registration in `src/components/registry.ts`.
4. `decorations: [...<THEME>_DECORATION_COMPONENTS]` on your tokens.

Keep the **constant-ink** idiom: the outline/stroke weight is fixed and does NOT scale with
`size` (a large shape keeps a crisp edge), while the shadow/glow offset does.

**Defaults.** Treatments ship `defaultDecorations` (block's cover star, closing slab). If your
look lives elsewhere — future's constellation backdrop carries the whole mood — set
`suppressDefaultDecorations: true` so those off-theme shapes never auto-render or shift the
reveal cascade. An explicit `addDecorations()` always wins.

---

## 9. Theme file structure

```
src/components/themes/<name>/
  theme.ts            the ThemeTokens export (below)
  frame.css           .block-frame base + .body wrapper + base type + the four ink hooks
  <element>.css       one skin per element the theme renders — 23 files today:
                        13 components: stat card step agenda-item bar rank row
                                       caption pill cta list-number icon hud
                        10 treatments: cover feature-cards stat-grid closing-plate quote
                                       timeline comparison chart bar-ranking agenda
  templates/*.html    OPTIONAL structure overrides
```

Nothing else — no per-theme runtime code, no anim files, and **no fonts folder**: font files
are shared and live in `assets/fonts/` (§6), including a theme's own add-on
`<theme>-fonts.css`.

---

## 10. Copy-paste starter skeleton

### `themes/<name>/theme.ts`

```ts
import { NEON_DECORATION_COMPONENTS } from "../../primitives/neon-decoration-shapes";
import type { ThemeTokens } from "../../runtime/types";
import frameCss from "./frame.css" with { type: "text" };
// Component skins.
import agendaItemCss from "./agenda-item.css" with { type: "text" };
import barCss from "./bar.css" with { type: "text" };
import captionCss from "./caption.css" with { type: "text" };
import cardCss from "./card.css" with { type: "text" };
import ctaCss from "./cta.css" with { type: "text" };
import hudCss from "./hud.css" with { type: "text" };
import iconCss from "./icon.css" with { type: "text" };
import listNumberCss from "./list-number.css" with { type: "text" };
import pillCss from "./pill.css" with { type: "text" };
import rankCss from "./rank.css" with { type: "text" };
import rowCss from "./row.css" with { type: "text" };
import statCss from "./stat.css" with { type: "text" };
import stepCss from "./step.css" with { type: "text" };
// Treatment skins.
import agendaCss from "./agenda.css" with { type: "text" };
import barRankingCss from "./bar-ranking.css" with { type: "text" };
import chartCss from "./chart.css" with { type: "text" };
import closingPlateCss from "./closing-plate.css" with { type: "text" };
import comparisonCss from "./comparison.css" with { type: "text" };
import coverCss from "./cover.css" with { type: "text" };
import featureCardsCss from "./feature-cards.css" with { type: "text" };
import quoteCss from "./quote.css" with { type: "text" };
import statGridCss from "./stat-grid.css" with { type: "text" };
import timelineCss from "./timeline.css" with { type: "text" };

// The SINGLE source of this theme's colours: it generates :root AND drives every colour the
// UI shows. All 10 roles, canonical order. A colour may fill several roles (the UI de-dupes).
const palette: NonNullable<ThemeTokens["palette"]> = [
  { name: "Magenta", hex: "#FF2E88", varName: "primary" },
  { name: "Lime", hex: "#B8FF3C", varName: "secondary" },
  { name: "Amber", hex: "#FFC53D", note: "CTA", varName: "accent-1" },
  { name: "Violet", hex: "#9D6BFF", varName: "accent-2" },
  { name: "Violet", hex: "#9D6BFF", varName: "accent-3" },
  { name: "Slate", hex: "#8A93A6", note: "body text", varName: "muted-1" },
  { name: "Ink", hex: "#12131A", note: "canvas", varName: "muted-2" },
  { name: "Panel", hex: "#1B1D27", note: "panel fill", varName: "muted-3" },
  { name: "Paper", hex: "#F5F6FA", note: "text", varName: "light" },
  { name: "Void", hex: "#06070B", varName: "dark" },
];

/** The only :root entries that aren't colours — this theme's own faces (§6). A family
 *  already installed in assets/fonts/ needs no wiring; a new one needs its woff2 +
 *  a <theme>-fonts.css + engine inlining. */
const fontTokens: Record<string, string> = {
  disp: '"Space Grotesk", sans-serif',
  body: '"Inter", sans-serif',
  mono: '"JetBrains Mono", monospace',
};

/** :root, derived — every hex written down exactly once. Copy verbatim. */
const tokensCss = `:root {\n${[
  ...palette.map((p) => `  --${p.varName}: ${p.hex.toLowerCase()};`),
  ...Object.entries(fontTokens).map(
    ([name, value]) => `  --${name}: ${value};`,
  ),
].join("\n")}\n}\n`;

export const neonTheme: ThemeTokens = {
  name: "neon",
  title: "NeonFrame",
  description:
    "One paragraph on the visual language. Frame unit: 1920×1080, 16:9.",
  css: tokensCss,
  frameCss,
  groundDefault: "muted-2", // omit if each treatment keeps its canonical ground
  backdrop: "grid", // this theme's DEFAULT design from the shared pool
  previewBg: "#12131a", // showcase/editor stage colour (a concrete hex)
  previewScheme: "dark", // declared, never inferred from previewBg
  suppressDefaultDecorations: true, // set when your look doesn't want block's default shapes
  skins: {
    // components (13)
    hud: hudCss,
    caption: captionCss,
    "agenda-item": agendaItemCss,
    bar: barCss,
    card: cardCss,
    cta: ctaCss,
    icon: iconCss,
    "list-number": listNumberCss,
    pill: pillCss,
    rank: rankCss,
    row: rowCss,
    stat: statCss,
    step: stepCss,
    // treatments (10)
    agenda: agendaCss,
    "bar-ranking": barRankingCss,
    chart: chartCss,
    "closing-plate": closingPlateCss,
    comparison: comparisonCss,
    cover: coverCss,
    "feature-cards": featureCardsCss,
    quote: quoteCss,
    "stat-grid": statGridCss,
    timeline: timelineCss,
  },
  // templates: { stat: statTemplate },   // only where CSS can't reach the structure
  palette,
  typography, // 5 roles — see block/theme.ts for the shape
  rules, // do / dont bullets for the showcase
  examples, // per-treatment on-theme sample copy (showcase only)
  decorations: [...NEON_DECORATION_COMPONENTS],
};
```

### `themes/<name>/frame.css`

```css
.block-frame {
  position: absolute;
  inset: 0;
  overflow: hidden;
  /* How this theme restyles the shared backdrop designs. Always state all four. */
  --dot-ink: var(--primary);
  --grid-ink: var(--primary);
  --hatch-ink: var(--primary);
  --wash-ink: var(--primary);
  container-type: size;
  font-family: var(--disp);
  color: var(--light);
}
.block-frame > .body {
  position: absolute;
  inset: 0;
  z-index: 3;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.block-frame .eyebrow {
  display: inline-block;
  align-self: flex-start;
  font-family: var(--mono);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 1.625rem;
  color: var(--primary);
}
.block-frame h3 {
  font-family: var(--disp);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.05;
  margin: 0;
}
```

### `primitives/<name>-decoration-shapes.ts` (stub)

```ts
import { component } from "../runtime/component";
import { decorationSchema, type DecoParams } from "./decoration-placement";

export const NEON_DECORATION_COMPONENTS = [
  "prism",
  "arc",
  "beam",
  "grate",
] as const;

export const NEON_DECORATION_VARIANTS = {
  prism: ["wedge", "shard", "spike"],
  arc: ["half", "quarter", "ring"],
  beam: ["ray", "fan", "sweep"],
  grate: ["slats", "mesh", "louvre"],
} as const satisfies Record<
  (typeof NEON_DECORATION_COMPONENTS)[number],
  readonly string[]
>;

const SHAPES: Record<string, (stroke: string, accent: string) => string> = {
  wedge: (s) => `<path d="M10 90 L50 10 L90 90 Z" ${s}></path>`,
  // …one entry per variant above, authored in a square 0..100 viewBox
};

/** Build one family over the shared placement schema (accent tints, x/y/size/rotate/layer). */
export const neonDecorationComponent = (name: string, example: DecoParams) =>
  component({
    name,
    decoration: true, // intrinsic — keeps it out of every grid
    schema: decorationSchema({
      variants:
        NEON_DECORATION_VARIANTS[name as keyof typeof NEON_DECORATION_VARIANTS],
      sizeDefault: 20,
      accentDefault: "primary",
      accentDescription: "Palette role for the stroke + glow",
    }),
    template: `<div class="deco" data-anim="item"><span data-html="svg"></span></div>`,
    example,
    // rawFill → SHAPES[variant], layout → placement custom props, css → the family skin
  });
```

Then four files like `primitives/prism/index.ts`:

```ts
import { neonDecorationComponent } from "../neon-decoration-shapes";
export const Prism = neonDecorationComponent("prism", {
  variant: "wedge",
  x: 50,
  y: 50,
  size: 20,
  rotate: 0,
  layer: "back",
  accent: "primary",
});
```

Copy the real bodies from `decoration-shapes.ts` (solid/box shapes) or
`future-decoration-shapes.ts` (SVG stroke shapes), whichever is closer to your look.

---

## 11. Wire it up

| Step | Where                                                                                                              | What                                                                                                                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | `src/components/themes/all.ts`                                                                                     | add your tokens to `ALL_THEMES` — **this alone turns on the whole generic test contract**                                                                                                              |
| 2    | `src/engine/load-theme.ts`                                                                                         | add the name to `THEMES` + a `case` importing `./register-<name>`                                                                                                                                      |
| 3    | `src/engine/register-<name>.ts`                                                                                    | copy `register-future.ts`: `import "../components/registry"`, `injectCoreFonts()`, return your tokens                                                                                                  |
| 4    | `src/components/registry.ts`                                                                                       | register your four decoration families                                                                                                                                                                 |
| 5    | `assets/fonts/` + `scripts/gen-inline-fonts.mjs` — **only if** your faces aren't installed yet                     | see §6: drop the woff2 in, ship `assets/fonts/<theme>-fonts.css`, then inline it for the browser engine. Naming already-installed families ⇒ skip this step                                            |
| 6    | harness `src/types/storyboard.ts`                                                                                  | add the name to `FRAME_THEME_NAMES`                                                                                                                                                                    |
| 7    | harness `src/pipeline/generate-content.ts`                                                                         | `FRAME_TO_THEME[<name>] = "<name>"` + a one-line blurb in `THEME_SELECT_SYSTEM` so the auto-selector can pick it                                                                                       |
| 8    | WebUI `src/lib/themes.ts`                                                                                          | add label + blurb; generate the card image with `bun src/scripts/gen-theme-previews.ts` in the harness                                                                                                 |
| 9    | consumers                                                                                                          | `pnpm build:engine` here, then bump the `packages/library` submodule pointer in the harness and the WebUI                                                                                              |

---

## 12. Tests — where and what

**A ported theme needs no new test file for the shared contract.** Adding it to `ALL_THEMES`
subjects it to every sweep in `src/components/theme-parity.test.ts`:

| Sweep                             | Catches                                                                                                   |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| skin coverage                     | an element you forgot to skin (renders unstyled but still "composes")                                     |
| skins keys ⊆ registry             | a typo'd skin key that silently styles nothing                                                            |
| anim-target resolution            | a dead anim descriptor; a template override that drops a targeted `data-anim`                             |
| per-theme scene smoke             | all 10 treatments build well-formed, determinism-clean, byte-identical on rebuild                         |
| shared backdrop pool              | every design paints under your theme (a design that reads a theme-specific token fails here)              |
| default backdrop                  | your `backdrop` names a registered design                                                                 |
| decoration ownership              | your roster is non-empty, all registered, `decoration`-flagged, and **disjoint from every other theme's** |
| `suppressDefaultDecorations` gate | the flag actually suppresses (or doesn't)                                                                 |
| ground resolution                 | `groundDefault` pins every treatment; an explicit scene ground still wins; no `background: … !important`  |
| caption alignment parity          | your caption doesn't drift from the reference                                                             |
| font coverage                     | you named a family with no `@font-face` in the staged set                                                 |
| palette completeness              | all 10 roles filled                                                                                       |

Add theme-SPECIFIC cases to `src/components/registry.test.ts` — one `describe` per theme, in
the shape of the existing `future theme (tripwire)` block: your template overrides preserve
their slots, your decoration families render their shapes and have disjoint variant lists,
your roster matches your own families, and your `examples` compose.

Then run the real thing:

```bash
# library
pnpm typecheck && pnpm test && pnpm build:engine

# harness (from the MightyCut repo) — a real 1920×1080 render per live theme
bun run typecheck && bun test
MC_WORKSPACE_ROOT=/tmp/mc-comp bun src/scripts/component-smoke.ts <theme>   # scaffold → lint → inspect → render → ffprobe
MC_WORKSPACE_ROOT=/tmp/mc-comp bun src/scripts/deck-smoke.ts <theme>        # the editor's deck rebuild loop
```

Both smokes iterate `COMPONENT_THEME_NAMES`, which derives from `ALL_THEMES` — so step 1 of
§11 enrolls your theme in them automatically.

**Finally, look at it.** Snapshot each treatment and eyeball the stills; design work needs
visual iteration that no tripwire replaces:

```bash
pnpm exec hyperframes snapshot "<workspace>/jobs/<job>/project" --at 1,3,5,7,9   # writes a contact sheet too
```
