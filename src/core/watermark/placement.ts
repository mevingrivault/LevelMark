import type { WatermarkPosition } from "../../types/models";

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
