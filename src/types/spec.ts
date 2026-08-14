// VideoSpec — the single source of truth for what a generated video contains.
// The LLM produces this JSON; the harness generators render it to HyperFrames
// HTML; the Pi agent customizes the slide sub-compositions. There is no longer a render-side
// MIRROR to keep in sync: a slide's `kind` IS its treatment, so this union's discriminator and
// the look vocabulary in types/spec-treatments (LOOKS) are the same list, and a tripwire asserts
// it rather than a map reconciling two. (The modules this note used to name —
// pipeline/theme-css.ts, pipeline/slide-templates.ts' kind dispatch, and
// defaultTreatmentForKind — are all deleted; every theme is a component theme now.)
//
// Every `.describe()` in this file is PROMPT COPY, not documentation: the whole schema
// ships verbatim to the writer via z.toJSONSchema(VideoSpecSchema). Edit them as
// instructions to a model, and keep them true — a stale one steers every create.
import { z } from "zod";
import { FRAME_THEME_NAMES } from "./storyboard";
import { TransitionSpecSchema } from "./transitions";

const id = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/, "ids are lowercase kebab-case");

export const VOLineSchema = z.object({
  id,
  slideId: id,
  /** Caption text shown on screen. */
  text: z.string().min(1).max(220),
  /** Optional spoken override (phonetic spelling for acronyms etc.). */
  say: z.string().min(1).optional(),
});
export type VOLine = z.infer<typeof VOLineSchema>;

/**
 * The per-slide SECTION LABEL, drawn in the HUD's top-right corner and NOWHERE ELSE.
 *
 * ONE definition, reused by every slide kind that can carry one, because the alternative is a
 * set of near-identical `.describe()` strings that drift — and these strings are PROMPT COPY,
 * not documentation: `z.toJSONSchema(VideoSpecSchema)` ships them verbatim inside the buildSpec
 * prompt, so a stale one is an active instruction to the writer on every create. That is not
 * hypothetical. The title slide's copy used to read "The cover's EYEBROW — a short label in a
 * pill above the headline", describing a cover slot that no longer exists; while it did exist,
 * the harness fed this one field to BOTH the eyebrow and the corner, so every deck's opening
 * frame printed its section name twice. The slot is gone (treatments/cover), and this field
 * means only the corner.
 *
 * Kinds with a `header` object hold it at `header.kicker`; the four without one (cover,
 * statement, outro, custom) hold it top-level. The renderer reads
 * `slide.header?.kicker ?? slide.kicker`, so a header — where there is one — WINS. Coverage is
 * deliberately total: every kind has somewhere to put it, which is what lets the plan editor
 * offer the field on every row and the harness route it with one rule instead of a per-kind
 * exclusion list (a list would have to be mirrored across three repos, and would rot).
 */
const sectionKicker = z
  .string()
  .max(60)
  .optional()
  .describe(
    'Short section label for the HUD top-right corner (e.g. "RESULTS", "HOW IT WORKS") — which PART of the deck this slide is in, not a restatement of its own title. Consecutive slides in the same section share one label. It is NOT printed on the slide itself. This is the ONLY source for that corner: a slide that omits it leaves the corner empty, so set one on every slide where a section applies.',
  );

export const HeaderSpecSchema = z.object({
  kicker: sectionKicker,
  title: z.string().min(1).max(80),
});
export type HeaderSpec = z.infer<typeof HeaderSpecSchema>;

const transition = z
  .union([z.enum(["fade", "slide", "wipe"]), TransitionSpecSchema])
  .optional()
  .describe(
    "Transition INTO this slide — legacy fade|slide|wipe, or { animIn, animOut, timeIn, timeOut }",
  );

const backgroundKind = z.enum([
  "gradient",
  "particles",
  "grid",
  "solid",
  "pattern",
]);
/** Per-slide backdrop override (default: the deck-wide meta.background). */
const background = backgroundKind
  .optional()
  .describe("Backdrop behind this slide only (default: deck-wide background)");

const icon = z
  .string()
  .optional()
  .describe('Icon name from the core Icon set (e.g. "shield", "database")');

/* ----- reusable content shapes ------------------------------------------------ */

