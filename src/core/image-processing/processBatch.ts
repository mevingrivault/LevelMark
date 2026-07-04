import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { uniqueOutputPath } from "../export/path-conflicts";
import { outputPathFor } from "../renaming/filename";
import { getWatermarkPlacement, getWatermarkTargetWidth } from "../watermark/placement";
import { generatePhotoCredit } from "../credit/photoCredit";
import { validatePhotoCreditMetadata, writePhotoCreditMetadata } from "../credit/photoCreditMetadata";
import type {
  ImageItem,
  ProcessImagesRequest,
  ProcessImageResult,
  ProcessProgress,
  ProcessSummary,
  WatermarkSettings
} from "../../types/models";

type ProgressCallback = (progress: ProcessProgress) => void;

export async function processBatch(request: ProcessImagesRequest, onProgress: ProgressCallback): Promise<ProcessSummary> {
  const startedAt = Date.now();
  validateProcessRequest(request);

  const results: ProcessImageResult[] = [];
  const dateForNaming = new Date();

  for (let index = 0; index < request.images.length; index += 1) {
    const image = request.images[index];
    onProgress({ id: image.id, index, total: request.images.length, status: "processing" });

    try {
      const { outputPath, creditWarning } = await processOneImage(request, image, index, dateForNaming);
      const result: ProcessImageResult = { id: image.id, status: "done", outputPath, creditWarning };
      results.push(result);
      onProgress({ ...result, index, total: request.images.length });
    } catch (error) {
      const result: ProcessImageResult = {
        id: image.id,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown processing error."
      };
      results.push(result);
      onProgress({ ...result, index, total: request.images.length });
    }
  }

  return {
    total: request.images.length,
    succeeded: results.filter((result) => result.status === "done").length,
    failed: results.filter((result) => result.status === "failed").length,
    results,
    elapsedMs: Date.now() - startedAt
  };
}

interface ProcessedImage {
  outputPath: string;
  creditWarning?: string;
}

async function processOneImage(
  request: ProcessImagesRequest,
  image: ImageItem,
  index: number,
  dateForNaming: Date
): Promise<ProcessedImage> {
  const outputFolder = request.exportSettings.outputFolder;
  if (!outputFolder) {
    throw new Error("Choose an output folder before exporting.");
  }

  const format = request.exportSettings.format;

  await fs.mkdir(outputFolder, { recursive: true });
  const candidatePath = outputPathFor(image, index, outputFolder, request.rename, dateForNaming, format);
  const outputPath = await uniqueOutputPath(candidatePath, image.path, request.exportSettings.overwriteExisting);

  let pipeline = sharp(image.path, { failOn: "none", animated: false }).rotate();

  if (request.exportSettings.resizeEnabled) {
    pipeline = pipeline.resize({
      width: request.exportSettings.maxWidth,
      height: request.exportSettings.maxHeight,
      fit: "inside",
      withoutEnlargement: true
    });
  }

  const baseMetadata = await pipeline.metadata();
  const composites = await buildWatermarkComposites(baseMetadata.width ?? 0, baseMetadata.height ?? 0, request.watermark);

  if (composites.length > 0) {
    pipeline = pipeline.composite(composites);
  }

  if (!request.exportSettings.removeMetadata) {
    pipeline = pipeline.withMetadata();
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  if (format === "jpeg") {
    pipeline = pipeline.jpeg({ quality: request.exportSettings.quality, mozjpeg: true });
  } else {
    pipeline = pipeline.webp({ quality: request.exportSettings.quality, effort: 4 });
  }

  await pipeline.toFile(outputPath);

  const creditWarning = await applyPhotoCredit(request, outputPath);

  return { outputPath, creditWarning };
}

/**
 * When the "Crédit photo" mode is enabled with a non-empty author, embed the
 * caption into the already-written final file, then re-open it to verify.
 *
 * Never throws: a metadata failure is surfaced as a non-fatal warning so the
 * exported image itself is still delivered. Returns undefined when the mode is
 * off or the author is empty (pipeline behaviour then stays untouched).
 */
async function applyPhotoCredit(request: ProcessImagesRequest, outputPath: string): Promise<string | undefined> {
  if (!request.photoCredit?.enabled) {
    return undefined;
  }

  const credit = generatePhotoCredit(request.photoCredit.author);
  if (!credit) {
    return undefined;
  }

  try {
    await writePhotoCreditMetadata(outputPath, credit);
    const validation = await validatePhotoCreditMetadata(outputPath, credit);
    if (!validation.ok) {
      return `Photo credit could not be verified in the exported file (found: ${validation.actual ?? "nothing"}).`;
    }
    return undefined;
  } catch (error) {
    return `Photo credit metadata failed: ${error instanceof Error ? error.message : "unknown error"}.`;
  }
}

async function buildWatermarkComposites(
  imageWidth: number,
  imageHeight: number,
  settings: WatermarkSettings
): Promise<sharp.OverlayOptions[]> {
  if (!settings.imagePath || imageWidth <= 0 || imageHeight <= 0) {
    return [];
  }

  const watermark = sharp(settings.imagePath, { failOn: "none", animated: false }).rotate();
  const watermarkMetadata = await watermark.metadata();
  const sourceWidth = watermarkMetadata.width ?? 1;
  const sourceHeight = watermarkMetadata.height ?? 1;
  const targetWidth = Math.max(
    1,
    Math.round(getWatermarkTargetWidth(imageWidth, imageHeight, sourceWidth / sourceHeight, settings.scalePercent))
  );

  // Resize by width only so height follows the exact aspect ratio, then read the
  // real dimensions back. Building the opacity mask from the ACTUAL resized size
  // avoids a "must have same dimensions or smaller" composite error caused by
  // rounding differences between the requested and produced dimensions.
  const resized = await sharp(settings.imagePath, { failOn: "none", animated: false })
    .rotate()
    .resize({ width: targetWidth })
    .ensureAlpha()
    .png()
    .toBuffer();
  const resizedMetadata = await sharp(resized).metadata();
  const actualWidth = resizedMetadata.width ?? targetWidth;
  const actualHeight = resizedMetadata.height ?? Math.max(1, Math.round(targetWidth * (sourceHeight / sourceWidth)));

  const input = await sharp(resized)
    .composite([
      {
        input: {
          create: {
            width: actualWidth,
            height: actualHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: settings.opacity }
          }
        },
        blend: "dest-in"
      }
    ])
    .png()
    .toBuffer();

  if (settings.tiled) {
    return [
      {
        input,
        tile: true,
        gravity: "center"
      }
    ];
  }

  const { left, top } = getWatermarkPlacement({
    imageWidth,
    imageHeight,
    watermarkWidth: actualWidth,
    watermarkHeight: actualHeight,
    margin: settings.margin,
    position: settings.position
  });

  return [
    {
      input,
      left: Math.max(0, Math.round(left)),
      top: Math.max(0, Math.round(top))
    }
  ];
}

function validateProcessRequest(request: ProcessImagesRequest): void {
  if (!request.images.length) {
    throw new Error("Import at least one image before exporting.");
  }

  if (!request.exportSettings.outputFolder) {
    throw new Error("Choose an output folder before exporting.");
  }

  if (request.exportSettings.quality < 1 || request.exportSettings.quality > 100) {
    throw new Error("WebP quality must be between 1 and 100.");
  }
}
