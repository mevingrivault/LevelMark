import path from "node:path";
import type { ImageItem, RenameSettings } from "../../types/models";

const ILLEGAL_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001F]/g;

export function sanitizeFilename(input: string): string {
  const sanitized = input.replace(ILLEGAL_FILENAME_CHARS, "-").trim();
  return sanitized.length > 0 ? sanitized : "image";
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildOutputBaseName(item: ImageItem, index: number, settings: RenameSettings, date = new Date()): string {
  const counter = settings.startCounter + index;
  const paddedCounter = String(counter).padStart(Math.max(0, settings.counterPadding), "0");
  const pattern = settings.pattern.trim() || "{original}";

  return sanitizeFilename(
    pattern
      .replaceAll("{original}", item.baseName)
      .replaceAll("{counter}", paddedCounter)
      .replaceAll("{number}", paddedCounter)
      .replaceAll("{date}", formatDate(date))
      .replaceAll("{prefix}", settings.prefix)
      .replaceAll("{suffix}", settings.suffix)
  );
}

export function outputPathFor(item: ImageItem, index: number, outputFolder: string, settings: RenameSettings, date = new Date()): string {
  return path.join(outputFolder, `${buildOutputBaseName(item, index, settings, date)}.webp`);
}