const StatSchema = z.object({
  value: z.number(),
  label: z.string().min(1).max(40),
  unitPrefix: z.string().max(6).optional().describe('Leading unit, e.g. "$"'),
  unitSuffix: z
    .string()
    .max(10)
    .optional()
    .describe('Trailing unit, e.g. "%", "x", "hrs"'),
  decimals: z.number().int().min(0).max(2).optional(),
});

const ListItemSchema = z.object({
  icon,
  text: z.string().min(1).max(110),
  detail: z.string().max(160).optional(),
});

export const CardContentSchema = z.object({
  kicker: z
    .string()
    .max(26)
    .optional()
    .describe('Small mono label above the text, e.g. "PROPERTY GRAPH"'),
  icon,
  title: z.string().max(40).optional(),
  text: z.string().min(1).max(150),
});

/**
 * The series payload, shared verbatim by the three chart looks — `bar-chart`, `bar-ranking`
 * and `trend-line`.
 *
 * It is SPREAD onto each slide rather than nested under a `chart` key, which made `chart` the
 * only kind in the union that buried its payload one level down. And it no longer carries a
 * `type: "bar" | "line"` discriminator: bar-vs-line is the LOOK, so the look's name says it.
 * That field was the single piece of slide DATA that decided which treatment could render a
 * slide, which is what forced a compatibility check on every pinned treatment — and the check
 * ran at scaffold time, long after the writer had independently chosen `type`, so a user who
 * asked for a line chart got bars whenever the two disagreed, silently.
 */
const seriesFields = {
  unitPrefix: z
    .string()
    .max(6)
    .optional()
    .describe('Leading unit on each value, e.g. "$"'),
  unitSuffix: z
    .string()
    .max(12)
    .optional()
    .describe('Trailing unit on each value, e.g. "%", "k"'),
  // Without this every value counts up through toFixed(0), so a series of 0.5 and 1.2
  // renders "$1B" on BOTH bars — not merely rounded, but indistinguishable, on a slide
  // whose entire job is comparing them. Set it whenever the series has a fractional part.
  decimals: z
    .number()
    .int()
    .min(0)
    .max(2)
    .optional()
    .describe(
      "Decimal places on every value — REQUIRED when any value is fractional (1.2 reads as 1 without it)",
    ),
  series: z
    .array(z.object({ label: z.string().min(1).max(28), value: z.number() }))
    .min(2)
    .max(8),
  caption: z.string().max(140).optional(),
} as const;

/** The numbered-step payload, shared by the two sequence looks — `timeline` and `agenda`.
 *  Same data, two ways of drawing it: stepped cards that explain each step, or a sparse
 *  index that only names them. */
const stepsField = z
  .array(
    z.object({
      icon,
      title: z.string().min(1).max(36),
      text: z.string().max(100).optional(),
    }),
  )
  .min(2)
  .max(5);

// NOTE: the `composed` kind — a fixed multi-slot layout (LAYOUTS_META / COMPONENT_TYPES /
// SlotSchema) — was REMOVED, along with its pixel geometry in the harness's pipeline/layouts.ts.
// It never had a treatment and could not get one: every treatment in the library composes into
// ONE data-children container, while a composed slide needed 2-4 heterogeneous slots across six
// layouts. So it was a kind that always rendered as a placeholder — a second escape hatch beside
// `custom`, which is the only one there should be. Anything the library can't compose is a
// `custom` slide, hand-built by the slide engineer. Do not re-add it as a spec kind unless the
// treatment runtime grows real multi-slot support first.

