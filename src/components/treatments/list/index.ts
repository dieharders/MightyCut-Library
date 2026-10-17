import template from "./template.html" with { type: "text" };
import { ListNumber } from "../../primitives/list-number";
import { treatment } from "../../runtime/treatment";
import { listAnim } from "./anim";
import { ListSchema } from "./schema";

/**
 * The general-purpose list — 2-5 short claims, one per ROW, each a numbered `list-number`
 * child on a plate of its own (each theme's list.css gives the row the same plate its feature
 * card wears), stacked down the frame.
 *
 * This look used to compose as cards, sharing `feature-cards`' skin, because the two had always
 * been normalised to one `{title, body}` shape downstream; the `list-number` primitive was built
 * for exactly this rendering and had no treatment to land in. A row is a numbered claim with an
 * optional second line; a card is an icon, a title and a body.
 */
export const List = treatment({
  name: "list",
  childComponent: "list-number",
  schema: ListSchema,
  template,
  ground: "secondary",
  example: { headline: "What the platform gives you" },
  fill: (p) => ({ headline: p.headline }),
  defaultChildren: () => [
    ListNumber({ num: "01", text: "One prompt in", detail: "Describe the video you want." }),
    ListNumber({ num: "02", text: "A deck back", detail: "Themed, captioned and timed to the voiceover." }),
    ListNumber({ num: "03", text: "Render when ready", detail: "Preview first; the MP4 is a separate step." }),
  ],
  anim: listAnim,
});
