import type { WatermarkPosition } from "../../types/models";

/**
 * Target watermark width in pixels for a given image, independent of orientation.
 *
 * `scalePercent` is applied to the image's SHORTER side (like the margin, which
 * is an absolute px value) so a watermark keeps a consistent visual size whether
 * the photo is landscape or portrait. Basing it on the width alone made the mark
 * shrink dramatically on narrow portrait images. The result is also clamped so
 * the mark never exceeds the image bounds.
 */
export function getWatermarkTargetWidth(
  imageWidth: number,
  imageHeight: number,
  watermarkAspectRatio: number,
  scalePercent: number
): number {
  const reference = Math.min(imageWidth, imageHeight);
  let width = reference * (scalePercent / 100);

  // Never overflow the image, in either dimension.
  const maxWidth = imageWidth;
  const maxHeightAsWidth = imageHeight * watermarkAspectRatio;
  width = Math.min(width, maxWidth, maxHeightAsWidth);

  return Math.max(1, width);
}

export interface PlacementInput {
  imageWidth: number;
  imageHeight: number;
  watermarkWidth: number;
  watermarkHeight: number;
  margin: number;
  position: WatermarkPosition;
}

export function getWatermarkPlacement(input: PlacementInput): { left: number; top: number } {
  const { imageWidth, imageHeight, watermarkWidth, watermarkHeight, margin, position } = input;

  switch (position) {
    case "top-left":
      return { left: margin, top: margin };
    case "top-right":
      return { left: imageWidth - watermarkWidth - margin, top: margin };
    case "bottom-left":
      return { left: margin, top: imageHeight - watermarkHeight - margin };
    case "bottom-right":
      return { left: imageWidth - watermarkWidth - margin, top: imageHeight - watermarkHeight - margin };
    case "center":
      return { left: (imageWidth - watermarkWidth) / 2, top: (imageHeight - watermarkHeight) / 2 };
  }
}
