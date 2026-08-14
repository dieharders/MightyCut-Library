// A deterministic block VideoSpec + storyboard, the single fixture shared by the
// component smoke, the deck tests, and the editor's bundled sample (the editor CLI
// runs specToDeck on it at BUILD time and injects the result, so this Node-side
// fixture never enters the browser bundle). ONE SLIDE PER LOOK — the harness's component
// smoke asserts every FRAME_TREATMENTS name renders in a deck scaffolded from this spec, so
// registering a look without adding a slide here fails that smoke for every theme at once.
//
// It used to need storyboard OVERRIDES to reach `bar-ranking` and `agenda`, because those
// were sibling treatments no spec kind could select. They are looks in their own right now,
// so every scene here is reached by its slide's own `kind` and the storyboard carries only
// dressing.
import { VideoSpecSchema, type VideoSpec } from "../types/spec";
import type { SceneStoryboard } from "../types/storyboard";

export const sampleSpec = (): VideoSpec =>
  VideoSpecSchema.parse({
    meta: { title: "Component Deck", requester: "MightyCut", theme: "block" },
    slides: [
      { id: "intro", kind: "cover", title: "Block, componentized.", subtitle: "A neobrutalist component system.", kicker: "OVERVIEW", background: "solid" },
      { id: "plan", kind: "agenda", header: { title: "What We'll Cover" }, steps: [{ title: "The problem", text: "Why now" }, { title: "Our approach", text: "How it works" }, { title: "The results", text: "Proof" }, { title: "What's next", text: "Roadmap" }] },
      { id: "why", kind: "list", header: { title: "Why Teams Switch" }, items: [{ text: "Decks that took a week now take an afternoon." }, { text: "Every frame is on-brand without a designer.", detail: "Themes carry the type, colour and motion." }, { text: "Preview before you spend a render." }] },
      { id: "pillars", kind: "feature-cards", header: { title: "Platform Pillars" }, cards: [{ title: "Compose", text: "Typed, reusable components." }, { title: "Render", text: "Deterministic vanilla HTML." }, { title: "Ship", text: "Preview now, render on demand." }] },
      { id: "nums", kind: "stats", header: { title: "Measured Impact" }, stats: [{ value: 92, label: "Detection rate", unitSuffix: "%" }, { value: 3, label: "Faster triage", unitSuffix: "x" }, { value: 40, label: "Cost reduction", unitSuffix: "%" }] },
      { id: "how", kind: "timeline", header: { title: "How It Works" }, steps: [{ title: "Scope", text: "Define the target." }, { title: "Emulate", text: "Run the campaign." }, { title: "Report", text: "Board-ready output." }] },
      { id: "vs", kind: "comparison", header: { title: "Why We Win" }, columns: ["Legacy", "Ours"], rows: [{ label: "Speed", a: "Weeks", b: "Hours" }, { label: "Cost", a: "High", b: "Low" }] },
      { id: "score", kind: "matrix", header: { title: "How The Options Score" }, criteria: ["Automated", "Auditable", "Self-serve"], rows: [{ label: "Manual testing", sublabel: "Consultants, once a quarter", values: [false, true, false] }, { label: "Point tools", sublabel: "Stitched together per team", values: [true, false, false] }, { label: "Our platform", sublabel: "The proposed approach", values: [true, true, true], highlight: true }] },
      // The three chart looks over the SAME payload shape — the fixture's own proof that
      // bar-vs-ranked-vs-line is a look and not a data flag.
      { id: "growth", kind: "bar-chart", header: { title: "Coverage Growth" }, unitSuffix: "%", series: [{ label: "Q1", value: 40 }, { label: "Q2", value: 65 }, { label: "Q3", value: 82 }], caption: "MITRE ATT&CK coverage" },
      { id: "share", kind: "bar-ranking", header: { title: "Market Share by Vendor" }, unitSuffix: "%", series: [{ label: "Acme", value: 38 }, { label: "Globex", value: 27 }, { label: "Initech", value: 19 }, { label: "Umbrella", value: 11 }], caption: "Share of new installs, 2026" },
      { id: "trend", kind: "trend-line", header: { title: "Time To Detect" }, unitSuffix: "m", series: [{ label: "Q1", value: 46 }, { label: "Q2", value: 31 }, { label: "Q3", value: 22 }, { label: "Q4", value: 9 }], caption: "Median minutes from signal to triage" },
      { id: "stack", kind: "pill-wall", header: { title: "Plugs Into Your Stack" }, pills: ["Slack", "Jira", "GitHub", "Notion", "Okta", "Datadog", "Snowflake", "Segment"], caption: "Every integration ships on day one" },
      { id: "mesh", kind: "cluster", header: { title: "One Hub, Every Feed" }, hub: "Platform", nodes: [{ label: "Slack", detail: "alerts" }, { label: "Jira", detail: "tickets" }, { label: "GitHub", detail: "commits" }, { label: "Okta", detail: "identity" }, { label: "Datadog", detail: "metrics" }], caption: "Everything lands in the same place" },
      { id: "crew", kind: "team", header: { title: "Who You Work With" }, members: [{ name: "Ada Byron", role: "Head of Research", org: "Analytical Engines" }, { name: "Grace Hopper", role: "Chief Architect", org: "Compiler Group" }, { name: "Alan Turing", role: "Principal Scientist", org: "Machine Intelligence" }], caption: "The same three people from kickoff to launch" },
      { id: "statement", kind: "statement", text: "The best defense is a tested one.", attribution: "CISO, Fortune 100" },
      { id: "close", kind: "outro", title: "Run your first campaign.", cta: "Book a demo" },
    ],
    voiceover: [
      { id: "intro-1", slideId: "intro", text: "Meet the componentized block theme." },
      { id: "plan-1", slideId: "plan", text: "Here is what we will cover today." },
      { id: "why-1", slideId: "why", text: "Three reasons teams make the switch." },
      { id: "pillars-1", slideId: "pillars", text: "Three pillars anchor the platform." },
      { id: "nums-1", slideId: "nums", text: "The numbers speak for themselves." },
      { id: "how-1", slideId: "how", text: "It works in three simple steps." },
      { id: "vs-1", slideId: "vs", text: "Against the legacy approach, we win." },
      { id: "score-1", slideId: "score", text: "Scored against the three criteria that decide it." },
      { id: "growth-1", slideId: "growth", text: "Coverage grows quarter over quarter." },
      { id: "share-1", slideId: "share", text: "Here is how market share breaks down." },
      { id: "trend-1", slideId: "trend", text: "Time to detect keeps falling." },
      { id: "stack-1", slideId: "stack", text: "It plugs into the tools you already run." },
      { id: "mesh-1", slideId: "mesh", text: "Everything you run connects to one hub." },
      { id: "crew-1", slideId: "crew", text: "The same three people see it through." },
      { id: "statement-1", slideId: "statement", text: "A tested defense is the best defense." },
      { id: "close-1", slideId: "close", text: "Book a demo to run your first campaign." },
    ],
  });

/**
 * The fixture's storyboard — per-scene DRESSING only, and this deck asks for none.
 *
 * It used to ROUTE two scenes to sibling treatments (`bar-ranking`, `agenda`) that no spec kind
 * could select; those are looks in their own right now, so every scene here is reached by its
 * slide's own `kind` and this list carries nothing but the roster. Deliberately left bare rather
 * than given a token `options` entry: the deck tests that exercise a ground override inject one
 * themselves, and a fixture-wide default would make the "no per-slide default" case untestable.
 */
export const SAMPLE_STORYBOARD_SCENES: SceneStoryboard[] = [
  { sceneId: "intro" },
  { sceneId: "plan" },
  { sceneId: "why" },
  { sceneId: "pillars" },
  { sceneId: "nums" },
  { sceneId: "how" },
  { sceneId: "vs" },
  { sceneId: "score" },
  { sceneId: "growth" },
  { sceneId: "share" },
  { sceneId: "trend" },
  { sceneId: "stack" },
  { sceneId: "mesh" },
  { sceneId: "crew" },
  { sceneId: "statement" },
  { sceneId: "close" },
];