export const SlideSpecSchema = z.discriminatedUnion("kind", [
  z.object({
    id,
    kind: z.literal("cover"),
    transition,
    // The HUD corner label, and nothing else. It USED to be double-duty — the cover treatment's
    // eyebrow pill was filled from this same field — so a section name landed on the opening
    // frame as well as in the corner, printing twice. The cover's eyebrow slot is gone; if the
    // cover ever wants a label of its own it needs its own field, not this one.
    kicker: sectionKicker,
    title: z.string().min(1).max(80),
    subtitle: z.string().max(140).optional(),
    background: backgroundKind,
  }),
  z.object({
    id,
    kind: z.literal("list"),
    transition,
    background,
    header: HeaderSpecSchema,
    items: z
      .array(ListItemSchema)
      .min(2)
      .max(5)
      .describe(
        "2-5 short claims, one per line. Each is a sentence at most; `detail` adds a second line where one item needs it. When every item needs explaining, the look is `feature-cards`.",
      ),
  }),
  z.object({
    id,
    kind: z.literal("statement"),
    transition,
    background,
    // NOTE for anyone wiring the quote treatment's `eyebrow` param later: do NOT feed it from
    // here. It would print the section name on the card AND in the corner — exactly the bug the
    // cover had, which is why the cover's eyebrow slot was removed rather than re-plumbed. A
    // quote card that wants its own eyebrow needs its own field. spec-map passes none.
    kicker: sectionKicker,
    text: z.string().min(1).max(200),
    attribution: z.string().max(80).optional(),
  }),
  // The three chart looks. Identical payloads (`seriesFields`), three different drawings of
  // it — which is the whole reason a look is a name and not a data flag: the writer picks the
  // one whose SHAPE fits the data's meaning, and there is nothing left for the renderer to
  // second-guess. `bar-chart` compares unordered categories, `bar-ranking` puts an ORDER on
  // them, `trend-line` reads left-to-right through an ordered sequence.
  z.object({
    id,
    kind: z.literal("bar-chart"),
    transition,
    background,
    header: HeaderSpecSchema,
    ...seriesFields,
  }),
  z.object({
    id,
    kind: z.literal("bar-ranking"),
    transition,
    background,
    header: HeaderSpecSchema,
    ...seriesFields,
  }),
  z.object({
    id,
    kind: z.literal("trend-line"),
    transition,
    background,
    header: HeaderSpecSchema,
    ...seriesFields,
  }),
  z.object({
    id,
    kind: z.literal("comparison"),
    transition,
    background,
    header: HeaderSpecSchema,
    columns: z.tuple([z.string().min(1).max(36), z.string().min(1).max(36)]),
    rows: z
      .array(
        z.object({
          label: z.string().min(1).max(48),
          a: z.string().min(1).max(60),
          b: z.string().min(1).max(60),
        }),
      )
      .min(2)
      .max(5),
  }),
  z.object({
    id,
    kind: z.literal("stats"),
    transition,
    background,
    header: HeaderSpecSchema,
    stats: z
      .array(StatSchema)
      .min(1)
      .max(4)
      .describe("Big animated count-up numbers"),
    caption: z.string().max(140).optional(),
  }),
  z.object({
    id,
    kind: z.literal("timeline"),
    transition,
    background,
    header: HeaderSpecSchema,
    steps: stepsField.describe(
      "Numbered process steps, drawn as a connected card sequence — each step's `text` explains it",
    ),
  }),
  z.object({
    id,
    kind: z.literal("agenda"),
    transition,
    background,
    header: HeaderSpecSchema,
    steps: stepsField.describe(
      "The ordered parts of the presentation or event — its agenda, drawn as a numbered index or list. Titles carry it; `text` is an optional short qualifier (a duration, phase, tag, time), never an explanation",
    ),
  }),
  z.object({
    id,
    kind: z.literal("feature-cards"),
    transition,
    background,
    header: HeaderSpecSchema,
    layout: z
      .enum(["column", "row"])
      .optional()
      .describe("column (stacked, default) or row (side by side)"),
    cards: z.array(CardContentSchema).min(2).max(4),
  }),
  z.object({
    id,
    kind: z.literal("pill-wall"),
    transition,
    background,
    header: HeaderSpecSchema,
    // The floor is 6, not 2, and it is doing real work. A "wall" of three labels is a bulleted
    // list with the words taken out — the device only reads as a SET, seen at once rather than
    // read in order, once there are enough of them that no single one is the point. Below that
    // the writer wants `list` or `feature-cards`, which say what each item MEANS.
    pills: z
      .array(z.string().min(1).max(28))
      .min(6)
      .max(14)
      .describe(
        "Short labels, 1-3 words each — a SET taken in at a glance (tools, integrations, markets, capabilities). Not a list of claims: nothing here is explained, so use it only where the breadth IS the point.",
      ),
    caption: z.string().max(140).optional(),
  }),
  z.object({
    id,
    kind: z.literal("cluster"),
    transition,
    background,
    header: HeaderSpecSchema,
    hub: z
      .string()
      .min(1)
      .max(28)
      .describe(
        "The centre everything connects to — the product, the team, the platform",
      ),
    nodes: z
      .array(
        z.object({
          label: z.string().min(1).max(24),
          detail: z
            .string()
            .max(40)
            .optional()
            .describe("A short qualifier under the label"),
        }),
      )
      .min(3)
      .max(8)
      .describe(
        "The spokes, placed evenly clockwise from the top. Use this only for a genuine hub-and-spoke relationship — everything here must connect to the SAME centre. A flat list of features is `list` or `pill-wall`.",
      ),
    caption: z.string().max(140).optional(),
  }),
  z.object({
    id,
    kind: z.literal("team"),
    transition,
    background,
    header: HeaderSpecSchema,
    members: z
      .array(
        z.object({
          name: z.string().min(1).max(32),
          role: z
            .string()
            .min(1)
            .max(40)
            .describe(
              'What they do here, e.g. "Head of Research" — a title, not a biography',
            ),
          org: z
            .string()
            .max(32)
            .optional()
            .describe(
              "Their affiliation, ONLY when it differs from the deck's own",
            ),
        }),
      )
      .min(2)
      .max(5)
      .describe(
        "The people to introduce. Use ONLY names the prompt supplies — never invent a person, a title or an affiliation.",
      ),
    caption: z.string().max(140).optional(),
  }),
  z.object({
    id,
    kind: z.literal("matrix"),
    transition,
    background,
    header: HeaderSpecSchema,
    criteria: z
      .array(z.string().min(1).max(22))
      .min(2)
      .max(5)
      .describe("Capability column labels, terse"),
    rows: z
      .array(
        z.object({
          label: z.string().min(1).max(32),
          sublabel: z.string().max(50).optional(),
          values: z
            .array(z.boolean())
            .min(2)
            .max(5)
            .describe(
              "values[i] answers criteria[i] — same length as criteria",
            ),
          highlight: z
            .boolean()
            .optional()
            .describe("Mark the proposer's row true (put it last)"),
        }),
      )
      .min(2)
      .max(5)
      .describe("Check/cross capability matrix; the proposer row is accented"),
  }),
  z.object({
    id,
    kind: z.literal("custom"),
    transition,
    background,
    header: HeaderSpecSchema.optional(),
    // Carried top-level as WELL as inside the optional header, because the header is optional:
    // with only `header.kicker`, whether an approved section label rendered depended on whether
    // the writer happened to emit a header object at all — the same blueprint, the same label,
    // renders or doesn't on an unrelated model choice. It cannot be conjured server-side either,
    // since HeaderSpec's `title` is required and inventing one is inventing content. The reader
    // is `header?.kicker ?? kicker`, so a header still wins where one exists.
    kicker: sectionKicker,
    concept: z
      .string()
      .min(10)
      .max(400)
      .describe(
        "Plain-language description of the visual to build (the slide engineer hand-builds it)",
      ),
    data: z
      .array(
        z.object({
          label: z.string().min(1).max(24),
          value: z.string().max(24).optional(),
        }),
      )
      .max(6)
      .optional()
      .describe("Optional label/value pairs shown as pills"),
  }),
  z.object({
    id,
    kind: z.literal("outro"),
    transition,
    background,
    // The closing slide's corner label. It had NO slot of any kind until now — no header, no
    // kicker — so a section label on the last slide was silently dropped: every slide member is
    // a plain `z.object`, and Zod's default strip mode discards an unknown key without error, so
    // nothing ever surfaced the gap. The closing plate carries no eyebrow (it never has), so
    // unlike the cover there is no duplication risk here — the corner is the only place it goes.
    kicker: sectionKicker,
    title: z.string().min(1).max(80),
    cta: z.string().min(1).max(120),
    contact: z.string().max(120).optional(),
  }),
]);
export type SlideSpec = z.infer<typeof SlideSpecSchema>;

