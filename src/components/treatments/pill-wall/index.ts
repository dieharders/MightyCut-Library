import template from "./template.html" with { type: "text" };
import { Pill } from "../../primitives/pill";
import { treatment } from "../../runtime/treatment";
import { pillWallAnim } from "./anim";
import { PillWallSchema } from "./schema";

const LABELS = [
  "Slack",
  "Jira",
  "GitHub",
  "Notion",
  "Figma",
  "Linear",
  "Datadog",
  "Snowflake",
  "Dropbox",
  "SharePoint",
  "Segment",
  "Zendesk",
  "Trello",
  "Evernote",
  "MS Office",
  "Google Drive",
];

/**
 * A wall of short label pills — breadth taken in at a glance.
 *
 * Reuses the existing `pill` primitive rather than introducing a wall-specific one: it is
 * already a registered, all-six-themes-skinned component whose whole job is a short label, and
 * a second component that rendered the same thing would guarantee the two drifted.
 *
 * Each pill is added with `animIn: "none"`. That is load-bearing, not tidiness — the wall's own
 * `staggerIn` expands to `.wall > *`, so a pill that also kept its own entrance would be
 * revealed TWICE. Both compile to `tl.from()`, and GSAP's immediateRender then samples the
 * first tween's from-state (opacity 0) as the second's END value: the pill appears and then
 * vanishes for good. The runtime's own dedupe does not catch this pair, because it drops a
 * second reveal on the SAME target and these are two different targets (the container and the
 * child). anim.ts explains why the wave is on the container in the first place.
 */
export const PillWall = treatment({
  name: "pill-wall",
  childComponent: "pill",
  schema: PillWallSchema,
  template,
  ground: "muted-1",
  example: {
    headline: "Works with what you already run",
    caption: "Every integration is available on day one",
  },
  fill: (p) => ({ headline: p.headline, caption: p.caption ?? null }),
  // No `variant`: see spec-map.ts's pill-wall case. The accent cycle is unreadable in the
  // themes whose four accent roles are one colour, and a theme that wants variety cycles it in
  // its own skin.
  defaultChildren: () =>
    LABELS.map((text) => Pill({ text }).withTransition({ animIn: "none" })),
  anim: pillWallAnim,
});
