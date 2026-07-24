import { capsuleDecorationComponent } from "../capsule-decoration-shapes";

/** Capsule decoration family — small hand-drawn marks (squiggle, plus, spark, comma): the
 *  smallest, sparkiest pieces, sized down so a scatter of them reads as punctuation rather
 *  than as content. Defaults to yellow. Positioned page-space flourish; add via a
 *  treatment's addDecorations(). Capsule-only by roster; paints with the shared 10 palette
 *  roles. */
export const Confetti = capsuleDecorationComponent("confetti", {
  variant: "squiggle",
  x: 50,
  y: 50,
  size: 12,
  rotate: 12,
  layer: "back",
  accent: "accent-1",
});
