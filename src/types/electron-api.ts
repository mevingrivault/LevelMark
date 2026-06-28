import type {
  DisplayImage,
  ImageItem,
  ProcessImagesRequest,
  ProcessProgress,
  ProcessSummary,
  UpdateStatus
} from "./models";

export interface LevelMarkApi {
  selectImages(): Promise<ImageItem[]>;
  importPaths(paths: string[]): Promise<ImageItem[]>;
  selectWatermark(): Promise<string | undefined>;
  selectOutputFolder(): Promise<string | undefined>;
  getDisplayImage(path: string, maxPixels?: number): Promise<DisplayImage>;
  getPathForFile(file: File): string;
  processImages(request: ProcessImagesRequest): Promise<ProcessSummary>;
  onProcessingProgress(callback: (progress: ProcessProgress) => void): () => void;
  checkForUpdates(): Promise<UpdateStatus>;
  installUpdate(): Promise<void>;
  onUpdateStatus(callback: (status: UpdateStatus) => void): () => void;
}

declare global {
  interface Window {
    levelMark: LevelMarkApi;
  }
}
