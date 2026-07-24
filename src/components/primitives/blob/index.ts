import { capsuleDecorationComponent } from "../capsule-decoration-shapes";

/** Capsule decoration family — organic candy blobs (bean, pebble, cloud, drop): the
 *  hand-drawn, cornerless silhouettes that keep the cream canvas from reading as a grid.
 *  Defaults to coral. Positioned page-space flourish; any treatment can add these via
 *  addDecorations(). Capsule-only by ROSTER (the decoration flag holds it out of every
 *  theme's Components grid; only capsule rosters it) — it paints with the shared 10
 *  palette roles, no theme-specific token.
 *
 *  Exported as `Blob`, matching the component name `"blob"` decks, schemas and the editor
 *  address it by. Note it shadows the platform's `Blob` global inside any module that
 *  imports it (registry.ts does); nothing in the library does an `instanceof Blob`, but a
 *  future consumer that needs both must alias one of them at the import. */
export const Blob = capsuleDecorationComponent("blob", {
  variant: "bean",
  x: 50,
  y: 50,
  size: 20,
  rotate: -8,
  layer: "back",
  accent: "primary",
});
