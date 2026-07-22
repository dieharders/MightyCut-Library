// VideoSpec — the single source of truth for what a generated video contains.
// The LLM produces this JSON; the harness generators render it to HyperFrames
// HTML; the Pi agent customizes the slide sub-compositions. Render-side
// mirrors that must stay in sync with these shapes: src/pipeline/theme-css.ts
// (palette/style tokens) and src/pipeline/slide-templates.ts (kind dispatch) —
// both guarded by tripwire tests in spec.test.ts.
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

export const HeaderSpecSchema = z.object({
  kicker: z.string().max(60).optional()
    .describe("Short section label shown in the HUD top-right for this slide (e.g. \"RESULTS\", \"HOW IT WORKS\"); falls back to the deck-wide meta.header.right when omitted"),
  title: z.string().min(1).max(80),
});
export type HeaderSpec = z.infer<typeof HeaderSpecSchema>;

const transition = z.union([z.enum(["fade", "slide", "wipe"]), TransitionSpecSchema]).optional()
  .describe("Transition INTO this slide — legacy fade|slide|wipe, or { animIn, animOut, timeIn, timeOut }");

const backgroundKind = z.enum(["gradient", "particles", "grid", "solid", "pattern"]);
/** Per-slide backdrop override (default: the deck-wide meta.background). */
const background = backgroundKind.optional()
  .describe("Backdrop behind this slide only (default: deck-wide background)");

const icon = z.string().optional()
  .describe("Icon name from the core Icon set (e.g. \"shield\", \"database\")");

/* ----- reusable content shapes (used by single-kind slides AND composed slots) --- */

const StatSchema = z.object({
  value: z.number(),
  label: z.string().min(1).max(40),
  unitPrefix: z.string().max(6).optional().describe("Leading unit, e.g. \"$\""),
  unitSuffix: z.string().max(10).optional().describe("Trailing unit, e.g. \"%\", \"x\", \"hrs\""),
  decimals: z.number().int().min(0).max(2).optional(),
});

const BulletSchema = z.object({
  icon,
  text: z.string().min(1).max(110),
  detail: z.string().max(160).optional(),
});

export const CardContentSchema = z.object({
  kicker: z.string().max(26).optional()
    .describe("Small mono label above the text, e.g. \"PROPERTY GRAPH\""),
  icon,
  title: z.string().max(40).optional(),
  text: z.string().min(1).max(150),
});

export const ChartContentSchema = z.object({
  type: z.enum(["bar", "line"]).describe("bar for category comparison, line for trends"),
  unitPrefix: z.string().max(6).optional().describe("Leading unit on each value, e.g. \"$\""),
  unitSuffix: z.string().max(12).optional().describe("Trailing unit on each value, e.g. \"%\", \"k\""),
  series: z
    .array(z.object({ label: z.string().min(1).max(28), value: z.number() }))
    .min(2)
    .max(8),
  caption: z.string().max(140).optional(),
});

/* ----- composed-slide layouts (theme-independent; geometry lives in pipeline/layouts.ts) --- */

/** Primitive component types a composed slot can hold. */
export const COMPONENT_TYPES = ["card", "chart", "stat", "bullets"] as const;
export type ComponentType = (typeof COMPONENT_TYPES)[number];
const ALL_COMP: ComponentType[] = [...COMPONENT_TYPES];
const NO_CHART: ComponentType[] = ["card", "stat", "bullets"]; // regions too narrow/short for a chart

/**
 * The finite layout registry's VALIDATION contract: per layout, the accepted
 * component types for each slot (its length = the slot count). The matching
 * pixel geometry lives in pipeline/layouts.ts, kept in sync by a tripwire test.
 */
export const LAYOUTS_META = {
  "split-lr": { slots: [ALL_COMP, ALL_COMP] },
  "split-tb": { slots: [ALL_COMP, ALL_COMP] },
  "wide-left": { slots: [ALL_COMP, NO_CHART] },
  "wide-right": { slots: [NO_CHART, ALL_COMP] },
  "trio-row": { slots: [NO_CHART, NO_CHART, NO_CHART] },
  "quad": { slots: [NO_CHART, NO_CHART, NO_CHART, NO_CHART] },
} as const satisfies Record<string, { slots: ComponentType[][] }>;
export type LayoutId = keyof typeof LAYOUTS_META;
export const LAYOUT_IDS = Object.keys(LAYOUTS_META) as [LayoutId, ...LayoutId[]];

/** One slot's content — a primitive plus its data. */
const SlotSchema = z.discriminatedUnion("component", [
  z.object({ component: z.literal("card"), card: CardContentSchema }),
  z.object({ component: z.literal("chart"), chart: ChartContentSchema }),
  z.object({ component: z.literal("stat"), stats: z.array(StatSchema).min(1).max(3) }),
  z.object({ component: z.literal("bullets"), bullets: z.array(BulletSchema).min(2).max(4) }),
]);

