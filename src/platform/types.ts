import type {
  DisplayImage,
  ImageItem,
  ProcessImagesRequest,
  ProcessProgress,
  ProcessSummary
} from "../types/models";

export interface FilePlatform {
  selectImages(): Promise<ImageItem[]>;
  importPaths(paths: string[]): Promise<ImageItem[]>;
  selectWatermark(): Promise<string | undefined>;
  selectOutputFolder(): Promise<string | undefined>;
  getDisplayImage(path: string, maxPixels?: number): Promise<DisplayImage>;
  getPathForFile(file: File): string;
  processImages(request: ProcessImagesRequest): Promise<ProcessSummary>;
  onProcessingProgress(callback: (progress: ProcessProgress) => void): () => void;
}