/**
 * The HUD brand band's CONTENT — and content only.
 *
 * Both remaining fields feed text the HUD cannot get anywhere else: `chromeHud` takes a
 * `brandName` and a `tagline`, and `meta.hud` carries booleans. Whether the band DRAWS is
 * `hud.brand`; whether the corner label draws is `hud.title`.
 *
 * Three fields were REMOVED, and the removals are all of a kind — a spec field is a control
 * only if something reads it:
 *  - `show` — a visibility flag, and a coarse one (it gated the band AND the top-right label
 *    together). Superseded by `hud.brand` / `hud.title`, which say the same thing separately.
 *  - `right` / `rightSub` — the deck-wide top-right label and its qualifier. `rightSub` never
 *    had a reader at all: the library HUD has no slot for it (the same defect that retired
 *    `footer.text`), so the writer was being asked on every create for a string that could not
 *    appear. `right` did render, as the fallback for a slide with no kicker of its own — but
 *    every slide kind now carries a `kicker`, plan mode deletes this field outright, and a
 *    deck-wide default is exactly what makes an intentionally blank corner show a stale label.
 *    The corner is now sourced from the per-slide kicker and nothing else.
 */
export const HeaderBandSchema = z.object({
  brand: z
    .string()
    .max(60)
    .optional()
    .describe("Left wordmark (default: meta.title)"),
  tagline: z
    .string()
    .max(60)
    .optional()
    .describe(
      "Muted descriptor after the wordmark — the company, product category, or program. MUST differ from the brand (never repeat it); omit if there's nothing distinct to say. Defaults to meta.requester, but a repeat of the brand is dropped at render.",
    ),
});
export type HeaderBandSpec = z.infer<typeof HeaderBandSchema>;

