// The LOOK vocabulary — the single source of truth for what a slide can BE.
//
// A look has ONE name, and that name is both the spec's slide `kind` (the data shape the
// writer fills) and the `treatment` (the composed element the themes skin). They used to be
// two vocabularies related by a hand-written map, which is exactly how they drifted: the
// outline planner's prompt listed 11 of the 14 kinds, so `pills`, `cluster` and `team` — and
// the three treatments that render them — were unreachable end to end, by any model, on both
// the planned and unplanned paths.
//
// One name removes the class of bug rather than the instance. There is no pair to get wrong,
// no default to fall back to, and no compatibility check to run: a look cannot be incompatible
// with itself. It also makes the NAME carry the guidance — `bar-ranking` in a prompt says more
// than `chart` plus a separate field the planner was never shown.
//
// Everything derives from LOOKS below: SLIDE_KINDS (the spec's discriminator), FRAME_TREATMENTS
// (the storyboard/deck enum), the planner's and the agent's prompt tables, and the web UI's look
// picker. Registering a look here makes it selectable everywhere at once — which is the property
// the old map only claimed to have.

/** One look: the name, the picker's copy, and the one-line guidance for choosing it. */
export type LookRow = {
  /** The single name — the spec slide `kind` AND the treatment. Kebab-case. */
  name: string;
  /** Short UI copy for the plan editor's picker. Kept under 32 chars with no em-dash:
   *  this list is SCANNED by someone choosing, not read. The guidance is `when`. */
  label: string;
  /**
   * When to choose this look, on the slide's CONTENT. This is the description the outline
   * planner picks from, the writer authors against, and the editor shows as a tooltip — one
   * string, three audiences, so they cannot disagree about what a look is for.
   */
  when: string;
  /** `false` only for `custom`, the escape hatch: it is a spec kind and a read-only scene
   *  sentinel, but not a renderable treatment. Absent means renderable. */
  composable?: false;
};

/**
 * The SSOT. Insertion ORDER is the order the prompt tables and the editor's picker list looks,
 * so keep it stable and grouped by what a slide is doing: open, list, assert, quantify,
 * sequence, contrast, chart, gather, close.
 */
export const LOOKS = [
  {
    name: "cover",
    label: "Cover",
    when: "The deck's opening slide: headline plus subtitle. Always the first slide.",
  },
  {
    name: "list",
    label: "List",
    when: "2-5 short claims, one per line — the general-purpose list when each item is a sentence at most.",
  },
  {
    name: "feature-cards",
    label: "Feature cards",
    when: "2-4 features explained side by side, each with an icon, a title and a sentence of body.",
  },
  {
    name: "statement",
    label: "Statement",
    when: "One big claim or quote alone on the slide — a vision, a thesis, a line worth pausing on.",
  },
  {
    name: "stats",
    label: "Stats",
    when: "1-4 headline numbers that count up — quantified impact, not a chart.",
  },
  {
    name: "timeline",
    label: "Timeline",
    when: "2-5 numbered steps in order, each explained — a process, a roadmap, a sequence.",
  },
  {
    name: "agenda",
    label: "Agenda",
    when: "An agenda or running order: 2-5 numbered parts of a presentation or event, each a title and optional detail. Not a timeline.",
  },
  {
    name: "comparison",
    label: "Comparison",
    when: "Us against the status quo: 2-5 rows across exactly 2 named columns.",
  },
  {
    name: "matrix",
    label: "Capability matrix",
    when: "3+ alternatives scored against 2-5 yes/no criteria as checks and crosses; the subject's row goes last.",
  },
  {
    name: "bar-chart",
    label: "Bar chart",
    when: "2-8 categories compared as vertical bars. Put the subject's own result LAST so it is accented.",
  },
  {
    name: "bar-ranking",
    label: "Ranked bars",
    when: "2-8 values as a horizontal ranked list where the ORDER is the point. Put the leader FIRST.",
  },
  {
    name: "trend-line",
    label: "Trend line",
    when: "2-8 points over an ordered sequence drawn as a line — a trend through time, never unordered categories. Up to 4 series can share the graph when data need comparison.",
  },
  {
    name: "pill-wall",
    label: "Pill wall",
    when: "4-14 short labels taken in at a glance — breadth IS the point. For features, capabilities, etc.",
  },
  {
    name: "cluster",
    label: "Cluster",
    when: "One central hub with up to 8 labelled spokes. Only for real hub relationship; not a flat list.",
  },
  {
    name: "team",
    label: "Team",
    when: "1-5 people, each with name and role. ONLY when the prompt names real people.",
  },
  {
    name: "outro",
    label: "Outro",
    when: "The closing slide: headline plus a call to action. Always the last slide.",
  },
  {
    name: "custom",
    label: "Custom visual",
    when: "A signature visual no other look can show, hand-built by a slide engineer.",
    composable: false,
  },
] as const satisfies readonly LookRow[];

