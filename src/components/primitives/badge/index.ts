import { decorationComponent } from "../decoration-shapes";

/** Decoration family — rounded / tag shapes (shield, tag, ticket, capsule) that
 *  soften the sharp slab. Positioned page-space flourish; add via addDecorations(). */
export const Badge = decorationComponent(
  "badge",
  ["shield", "tag", "ticket", "capsule"],
  { variant: "shield", x: 50, y: 50, size: 24, rotate: 0, layer: "back", accent: "yellow" },
);