// `meta.footer` is GONE. It held one field, `slideNumbers`, and that was a visibility toggle
// living outside the schema that owns visibility: the root read it only as
// `hud.slideCount ?? footer.slideNumbers`, i.e. as a legacy fallback — while remaining the ONLY
// counter switch the writer was told about, so the two halves of one control were split across
// two objects. `hud.slideCount` is now the whole story, and the writer is instructed on it
// directly. (Its sibling `footer.text` was retired earlier for the harder reason: no HUD slot.)

// `backdrop` (blur | semi | solid | none) was REMOVED alongside footer.text and for the
// same reason: it only ever styled the root's inline fallback caption box, and the theme's
// own caption skin (theme.skins.caption) has owned that surface since the library took over
// the chrome.
//
// `meta.caption` IS NOW GONE ENTIRELY, and its last four style fields with it — `size`,
// `weight`, `outline` and `accentBar`. Unlike the fields above they did render (an inline
// font-size/weight on `.cap-text`, a `text-shadow` modifier, and dropping the `.cap-bar`
// element), but NOTHING COULD REACH THEM: no CLI flag, no web toggle, no field in the deck
// editor, and the polish agent is never told they exist. The writer model was their only
// possible author — and the prompt told it to omit them and let the theme's caption skin
// decide. A control whose sole author is instructed not to use it is not a control. The
// caption's look is now the theme's, full stop.
//
// Its fifth field, `show`, was the real one — the accessibility switch behind the web UI's
// caption toggle and the CLI's --hide-captions — and it moved into `hud` below rather than
// dying with the object: `regenerateRootIn` rebuilds the root from the on-disk spec.json alone
// (after every TTS run and every agent spec.json write) with no access to the job or its
// hudOverride, so a visibility bit that is not in the spec is a `--hide-captions` deck that
// quietly gets its captions back mid-build.

