import { decorationComponent } from "../decoration-shapes";

/** Decoration family — repeating line patterns (stripe, bars, grid). Positioned
 *  page-space flourish; add via a treatment's addDecorations(). */
export const Stripe = decorationComponent("stripe", {
  variant: "stripe",
  x: 50,
  y: 50,
  size: 30,
  rotate: 0,
  layer: "back",
  accent: "accent-2",
});