/** Every look name — the spec's slide `kind` discriminator. A tripwire asserts this equals
 *  SlideSpecSchema's actual discriminator values, in order. */
export type SlideKind = (typeof LOOKS)[number]["name"];

/** The names that are NOT renderable treatments (`custom` alone). Derived, so the escape
 *  hatch is declared once, on its own row, rather than restated as a list. */
type UncomposableName = Extract<
  (typeof LOOKS)[number],
  { readonly composable: false }
>["name"];

/** A renderable treatment — every look except the `custom` sentinel. */
export type FrameTreatment = Exclude<SlideKind, UncomposableName>;

/** A look name is also a treatment name, so this is a pure narrowing, not a lookup. */
export type SlideLook = SlideKind;

/** LOOKS widened to the row type. `as const` narrows every row to its own literal shape, so a
 *  row that omits `composable` has no such property to read — the widening is what lets the
 *  derivations below filter on it while the literal types above stay exact. */
const ROWS: readonly LookRow[] = LOOKS;

export const SLIDE_KINDS = LOOKS.map((l) => l.name) as unknown as readonly [
  SlideKind,
  ...SlideKind[],
];

/**
 * The renderable treatments — the storyboard/deck enum. Derived from LOOKS rather than
 * declared beside it: a second tuple is a second place to forget, and the cross-check tripwire
 * that guarded the old pair is not a substitute for there being nothing to check.
 */
export const FRAME_TREATMENTS = ROWS.filter((l) => l.composable !== false).map(
  (l) => l.name,
) as unknown as readonly [FrameTreatment, ...FrameTreatment[]];

/** Kinds with no treatment — they render as the placeholder scene. `custom` alone, by design:
 *  it is the kind that MEANS "no look can do this, build it by hand". */
export const UNCOMPOSED_KINDS: SlideKind[] = ROWS.filter(
  (l) => l.composable === false,
).map((l) => l.name as SlideKind);

/** Whether a look name renders (i.e. is a treatment) rather than falling to the placeholder. */
export const isComposableKind = (name: string): name is FrameTreatment =>
  (FRAME_TREATMENTS as readonly string[]).includes(name);

/** The row for a look name, or undefined if it is not one. */
export const lookFor = (name: string): LookRow | undefined =>
  ROWS.find((l) => l.name === name);

/** The picker's copy for a look, falling back to the bare name. */
export const labelForLook = (name: string): string =>
  lookFor(name)?.label ?? name;

/**
 * Prompt-table rows: `- <name>  <when>`, in LOOKS order.
 *
 * Rendered verbatim into the outline planner's prompt, the writer's prompt, the review pass's
 * prompt and the slide agent's prompt. Those were four hand-written lists, three of which had
 * drifted; this is the one that replaces them, and a tripwire asserts every LOOKS row appears
 * in what the planner is shown.
 */
export const lookTableLines = (): string[] =>
  LOOKS.map((l) => `- ${l.name.padEnd(14)} ${l.when}`);
