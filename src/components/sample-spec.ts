// A deterministic block VideoSpec + storyboard, the single fixture shared by the
// component smoke, the deck tests, and the editor's bundled sample (the editor CLI
// runs specToDeck on it at BUILD time and injects the result, so this Node-side
// fixture never enters the browser bundle). Ten slides routed to all ten
// treatments (share→bar-ranking, plan→agenda) so every treatment is exercised.
import { VideoSpecSchema, type VideoSpec } from "../types/spec";
import type { SceneStoryboard } from "../types/storyboard";

export const sampleSpec = (): VideoSpec =>
  VideoSpecSchema.parse({
    meta: { title: "Component Deck", requester: "MightyCut", theme: "block", fps: 30, width: 1920, height: 1080 },
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
  { sceneId: "close", treatment: "closing-plate" },
];
