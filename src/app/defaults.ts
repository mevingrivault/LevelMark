import type { ExportSettings, PhotoCreditSettings, RenameSettings, WatermarkSettings } from "../types/models";

export const defaultWatermark: WatermarkSettings = {
  position: "bottom-right",
  margin: 40,
  opacity: 0.85,
  scalePercent: 20,
  tiled: false
};

export const defaultRename: RenameSettings = {
  pattern: "{original}-watermarked",
  prefix: "",
  suffix: "",
  startCounter: 1,
  counterPadding: 3
};

export const defaultExport: ExportSettings = {
  format: "webp",
  quality: 82,
  removeMetadata: true,
  resizeEnabled: false,
  maxWidth: 2000,
  maxHeight: 2000,
  overwriteExisting: false
};

export const defaultPhotoCredit: PhotoCreditSettings = {
  enabled: false,
  author: ""
};
