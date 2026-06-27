import type { ImageItem, RenameSettings } from "../types/models";

const ILLEGAL_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001F]/g;

export function buildPreviewName(image: ImageItem, index: number, settings: RenameSettings): string {
  const counter = String(settings.startCounter + index).padStart(settings.counterPadding, "0");
  const date = new Date().toISOString().slice(0, 10);
  const base = (settings.pattern.trim() || "{original}")
    .replaceAll("{original}", image.baseName)
    .replaceAll("{counter}", counter)
    .replaceAll("{number}", counter)
    .replaceAll("{date}", date)
    .replaceAll("{prefix}", settings.prefix)
    .replaceAll("{suffix}", settings.suffix)
    .replace(ILLEGAL_FILENAME_CHARS, "-")
    .trim();

  return `${base || "image"}.webp`;
}
