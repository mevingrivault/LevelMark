import type { Dialog, IpcMain, IpcMainInvokeEvent } from "electron";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { channels } from "../../src/types/channels";
import type {
  DisplayImage,
  ImageItem,
  ProcessImagesRequest,
  ProcessProgress,
  Locale,
  ProcessSummary
} from "../../src/types/models";
import { processBatch } from "../../src/core/image-processing/processBatch";

const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".tif",
  ".tiff",
  ".heic",
  ".heif",
  ".webp",
  ".gif",
  ".bmp"
]);

const WATERMARK_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp", ".gif", ".bmp", ".svg"]);

interface ImageIpcDependencies {
  dialog: Dialog;
  ipcMain: IpcMain;
  getLocale(): Locale;
}

function importLabels(locale: Locale): { title: string; message: string; files: string; folder: string; cancel: string } {
  return locale === "fr"
    ? {
        title: "Importer des images",
        message: "Que voulez-vous importer ?",
        files: "Choisir des images",
        folder: "Choisir un dossier",
        cancel: "Annuler"
      }
    : {
        title: "Import images",
        message: "What do you want to import?",
        files: "Choose images",
        folder: "Choose a folder",
        cancel: "Cancel"
      };
}

export function registerImageIpc({ dialog, ipcMain, getLocale }: ImageIpcDependencies): void {
  ipcMain.handle(channels.selectImages, async () => {
    const labels = importLabels(getLocale());
    const choice = await dialog.showMessageBox({
      type: "question",
      title: labels.title,
      message: labels.message,
      buttons: [labels.files, labels.folder, labels.cancel],
      defaultId: 0,
      cancelId: 2,
      noLink: true
    });

    if (choice.response === 2) {
      return [];
    }

    const result = await dialog.showOpenDialog({
      title: choice.response === 0 ? labels.files : labels.folder,
      properties: choice.response === 0 ? ["openFile", "multiSelections"] : ["openDirectory"],
      filters: choice.response === 0 ? [{ name: "Images", extensions: Array.from(SUPPORTED_IMAGE_EXTENSIONS, (ext) => ext.slice(1)) }] : undefined
    });

    if (result.canceled) {
      return [];
    }

    return collectImageItems(result.filePaths);
  });

  ipcMain.handle(channels.importPaths, async (_event, paths: string[]) => collectImageItems(paths));

  ipcMain.handle(channels.selectWatermark, async () => {
    const result = await dialog.showOpenDialog({
      title: "Select watermark",
      properties: ["openFile"],
      filters: [{ name: "Images", extensions: Array.from(WATERMARK_EXTENSIONS, (ext) => ext.slice(1)) }]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return undefined;
    }

    const selectedPath = result.filePaths[0];
    return isSupportedPath(selectedPath, WATERMARK_EXTENSIONS) ? selectedPath : undefined;
  });

  ipcMain.handle(channels.selectOutputFolder, async () => {
    const result = await dialog.showOpenDialog({
      title: "Choose output folder",
      properties: ["openDirectory", "createDirectory"]
    });

    return result.canceled ? undefined : result.filePaths[0];
  });

  ipcMain.handle(channels.getDisplayImage, async (_event, imagePath: string, maxPixels = 1600): Promise<DisplayImage> => {
    validateReadableImagePath(imagePath);
    const buffer = await sharp(imagePath, { failOn: "none", animated: false })
      .rotate()
      .resize({ width: maxPixels, height: maxPixels, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    const metadata = await sharp(buffer).metadata();

    return {
      path: imagePath,
      dataUrl: `data:image/png;base64,${buffer.toString("base64")}`,
      width: metadata.width,
      height: metadata.height
    };
  });

  ipcMain.handle(channels.processImages, async (event: IpcMainInvokeEvent, request: ProcessImagesRequest): Promise<ProcessSummary> => {
    return processBatch(request, (progress: ProcessProgress) => {
      event.sender.send(channels.processProgress, progress);
    });
  });
}

async function collectImageItems(inputPaths: string[]): Promise<ImageItem[]> {
  const discovered: string[] = [];

  for (const inputPath of inputPaths) {
    await collectSupportedImages(inputPath, discovered);
  }

  const unique = Array.from(new Set(discovered.map((filePath) => path.resolve(filePath))));
  const items = await Promise.all(unique.map((filePath) => imageItemFromPath(filePath)));
  return items.filter((item): item is ImageItem => item !== undefined);
}

async function collectSupportedImages(inputPath: string, output: string[]): Promise<void> {
  const absolutePath = path.resolve(inputPath);
  const stat = await fs.stat(absolutePath).catch(() => undefined);

  if (!stat) {
    return;
  }

  if (stat.isDirectory()) {
    const entries = await fs.readdir(absolutePath, { withFileTypes: true });
    await Promise.all(entries.map((entry) => collectSupportedImages(path.join(absolutePath, entry.name), output)));
    return;
  }

  if (stat.isFile() && isSupportedPath(absolutePath, SUPPORTED_IMAGE_EXTENSIONS)) {
    output.push(absolutePath);
  }
}

async function imageItemFromPath(filePath: string): Promise<ImageItem | undefined> {
  if (!isSupportedPath(filePath, SUPPORTED_IMAGE_EXTENSIONS)) {
    return undefined;
  }

  const stat = await fs.stat(filePath).catch(() => undefined);
  if (!stat?.isFile()) {
    return undefined;
  }

  const metadata = await sharp(filePath, { failOn: "none", animated: false }).metadata().catch(() => undefined);
  const parsed = path.parse(filePath);

  return {
    id: randomUUID(),
    path: filePath,
    fileName: parsed.base,
    baseName: parsed.name,
    relativePath: parsed.base,
    format: (metadata?.format ?? parsed.ext.slice(1)).toUpperCase(),
    sizeBytes: stat.size,
    width: metadata?.width,
    height: metadata?.height,
    status: "pending"
  };
}

function validateReadableImagePath(filePath: string): void {
  if (!isSupportedPath(filePath, SUPPORTED_IMAGE_EXTENSIONS) && !isSupportedPath(filePath, WATERMARK_EXTENSIONS)) {
    throw new Error("Unsupported image type.");
  }
}

function isSupportedPath(filePath: string, extensions: Set<string>): boolean {
  return extensions.has(path.extname(filePath).toLowerCase());
}