export const SlideSpecSchema = z.discriminatedUnion("kind", [
  z.object({
    id,
    kind: z.literal("title"),
    transition,
    kicker: z.string().max(60).optional()
      .describe("Short section label shown in the HUD top-right for this slide; falls back to the deck-wide meta.header.right when omitted"),
    title: z.string().min(1).max(80),
    subtitle: z.string().max(140).optional(),
    background: backgroundKind,
  }),
  z.object({
    id,
    kind: z.literal("bullets"),
    transition,
    background,
    header: HeaderSpecSchema,
    bullets: z.array(BulletSchema).min(2).max(5),
  }),
  z.object({
    id,
    kind: z.literal("statement"),
    transition,
    background,
    text: z.string().min(1).max(200),
    attribution: z.string().max(80).optional(),
  }),
  z.object({
    id,
    kind: z.literal("chart"),
    transition,
    background,
    header: HeaderSpecSchema,
    chart: ChartContentSchema,
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
    stats: z.array(StatSchema).min(1).max(4).describe("Big animated count-up numbers"),
    caption: z.string().max(140).optional(),
  }),
  z.object({
    id,
    kind: z.literal("steps"),
    transition,
    background,
    header: HeaderSpecSchema,
    steps: z
      .array(
        z.object({
          icon,
          title: z.string().min(1).max(36),
          text: z.string().max(100).optional(),
        }),
      )
      .min(2)
      .max(5)
      .describe("Numbered process steps, rendered as a connected card sequence"),
  }),
  z.object({
    id,
    kind: z.literal("cards"),
    transition,
    background,
    header: HeaderSpecSchema,
    layout: z.enum(["column", "row"]).optional()
      .describe("column (stacked, default) or row (side by side)"),
    cards: z.array(CardContentSchema).min(2).max(4),
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
          values: z.array(z.boolean()).min(2).max(5)
            .describe("values[i] answers criteria[i] — same length as criteria"),
          highlight: z.boolean().optional()
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
    concept: z.string().min(10).max(400)
      .describe("Plain-language description of the visual to build (the slide engineer hand-builds it)"),
    data: z
      .array(z.object({ label: z.string().min(1).max(24), value: z.string().max(24).optional() }))
      .max(6)
      .optional()
      .describe("Optional label/value pairs shown as pills"),
  }),
  z.object({
    id,
    kind: z.literal("composed"),
    transition,
    background,
    header: HeaderSpecSchema.optional(),
    layout: z.enum(LAYOUT_IDS)
      .describe("Fixed slot layout (split-lr/split-tb/wide-left/wide-right/trio-row/quad)"),
    slots: z.array(SlotSchema).min(1).max(4)
      .describe("One primitive per slot, in slot order; count + types must match the layout"),
  }),
  z.object({
    id,
    kind: z.literal("outro"),
    transition,
    background,
    title: z.string().min(1).max(80),
    cta: z.string().min(1).max(120),
    contact: z.string().max(120).optional(),
  }),
]);
export type SlideSpec = z.infer<typeof SlideSpecSchema>;

export const HeaderBandSchema = z.object({
  brand: z.string().max(60).optional().describe("Left wordmark (default: meta.title)"),
  tagline: z.string().max(60).optional().describe("Muted descriptor after the wordmark — the company, product category, or program. MUST differ from the brand (never repeat it); omit if there's nothing distinct to say. Defaults to meta.requester, but a repeat of the brand is dropped at render."),
  right: z.string().max(40).optional().describe("Deck-wide top-right HUD label — the default shown on any slide whose own kicker is omitted (per-slide kickers override it)"),
  rightSub: z.string().max(40).optional(),
  show: z.boolean().optional().describe("false hides the whole band"),
});
export type HeaderBandSpec = z.infer<typeof HeaderBandSchema>;

export const FooterSchema = z.object({
  text: z.string().max(80).optional().describe("Small mono text above the progress bar"),
  slideNumbers: z.boolean().optional().describe("Show \"NN / TT\" slide counter"),
});
export type FooterSpec = z.infer<typeof FooterSchema>;

export const CaptionStyleSchema = z.object({
  backdrop: z.enum(["blur", "semi", "solid", "none"]).optional(),
  size: z.enum(["small", "medium", "large"]).optional(),
  weight: z.enum(["normal", "medium", "semibold", "bold"]).optional(),
  outline: z.boolean().optional().describe("Dark text outline for busy backdrops"),
  accentBar: z.boolean().optional().describe("Accent bar on the caption box (default true)"),
  show: z.boolean().optional().describe("false hides the caption rail (default true; an accessibility feature — keep on unless asked)"),
});
export type CaptionStyleSpec = z.infer<typeof CaptionStyleSchema>;

