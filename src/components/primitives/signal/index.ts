import { futureDecorationComponent } from "../future-decoration-shapes";

/** Future decoration family — data / transmission motifs (waveform, equalizer bars,
 *  broadcast beam). Defaults to green. Positioned page-space flourish; add via a
 *  treatment's addDecorations(). Future-only (references --fx-* tokens). */
export const Signal = futureDecorationComponent(
  "signal",
  ["waveform", "bars", "beam"],
  { variant: "waveform", x: 50, y: 50, size: 26, rotate: 0, layer: "back", accent: "green" },
);