/**
 * Visibility toggles — the ONLY source of truth for what chrome renders, and now the only
 * place visibility lives at all.
 *
 * ONE default rule, no exceptions: every switch defaults to visible (omitted → shown),
 * `slideCount` included. It used to be the one opt-in switch, and nothing ever shipped it
 * off — three separate places conspired to force it back on (a `slideCount: true` seed on
 * the web create form, the writer prompt, the sample deck's own hand-set), each of which
 * only existed to defeat the exception. All three are gone with it, and the seed's
 * precedence subtlety went too (it had to layer UNDER a blueprint or it would outrank a
 * deck that deliberately turned the counter off).
 *
 * `header.show`, `footer.slideNumbers` and `caption.show` were all folded in here. Splitting
 * one control across two objects is what let the writer be told about `footer.slideNumbers`
 * while the caller's overrides were stamped onto `hud`, so the two could silently disagree —
 * and it is why `HudOverrideSchema` needed an `.extend()` and the orchestrator a special case
 * for the one toggle that lived elsewhere. Both are gone. `meta.header` keeps supplying HUD
 * *content* (brand/tagline) and nothing else.
 *
 * `captions` is stored here but is NOT part of the HUD: the caption rail is its own clip above
 * the HUD's, and the `show` master switch deliberately does NOT gate it — captions survive
 * `hud.show: false`, because hiding the chrome is a look and hiding the captions is an
 * accessibility decision. Only `captions: false` hides them. (root-html reads the two
 * independently; a tripwire pins it.)
 */
export const HudSchema = z.object({
  show: z
    .boolean()
    .optional()
    .describe(
      "Master switch — false hides the entire HUD (default true). Does NOT hide captions.",
    ),
  brand: z
    .boolean()
    .optional()
    .describe("Show the brand band (mark + wordmark + tagline)"),
  title: z.boolean().optional().describe("Show the top-right title/label"),
  progress: z.boolean().optional().describe("Show the timeline/progress bar"),
  slideCount: z
    .boolean()
    .optional()
    .describe('Show the "NN / TT" slide counter'),
  captions: z
    .boolean()
    .optional()
    .describe(
      "Show the voice-over caption rail (default true). An ACCESSIBILITY feature and the caller's to set — never turn it off unless asked.",
    ),
});
export type HudSpec = z.infer<typeof HudSchema>;

/**
 * Caller-controlled visibility overrides (Web UI toggles / CLI --hide-* flags), stamped onto
 * spec.meta after AI generation so they beat the model's choices.
 *
 * Now exactly `HudSchema`, plus strictness: it used to `.extend()` a `captions` key on because
 * that one toggle mapped into a different object (`meta.caption.show`). It doesn't any more,
 * so the caller's shape and the spec's shape are the same shape — which is what lets the
 * orchestrator stamp the whole thing with one spread instead of destructuring the odd one out.
 */
export const HudOverrideSchema = HudSchema.strict();
export type HudOverride = z.infer<typeof HudOverrideSchema>;

// NOTE: there are deliberately no MAX_SLIDES / MAX_VO_WORDS constants here.
// Deck length is GENERATION POLICY, not part of the visual contract — a deck's
// slide count and word budget follow from the caller's chosen runtime target,
// which only the harness knows. That policy lives in MightyCut's
// src/pipeline/brief.ts (word targets, per-job runtime caps); this schema keeps
// only the STRUCTURAL invariants below (title/outro bookends, unique ids, slot
// arity, narration coverage, VO ordering).

