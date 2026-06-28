import { contextBridge, ipcRenderer, webUtils } from "electron";
import { channels } from "../src/types/channels";
import type {
  DisplayImage,
  ImageItem,
  ProcessImagesRequest,
  ProcessProgress,
  ProcessSummary,
  UpdateStatus
} from "../src/types/models";

contextBridge.exposeInMainWorld("levelMark", {
  selectImages: (): Promise<ImageItem[]> => ipcRenderer.invoke(channels.selectImages),
  importPaths: (paths: string[]): Promise<ImageItem[]> => ipcRenderer.invoke(channels.importPaths, paths),
  selectWatermark: (): Promise<string | undefined> => ipcRenderer.invoke(channels.selectWatermark),
  selectOutputFolder: (): Promise<string | undefined> => ipcRenderer.invoke(channels.selectOutputFolder),
  getDisplayImage: (imagePath: string, maxPixels?: number): Promise<DisplayImage> =>
    ipcRenderer.invoke(channels.getDisplayImage, imagePath, maxPixels),
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),
  processImages: (request: ProcessImagesRequest): Promise<ProcessSummary> =>
    ipcRenderer.invoke(channels.processImages, request),
  onProcessingProgress: (callback: (progress: ProcessProgress) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: ProcessProgress) => callback(progress);
    ipcRenderer.on(channels.processProgress, listener);
    return () => ipcRenderer.removeListener(channels.processProgress, listener);
  },
  checkForUpdates: (): Promise<UpdateStatus> => ipcRenderer.invoke(channels.checkForUpdates),
  installUpdate: (): Promise<void> => ipcRenderer.invoke(channels.installUpdate),
  onUpdateStatus: (callback: (status: UpdateStatus) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, status: UpdateStatus) => callback(status);
    ipcRenderer.on(channels.updateStatus, listener);
    return () => ipcRenderer.removeListener(channels.updateStatus, listener);
  }
});
