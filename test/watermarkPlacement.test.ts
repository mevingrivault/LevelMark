import { describe, expect, it } from "vitest";
import { getWatermarkTargetWidth } from "../src/core/watermark/placement";

// A typical wide watermark (e.g. a logo), aspect ratio 4:1.
const WIDE_WM = 4;
// A square watermark.
const SQUARE_WM = 1;

describe("getWatermarkTargetWidth", () => {
  it("scales off the shorter side, so it is consistent across orientations", () => {
    const scale = 20;
    // Landscape 2000x1000 and portrait 1000x2000 share the same shorter side (1000).
    const landscape = getWatermarkTargetWidth(2000, 1000, WIDE_WM, scale);
    const portrait = getWatermarkTargetWidth(1000, 2000, WIDE_WM, scale);
    expect(landscape).toBe(portrait);
    expect(landscape).toBe(200); // 20% of 1000
  });

  it("keeps a portrait image's watermark from becoming tiny", () => {
    // Narrow portrait: old width-based math gave 20% of 800 = 160.
    // New min-side math gives 20% of the shorter side (800) here too, but for a
    // very tall image the reference is the width, preserving a usable size.
    const wide = getWatermarkTargetWidth(4000, 800, SQUARE_WM, 20); // landscape, short side 800
    const tall = getWatermarkTargetWidth(800, 4000, SQUARE_WM, 20); // portrait, short side 800
    expect(wide).toBe(tall);
    expect(wide).toBe(160);
  });

  it("never overflows the image width", () => {
    // Huge scale on a wide watermark: must clamp to image width.
    const width = getWatermarkTargetWidth(500, 500, WIDE_WM, 100);
    expect(width).toBeLessThanOrEqual(500);
  });

  it("never overflows the image height for a tall watermark", () => {
    // Tall watermark (aspect ratio 0.25 = 1 wide : 4 tall) on a short landscape image.
    const tallWatermarkAspect = 0.25;
    const width = getWatermarkTargetWidth(2000, 300, tallWatermarkAspect, 80);
    const height = width / tallWatermarkAspect;
    expect(height).toBeLessThanOrEqual(300 + 0.001);
  });

  it("always returns at least 1px", () => {
    expect(getWatermarkTargetWidth(2, 2, 1, 1)).toBeGreaterThanOrEqual(1);
  });
});
