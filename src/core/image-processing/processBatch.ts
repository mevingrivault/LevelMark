import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { uniqueOutputPath } from "../export/path-conflicts";
import { outputPathFor } from "../renaming/filename";
import { getWatermarkPlacement } from "../watermark/placement";
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
      const outputPath = await processOneImage(request, image, index, dateForNaming);
      const result: ProcessImageResult = { id: image.id, status: "done", outputPath };
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

async function processOneImage(
  request: ProcessImagesRequest,
  image: ImageItem,
  index: number,
  dateForNaming: Date
): Promise<string> {
  const outputFolder = request.exportSettings.outputFolder;
  if (!outputFolder) {
    throw new Error("Choose an output folder before exporting.");
  }

  await fs.mkdir(outputFolder, { recursive: true });
  const candidatePath = outputPathFor(image, index, outputFolder, request.rename, dateForNaming);
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

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await pipeline
    .webp({
      quality: request.exportSettings.quality,
      effort: 4
    })
    .toFile(outputPath);

  return outputPath;
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
  const targetWidth = Math.max(1, Math.round(imageWidth * (settings.scalePercent / 100)));
  const targetHeight = Math.max(1, Math.round(targetWidth * (sourceHeight / sourceWidth)));

  const input = await sharp(settings.imagePath, { failOn: "none", animated: false })
    .rotate()
    .resize({ width: targetWidth, height: targetHeight, fit: "inside" })
    .ensureAlpha()
    .composite([
      {
        input: {
          create: {
            width: targetWidth,
            height: targetHeight,
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
    watermarkWidth: targetWidth,
    watermarkHeight: targetHeight,
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