export const VideoSpecSchema = z
  .object({
    meta: z.object({
      title: z.string().min(1).max(90),
      requester: z.string().min(1).max(90),
      // The only themes are the self-contained frame themes (each a
      // video-assets/themes/<t>/ showcase + frame.css). Derived from the canonical
      // FRAME_THEME_NAMES so this enum, the storyboard schema, and FRAME_THEME_TOKENS
      // can't drift. Default standard (the neutral frame theme).
      theme: z.enum(FRAME_THEME_NAMES).default("standard"),
      // Microsoft Edge neural voices only (the TTS engine) — others fail.
      voice: z
        .enum([
          "en-US-GuyNeural",
          "en-US-ChristopherNeural",
          "en-US-EricNeural",
          "en-US-AriaNeural",
          "en-US-JennyNeural",
          "en-US-MichelleNeural",
        ])
        .optional(),
      // `fps` / `width` / `height` are GONE. They were required literals — 30 / 1920 / 1080,
      // the only values the schema ever accepted — so they carried no information: the writer
      // spent three fields of every spec restating a constant, and a repair round on any of
      // them was a round spent on nothing. Nothing consumed them either. The render canvas is
      // config.limits (what validateFinal probes) and the root's own 1920×1080 stage; the one
      // reader, specToDeck, merely copied them into a DeckMeta whose every field is optional
      // and which nothing reads back.
      background: backgroundKind
        .optional()
        .describe("Deck-wide backdrop behind every slide (default particles)"),
      header: HeaderBandSchema.optional(),
      hud: HudSchema.optional(),
    }),
    // No upper bound: the deck runs as many slides as its runtime target needs.
    // min(3) is structural — a cover and an outro with at least one slide between.
    slides: z.array(SlideSpecSchema).min(3),
    voiceover: z.array(VOLineSchema).min(3),
  })
  .superRefine((spec, ctx) => {
    if (spec.slides[0]?.kind !== "cover") {
      ctx.addIssue({
        code: "custom",
        path: ["slides", 0],
        message: "first slide must be kind 'cover'",
      });
    }
    if (spec.slides[spec.slides.length - 1]?.kind !== "outro") {
      ctx.addIssue({
        code: "custom",
        path: ["slides", spec.slides.length - 1],
        message: "last slide must be kind 'outro'",
      });
    }
    const slideIds = new Set(spec.slides.map((s) => s.id));
    if (slideIds.size !== spec.slides.length) {
      ctx.addIssue({
        code: "custom",
        path: ["slides"],
        message: "slide ids must be unique",
      });
    }
    // Matrix rows must answer every criteria column.
    for (const [i, slide] of spec.slides.entries()) {
      if (slide.kind !== "matrix") continue;
      for (const [r, row] of slide.rows.entries()) {
        if (row.values.length !== slide.criteria.length) {
          ctx.addIssue({
            code: "custom",
            path: ["slides", i, "rows", r, "values"],
            message: `row has ${row.values.length} values but there are ${slide.criteria.length} criteria`,
          });
        }
      }
    }
    const lineIds = new Set<string>();
    for (const [i, line] of spec.voiceover.entries()) {
      if (lineIds.has(line.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["voiceover", i, "id"],
          message: `duplicate line id '${line.id}'`,
        });
      }
      lineIds.add(line.id);
      if (!slideIds.has(line.slideId)) {
        ctx.addIssue({
          code: "custom",
          path: ["voiceover", i, "slideId"],
          message: `slideId '${line.slideId}' does not match any slide`,
        });
      }
    }
    // Every slide needs narration — slides are timed by their VO lines.
    const narrated = new Set(spec.voiceover.map((l) => l.slideId));
    for (const [i, slide] of spec.slides.entries()) {
      if (!narrated.has(slide.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["slides", i],
          message: `slide '${slide.id}' has no voiceover lines`,
        });
      }
    }
    // VO lines must be grouped per slide, in slide order, so timing is contiguous.
    const order = spec.slides.map((s) => s.id);
    let prevIdx = 0;
    for (const [i, line] of spec.voiceover.entries()) {
      const idx = order.indexOf(line.slideId);
      if (idx < prevIdx) {
        ctx.addIssue({
          code: "custom",
          path: ["voiceover", i],
          message:
            "voiceover lines must be ordered by slide order (all lines of a slide contiguous)",
        });
        break;
      }
      prevIdx = idx;
    }
    // No word-count gate: the voiceover budget is derived from the caller's
    // runtime target and enforced by the harness (brief.ts + the post-TTS
    // length loop), not by this contract.
  });
export type VideoSpec = z.infer<typeof VideoSpecSchema>;
export type ThemeName = VideoSpec["meta"]["theme"];

/** Count total VO words (used for the pre-TTS duration gate). */
export const voWordCount = (spec: VideoSpec): number =>
  spec.voiceover.reduce((n, l) => n + l.text.trim().split(/\s+/).length, 0);

/** script.json line format consumed by video-assets/scripts/generate-tts.mjs. */
export type ScriptLine = {
  id: string;
  scene: string;
  text: string;
  say?: string;
  voice?: string;
};

export const toScriptLines = (spec: VideoSpec): ScriptLine[] =>
  spec.voiceover.map((l) => ({
    id: l.id,
    scene: l.slideId,
    text: l.text,
    ...(l.say ? { say: l.say } : {}),
    ...(spec.meta.voice ? { voice: spec.meta.voice } : {}),
  }));
