// Spec-kind ↔ treatment mapping — the single source of truth for WHICH frame
// treatment renders each spec slide kind. This used to be triplicated by hand: a
// switch in the harness (treatmentForSlide), the agent's prompt table, and a
// "(kind: …)" fragment smuggled into every treatment's `headline` param
// description. All three now derive from TREATMENT_MAP here, so they cannot drift,
// and a param description is free to describe only its param.
//
// Consumed by: the harness's treatmentForSlide (default pick), the agent prompt
// generator (treatment table), and deck tooling. A tripwire (spec-treatments.test.ts)
// asserts SLIDE_KINDS matches the spec's discriminated union and that TREATMENT_MAP
// covers every treatment with at most one default per kind.
import { FRAME_TREATMENTS, type FrameTreatment } from "./storyboard";

/**
 * The spec slide kinds — the discriminator of SlideSpecSchema (spec.ts). Kept as a
 * runtime tuple so the mapping below can be keyed and exhaustively checked; a
 * tripwire asserts this equals the schema's actual discriminator values.
 */
export const SLIDE_KINDS = [
  "title",
  "bullets",
  "statement",
  "chart",
  "comparison",
  "stats",
  "steps",
  "cards",
  "matrix",
  "custom",
  "composed",
  "outro",
] as const;
export type SlideKind = (typeof SLIDE_KINDS)[number];

/** One treatment's entry: the spec kinds it renders, whether it is the DEFAULT pick
 *  for those kinds (vs a sibling alternate the agent may swap to in the storyboard),
 *  and the one-line, agent-facing role blurb the prompt table renders. */
export type TreatmentMapEntry = {
  /** Spec kinds this treatment can render (many kinds may share one treatment). */
  kinds: SlideKind[];
  /** True for the deterministic default pick; false for a sibling alternate
   *  (e.g. agenda for `steps`, bar-ranking for `chart`). At most one default per kind. */
  default: boolean;
  /** Agent-facing description — the row rendered in the prompt's treatment table. */
  role: string;
};

/**
 * The SSOT. Insertion order is the order the agent prompt lists treatments, so keep
 * it stable. Kinds with no default entry (matrix, composed, custom) fall through to
 * the generic generator — `defaultTreatmentForKind` returns null for them.
 */
export const TREATMENT_MAP: Record<FrameTreatment, TreatmentMapEntry> = {
  cover: { kinds: ["title"], default: true, role: "title slide — headline · subtitle" },
  "feature-cards": { kinds: ["cards", "bullets"], default: true, role: "a row of content cards — icon · title · body" },
  "stat-grid": { kinds: ["stats"], default: true, role: "headline figures that count up — number · label" },
  timeline: { kinds: ["steps"], default: true, role: "a sequence of numbered steps — num · title · body" },
  agenda: { kinds: ["steps"], default: false, role: "a sparse numbered index list (sibling of timeline)" },
  comparison: { kinds: ["comparison"], default: true, role: "a two-column ledger — row label · them · us" },
  chart: { kinds: ["chart"], default: true, role: "a bar chart — value · label (bar charts only)" },
  "bar-ranking": { kinds: ["chart"], default: false, role: "a horizontal ranked bar list (sibling of chart)" },
  quote: { kinds: ["statement"], default: true, role: "one big statement + attribution" },
  "closing-plate": { kinds: ["outro"], default: true, role: "the closer — headline + CTA" },
};

/**
 * The deterministic default treatment for a spec kind, or null when the kind has no
 * treatment (matrix, composed, custom → generic generator). NOTE: the chart line-vs-bar
 * distinction can't be expressed by kind alone — the caller (treatmentForSlide) keeps
 * that one conditional (line charts → null); this returns the bar-chart default for `chart`.
 */
export const defaultTreatmentForKind = (kind: SlideKind): FrameTreatment | null => {
  for (const [treatment, entry] of Object.entries(TREATMENT_MAP)) {
    if (entry.default && entry.kinds.includes(kind)) return treatment as FrameTreatment;
  }
  return null;
};

/** The spec kinds a given treatment renders. */
export const kindsForTreatment = (treatment: FrameTreatment): SlideKind[] => TREATMENT_MAP[treatment].kinds;

/** Kinds with no default treatment — they fall back to the generic generator. */
export const FALLBACK_KINDS: SlideKind[] = SLIDE_KINDS.filter((k) => defaultTreatmentForKind(k) === null);

/** Prompt-table rows: `- <treatment>  <role>  (kind[s]: <kinds>)`, in TREATMENT_MAP order.
 *  The agent's system prompt renders these verbatim so the mapping it sees is generated
 *  from the same SSOT the builder maps by. */
export const treatmentTableLines = (): string[] =>
  (Object.keys(TREATMENT_MAP) as FrameTreatment[]).map((t) => {
    const { kinds, role } = TREATMENT_MAP[t];
    const label = `${kinds.length > 1 ? "kinds" : "kind"}: ${kinds.join(", ")}`;
    return `- ${t.padEnd(14)} ${role} (${label})`;
  });

export { FRAME_TREATMENTS };
