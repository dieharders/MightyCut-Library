import { z } from "zod";

export const HudSchema = z.object({
  brand: z.boolean().default(true).describe("Show the top-left brand lockup (mark · name · tagline)"),
  title: z.boolean().default(true).describe("Show the top-right section-title pill"),
  counter: z.boolean().default(true).describe("Show the bottom-right slide counter"),
  progress: z.boolean().default(true).describe("Show the bottom progress track"),
  brandName: z.string().max(32).default("MightyCut").describe("Brand wordmark text"),
  tagline: z.string().max(40).optional().describe("Small tagline beside the brand mark"),
  titleText: z.string().max(40).default("Overview").describe("Section title in the top-right pill"),
  counterText: z.string().max(16).default("01 / 06").describe("Slide-counter text"),
  progressPct: z.number().min(0).max(100).default(60).describe("Progress fill percent at rest (0–100)"),
});
export type HudParams = z.infer<typeof HudSchema>;
