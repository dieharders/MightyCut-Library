import { futureDecorationComponent } from "../future-decoration-shapes";

/** Future decoration family — data / transmission motifs (waveform, equalizer bars,
 *  broadcast beam). Defaults to green. Positioned page-space flourish; add via a
 *  treatment's addDecorations(). Future-only by roster; paints with the shared 10 palette roles. */
export const Signal = futureDecorationComponent("signal", {
  variant: "waveform",
  x: 50,
  y: 50,
  size: 26,
  rotate: 0,
  layer: "back",
  accent: "accent-1",
});
