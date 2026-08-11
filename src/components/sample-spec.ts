// A deterministic block VideoSpec + storyboard, the single fixture shared by the
// component smoke, the deck tests, and the editor's bundled sample (the editor CLI
// runs specToDeck on it at BUILD time and injects the result, so this Node-side
// fixture never enters the browser bundle). ONE SLIDE PER TREATMENT — the harness's
// component smoke asserts every FRAME_TREATMENTS name renders in a deck scaffolded from this
// spec, so registering a treatment without adding a slide here fails that smoke for every
// theme at once. `share` and `plan` reuse the chart/steps data and are storyboard-routed to
// the bar-ranking + agenda siblings, which no kind can select.
import { VideoSpecSchema, type VideoSpec } from "../types/spec";
import type { SceneStoryboard } from "../types/storyboard";

export const sampleSpec = (): VideoSpec =>
  VideoSpecSchema.parse({
    meta: { title: "Component Deck", requester: "MightyCut", theme: "block" },
    slides: [
      { id: "intro", kind: "title", title: "Block, componentized.", subtitle: "A neobrutalist component system.", kicker: "OVERVIEW", background: "solid" },
      { id: "pillars", kind: "cards", header: { title: "Platform Pillars" }, cards: [{ title: "Compose", text: "Typed, reusable components." }, { title: "Render", text: "Deterministic vanilla HTML." }, { title: "Ship", text: "Preview now, render on demand." }] },
      { id: "nums", kind: "stats", header: { title: "Measured Impact" }, stats: [{ value: 92, label: "Detection rate", unitSuffix: "%" }, { value: 3, label: "Faster triage", unitSuffix: "x" }, { value: 40, label: "Cost reduction", unitSuffix: "%" }] },
      { id: "how", kind: "steps", header: { title: "How It Works" }, steps: [{ title: "Scope", text: "Define the target." }, { title: "Emulate", text: "Run the campaign." }, { title: "Report", text: "Board-ready output." }] },
      { id: "vs", kind: "comparison", header: { title: "Why We Win" }, columns: ["Legacy", "Ours"], rows: [{ label: "Speed", a: "Weeks", b: "Hours" }, { label: "Cost", a: "High", b: "Low" }] },
      { id: "growth", kind: "chart", header: { title: "Coverage Growth" }, chart: { type: "bar", unitSuffix: "%", series: [{ label: "Q1", value: 40 }, { label: "Q2", value: 65 }, { label: "Q3", value: 82 }], caption: "MITRE ATT&CK coverage" } },
      { id: "quote", kind: "statement", text: "The best defense is a tested one.", attribution: "CISO, Fortune 100" },
      // share + plan reuse the chart/steps data but are ROUTED (via the storyboard
      // override below) to the bar-ranking + agenda siblings, so the fixture exercises
      // all 10 treatments — including bar-ranking (the empty-fill regression) + agenda.
      { id: "share", kind: "chart", header: { title: "Market Share by Vendor" }, chart: { type: "bar", unitSuffix: "%", series: [{ label: "Acme", value: 38 }, { label: "Globex", value: 27 }, { label: "Initech", value: 19 }, { label: "Umbrella", value: 11 }], caption: "Share of new installs, 2026" } },
      { id: "plan", kind: "steps", header: { title: "What We'll Cover" }, steps: [{ title: "The problem", text: "Why now" }, { title: "Our approach", text: "How it works" }, { title: "The results", text: "Proof" }, { title: "What's next", text: "Roadmap" }] },
      { id: "mesh", kind: "cluster", header: { title: "One Hub, Every Feed" }, hub: "Platform", nodes: [{ label: "Slack", detail: "alerts" }, { label: "Jira", detail: "tickets" }, { label: "GitHub", detail: "commits" }, { label: "Okta", detail: "identity" }, { label: "Datadog", detail: "metrics" }], caption: "Everything lands in the same place" },
      { id: "trend", kind: "chart", header: { title: "Time To Detect" }, chart: { type: "line", unitSuffix: "m", series: [{ label: "Q1", value: 46 }, { label: "Q2", value: 31 }, { label: "Q3", value: 22 }, { label: "Q4", value: 9 }], caption: "Median minutes from signal to triage" } },
      { id: "crew", kind: "team", header: { title: "Who You Work With" }, members: [{ name: "Ada Byron", role: "Head of Research", org: "Analytical Engines" }, { name: "Grace Hopper", role: "Chief Architect", org: "Compiler Group" }, { name: "Alan Turing", role: "Principal Scientist", org: "Machine Intelligence" }], caption: "The same three people from kickoff to launch" },
      { id: "stack", kind: "pills", header: { title: "Plugs Into Your Stack" }, pills: ["Slack", "Jira", "GitHub", "Notion", "Okta", "Datadog", "Snowflake", "Segment"], caption: "Every integration ships on day one" },
      { id: "score", kind: "matrix", header: { title: "How The Options Score" }, criteria: ["Automated", "Auditable", "Self-serve"], rows: [{ label: "Manual testing", sublabel: "Consultants, once a quarter", values: [false, true, false] }, { label: "Point tools", sublabel: "Stitched together per team", values: [true, false, false] }, { label: "Our platform", sublabel: "The proposed approach", values: [true, true, true], highlight: true }] },
      { id: "close", kind: "outro", title: "Run your first campaign.", cta: "Book a demo" },
    ],
    voiceover: [
      { id: "intro-1", slideId: "intro", text: "Meet the componentized block theme." },
      { id: "pillars-1", slideId: "pillars", text: "Three pillars anchor the platform." },
      { id: "nums-1", slideId: "nums", text: "The numbers speak for themselves." },
      { id: "how-1", slideId: "how", text: "It works in three simple steps." },
      { id: "vs-1", slideId: "vs", text: "Against the legacy approach, we win." },
      { id: "growth-1", slideId: "growth", text: "Coverage grows quarter over quarter." },
      { id: "quote-1", slideId: "quote", text: "A tested defense is the best defense." },
      { id: "share-1", slideId: "share", text: "Here is how market share breaks down." },
      { id: "plan-1", slideId: "plan", text: "Here is what we will cover today." },
      { id: "mesh-1", slideId: "mesh", text: "Everything you run connects to one hub." },
      { id: "trend-1", slideId: "trend", text: "Time to detect keeps falling." },
      { id: "crew-1", slideId: "crew", text: "The same three people see it through." },
      { id: "stack-1", slideId: "stack", text: "It plugs into the tools you already run." },
      { id: "score-1", slideId: "score", text: "Scored against the three criteria that decide it." },
      { id: "close-1", slideId: "close", text: "Book a demo to run your first campaign." },
    ],
  });

// Route share → bar-ranking and plan → agenda (kind→treatment defaults would pick
// chart + timeline). The rest keep their kind→treatment defaults.
export const SAMPLE_STORYBOARD_SCENES: SceneStoryboard[] = [
  { sceneId: "intro", treatment: "cover" },
  { sceneId: "pillars", treatment: "feature-cards" },
  { sceneId: "nums", treatment: "stat-grid" },
  { sceneId: "how", treatment: "timeline" },
  { sceneId: "vs", treatment: "comparison" },
  { sceneId: "growth", treatment: "chart" },
  { sceneId: "quote", treatment: "quote" },
  { sceneId: "share", treatment: "bar-ranking" },
  { sceneId: "plan", treatment: "agenda" },
  { sceneId: "mesh", treatment: "node-cluster" },
  { sceneId: "trend", treatment: "line-chart" },
  { sceneId: "crew", treatment: "team" },
  { sceneId: "stack", treatment: "pill-wall" },
  { sceneId: "score", treatment: "matrix" },
  { sceneId: "close", treatment: "closing-plate" },
];
