/**
 * THE RING'S GEOMETRY — where spoke `index` of `total` sits, as the custom properties the
 * cluster-node skin rotates and seats by.
 *
 * It lives beside the spoke because the skin that reads these properties is the spoke's, but it
 * is CALLED by the treatment (treatments/cluster, `childLayout`): a position in a ring is a fact
 * about the SET, not about any one spoke. The spoke used to be told its `index` and `total` as
 * params, which put two numbers in the editor that nobody could sensibly set — delete one of
 * five spokes and the four survivors kept `total: 5`, opening a 72° hole where the deleted arm
 * was while the ring's radius (sized off the real count) closed up around it. Now the treatment
 * walks its children in draw order and hands each its place, so the ring is always exactly as
 * full as the children it has.
 */

/**
 * A spoke's angle, as a fraction of a turn, measured CLOCKWISE FROM THE TOP.
 *
 * The quarter-turn offset is what puts the first spoke at 12 o'clock rather than at 3: CSS
 * rotation starts at the positive x-axis, and a ring whose first item is on the right reads as
 * arbitrary where one starting at the top reads as ordered. Emitted in `turn` units so the skin
 * can hand it straight to `rotate()` without a magic 360.
 */
const angleTurns = (index: number, total: number): number => index / total - 0.25;

/**
 * |cos| and |sin| of that angle — the skin's SEATING correction, and the one thing about this
 * geometry that cannot be done in the skin alone.
 *
 * The puck counter-rotates about its own centre, so the layout leaves that centre half a
 * puck-width past the arm's tip. That is only the right offset for a HORIZONTAL spoke: what has
 * to clear the tip is the box's near edge, which sits `(w/2)|cos| + (h/2)|sin|` back from the
 * centre — half a width for a horizontal puck, but only half a HEIGHT for a vertical one. The
 * difference is why an upright spoke's label floats away from its line while a sideways one
 * sits flush.
 *
 * Emitted as a pair of plain numbers rather than computed from --ca in the skin, for the reason
 * --ca-inv is: one source for the angle, and no CSS trig to disagree with the rotation it
 * corrects.
 */
const angleTrig = (turns: number): { cos: number; sin: number } => ({
  cos: Math.abs(Math.cos(turns * 2 * Math.PI)),
  sin: Math.abs(Math.sin(turns * 2 * Math.PI)),
});

/** The placement properties for spoke `index` of `total`. `total` is the REAL child count, so
 *  the ring is as full as its spokes by construction; a single spoke sits at the top. */
export const ringPlacement = (index: number, total: number): Record<string, string> => {
  const turns = angleTurns(index, Math.max(total, 1));
  const { cos, sin } = angleTrig(turns);
  return {
    // The skin rotates the arm by --ca, then counter-rotates the puck by --ca-inv so the TYPE
    // stays upright. Two properties rather than one calc() in the skin, so the counter-rotation
    // cannot drift from the rotation it undoes.
    "--ca": `${turns.toFixed(4)}turn`,
    "--ca-inv": `${(-turns).toFixed(4)}turn`,
    // …and the pair that seats the counter-rotated puck back against the arm's tip.
    "--ccos": cos.toFixed(4),
    "--csin": sin.toFixed(4),
  };
};
