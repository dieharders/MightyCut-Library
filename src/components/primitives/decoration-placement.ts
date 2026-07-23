// The placement contract every decoration family shares — the props that say WHERE a
// flourish sits and WHAT colour it takes, independent of which shape engine draws it.
//
// Both engines (block's neobrutalist decoration-shapes.ts and future's luminous
// future-decoration-shapes.ts) build their families over this. They differ only in the
// shapes, the CSS, and the two knobs below (`sizeDefault`, `accentDescription`) — so the
// x/y/size/rotate/layer/accent vocabulary is authored ONCE. Duplicating it was how the two
// engines could silently drift in range, default or wording, which is precisely the class
// of drift the theme-parity sweeps exist to catch.
import { z } from "zod";
import { PALETTE_VARS, type PaletteVar } from "../../types/palette";

/** The params every decoration family takes: a shape variant + page-space placement. */
export type DecoParams = {
  variant: string;
  x: number;
  y: number;
  size: number;
  rotate: number;
  layer: "back" | "front";
  accent: PaletteVar;
};

export type DecoSchemaOpts = {
  /** The family's own disjoint shape list (its `variant` enum; first entry is the default). */
  variants: readonly string[];
  /** Default `size`, as a percent of the 1920 design width. Block's solids sit at 16;
   *  future's hairline shapes need more area to read, so they run larger. */
  sizeDefault: number;
  /** The family's signature tint — taken from its own `example`, so an unparameterised
   *  render (a ChildSpec or `Slab({variant})` with no accent) never collapses every family
   *  onto one hue. */
  accentDefault: PaletteVar;
  /** Engine-specific wording for the accent field (block fills, future strokes + glows). */
  accentDescription: string;
};

/** The shared `variant` + placement + accent schema for one decoration family. */
export const decorationSchema = ({
  variants,
  sizeDefault,
  accentDefault,
  accentDescription,
}: DecoSchemaOpts) =>
  z.object({
    variant: z
      .enum(variants as [string, ...string[]])
      .default(variants[0]!)
      .describe("Shape"),
    x: z
      .number()
      .min(0)
      .max(100)
      .default(50)
      .describe("X origin in page-space (0% = left … 100% = right)"),
    y: z
      .number()
      .min(0)
      .max(100)
      .default(50)
      .describe("Y origin in page-space (0% = top … 100% = bottom)"),
    size: z
      .number()
      .positive()
      .max(60)
      .default(sizeDefault)
      .describe(
        `Size as a percent of the 1920 design width (${sizeDefault} = ${sizeDefault}%, emitted as rem)`,
      ),
    rotate: z.number().min(-180).max(180).default(0).describe("Rotation in degrees"),
    layer: z
      .enum(["back", "front"])
      .default("back")
      .describe("Behind content (back) or over top (front)"),
    accent: z.enum(PALETTE_VARS).default(accentDefault).describe(accentDescription),
  });
