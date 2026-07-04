export type Locale = "en" | "fr";

export type ImageStatus = "pending" | "processing" | "done" | "failed" | "skipped";

export type WatermarkPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

export interface ImageItem {
  id: string;
  path: string;
  fileName: string;
  baseName: string;
  relativePath: string;
  format: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  status: ImageStatus;
  outputPath?: string;
  error?: string;
}

export interface WatermarkSettings {
  imagePath?: string;
  position: WatermarkPosition;
  margin: number;
  opacity: number;
  scalePercent: number;
  tiled: boolean;
}

export interface RenameSettings {
  pattern: string;
  prefix: string;
  suffix: string;
  startCounter: number;
  counterPadding: number;
}

export interface ExportSettings {
  outputFolder?: string;
  quality: number;
  removeMetadata: boolean;
  resizeEnabled: boolean;
  maxWidth?: number;
  maxHeight?: number;
  overwriteExisting: boolean;
}

/**
 * Optional "Crédit photo" mode. When enabled with a non-empty author, LevelMark
 * embeds the caption "Crédit photo : {author}" into the exported file metadata.
 */
export interface PhotoCreditSettings {
  enabled: boolean;
  author: string;
}


export interface ProfileSettings {
  watermark: WatermarkSettings;
  rename: RenameSettings;
  exportSettings: ExportSettings;
  photoCredit: PhotoCreditSettings;
}

export interface UserProfile {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  settings: ProfileSettings;
}

export interface SaveProfileRequest {
  id?: string;
  name: string;
  settings: ProfileSettings;
}

export interface ProcessImagesRequest {
  images: ImageItem[];
  watermark: WatermarkSettings;
  rename: RenameSettings;
  exportSettings: ExportSettings;
  photoCredit: PhotoCreditSettings;
}

export interface ProcessImageResult {
  id: string;
  status: ImageStatus;
  outputPath?: string;
  error?: string;
  /** Non-fatal note when the photo credit could not be fully embedded/verified. */
  creditWarning?: string;
}

export interface ProcessProgress {
  id: string;
  index: number;
  total: number;
  status: ImageStatus;
  outputPath?: string;
  error?: string;
  creditWarning?: string;
}

export interface ProcessSummary {
  total: number;
  succeeded: number;
  failed: number;
  results: ProcessImageResult[];
  elapsedMs: number;
}

export interface DisplayImage {
  path: string;
  dataUrl: string;
  width?: number;
  height?: number;
}
export type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

export interface UpdateStatus {
  state: UpdateState;
  version?: string;
  percent?: number;
  message?: string;
}