/**
 * HUD visibility toggles — the source of truth for what chrome renders. All
 * default to visible (omitted → shown). `header.show` / `footer.slideNumbers`
 * remain honored as legacy fallbacks so existing LLM-generated specs still
 * render; `header`/`footer` keep supplying HUD *content* (brand/tagline/right
 * label/footer text). Captions are NOT part of the HUD (see caption.show).
 */
export const HudSchema = z.object({
  show: z.boolean().optional().describe("Master switch — false hides the entire HUD (default true)"),
  brand: z.boolean().optional().describe("Show the brand band (mark + wordmark + tagline)"),
  title: z.boolean().optional().describe("Show the top-right title/label"),
  progress: z.boolean().optional().describe("Show the timeline/progress bar"),
  slideCount: z.boolean().optional().describe("Show the \"NN / TT\" slide counter"),
});
export type HudSpec = z.infer<typeof HudSchema>;

/**
 * Caller-controlled HUD visibility overrides (Web UI toggles / CLI --hide-*
 * flags), stamped onto spec.meta after AI generation so they beat the model's
 * choices. `captions` is separate from the HUD (accessibility) → caption.show.
 */
export const HudOverrideSchema = HudSchema.extend({
  captions: z.boolean().optional().describe("Show/hide the caption rail (maps to caption.show)"),
}).strict();
export type HudOverride = z.infer<typeof HudOverrideSchema>;

export const MAX_SLIDES = 12;
export const MAX_VO_WORDS = 700;

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
      fps: z.literal(30),
      width: z.literal(1920),
      height: z.literal(1080),
      background: backgroundKind.optional()
        .describe("Deck-wide backdrop behind every slide (default particles)"),
      header: HeaderBandSchema.optional(),
      footer: FooterSchema.optional(),
      caption: CaptionStyleSchema.optional(),
      hud: HudSchema.optional(),
    }),
    slides: z.array(SlideSpecSchema).min(3).max(MAX_SLIDES),
    voiceover: z.array(VOLineSchema).min(3),
  })
  .superRefine((spec, ctx) => {
    if (spec.slides[0]?.kind !== "title") {
      ctx.addIssue({ code: "custom", path: ["slides", 0], message: "first slide must be kind 'title'" });
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
      ctx.addIssue({ code: "custom", path: ["slides"], message: "slide ids must be unique" });
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
    // Composed slides: slot count + each slot's component must match the layout.
    for (const [i, slide] of spec.slides.entries()) {
      if (slide.kind !== "composed") continue;
      const slots = LAYOUTS_META[slide.layout].slots;
      if (slide.slots.length !== slots.length) {
        ctx.addIssue({
          code: "custom",
          path: ["slides", i, "slots"],
          message: `layout '${slide.layout}' has ${slots.length} slots but ${slide.slots.length} were given`,
        });
        continue;
      }
      for (const [si, slot] of slide.slots.entries()) {
        if (!(slots[si] as readonly ComponentType[]).includes(slot.component)) {
          ctx.addIssue({
            code: "custom",
            path: ["slides", i, "slots", si, "component"],
            message: `slot ${si} of '${slide.layout}' accepts ${slots[si]!.join("/")}, not '${slot.component}'`,
          });
        }
      }
    }
    const lineIds = new Set<string>();
    for (const [i, line] of spec.voiceover.entries()) {
      if (lineIds.has(line.id)) {
        ctx.addIssue({ code: "custom", path: ["voiceover", i, "id"], message: `duplicate line id '${line.id}'` });
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
        ctx.addIssue({ code: "custom", path: ["slides", i], message: `slide '${slide.id}' has no voiceover lines` });
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
          message: "voiceover lines must be ordered by slide order (all lines of a slide contiguous)",
        });
        break;
      }
      prevIdx = idx;
    }
    const words = spec.voiceover.reduce((n, l) => n + l.text.trim().split(/\s+/).length, 0);
    if (words > MAX_VO_WORDS) {
      ctx.addIssue({
        code: "custom",
        path: ["voiceover"],
        message: `voiceover total is ${words} words; must be <= ${MAX_VO_WORDS} to stay under 5:00`,
      });
    }
  });
export type VideoSpec = z.infer<typeof VideoSpecSchema>;
export type ThemeName = VideoSpec["meta"]["theme"];

/** Count total VO words (used for the pre-TTS duration gate). */
export const voWordCount = (spec: VideoSpec): number =>
  spec.voiceover.reduce((n, l) => n + l.text.trim().split(/\s+/).length, 0);

/** script.json line format consumed by video-assets/scripts/generate-tts.mjs. */
export type ScriptLine = { id: string; scene: string; text: string; say?: string; voice?: string };

export const toScriptLines = (spec: VideoSpec): ScriptLine[] =>
  spec.voiceover.map((l) => ({
    id: l.id,
    scene: l.slideId,
    text: l.text,
    ...(l.say ? { say: l.say } : {}),
    ...(spec.meta.voice ? { voice: spec.meta.voice } : {}),
  }));
