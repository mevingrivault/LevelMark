import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { processBatch } from "../src/core/image-processing/processBatch";
import type { ImageItem, ProcessImagesRequest, WatermarkSettings } from "../src/types/models";

async function makeImage(dir: string, name: string, width: number, height: number): Promise<ImageItem> {
  const filePath = path.join(dir, `${name}.jpg`);
  await writeFile(
    filePath,
    await sharp({ create: { width, height, channels: 3, background: { r: 120, g: 120, b: 120 } } }).jpeg().toBuffer()
  );
  return {
    id: name,
    path: filePath,
    fileName: `${name}.jpg`,
    baseName: name,
    relativePath: `${name}.jpg`,
    format: "JPEG",
    sizeBytes: 0,
    status: "pending",
    included: true
  };
}

async function makeWatermark(dir: string): Promise<string> {
  // A wide logo-like watermark (4:1).
  const filePath = path.join(dir, "wm.png");
  await writeFile(
    filePath,
    await sharp({ create: { width: 400, height: 100, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } } })
      .png()
      .toBuffer()
  );
  return filePath;
}

function request(images: ImageItem[], out: string, watermark: WatermarkSettings): ProcessImagesRequest {
  return {
    images,
    watermark,
    rename: { pattern: "{original}", prefix: "", suffix: "", startCounter: 1, counterPadding: 3 },
    exportSettings: {
      outputFolder: out,
      format: "webp",
      quality: 82,
      removeMetadata: true,
      resizeEnabled: false,
      overwriteExisting: true
    },
    photoCredit: { enabled: false, author: "" }
  };
}

describe("watermark works on landscape and portrait alike", () => {
  it("exports both orientations without failure and keeps their dimensions", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "lm-orient-"));
    try {
      const out = path.join(dir, "out");
      const wmPath = await makeWatermark(dir);
      const landscape = await makeImage(dir, "landscape", 1600, 900);
      const portrait = await makeImage(dir, "portrait", 900, 1600);

      const watermark: WatermarkSettings = {
        imagePath: wmPath,
        position: "bottom-right",
        margin: 30,
        opacity: 0.9,
        scalePercent: 25,
        tiled: false
      };

      const summary = await processBatch(request([landscape, portrait], out, watermark), () => {});
      expect(summary.failed).toBe(0);
      expect(summary.succeeded).toBe(2);

      const byId = Object.fromEntries(summary.results.map((r) => [r.id, r.outputPath!]));
      const landscapeMeta = await sharp(await readFile(byId.landscape)).metadata();
      const portraitMeta = await sharp(await readFile(byId.portrait)).metadata();

      // Output preserves each orientation (no crop / no failed composite).
      expect(landscapeMeta.width).toBe(1600);
      expect(landscapeMeta.height).toBe(900);
      expect(portraitMeta.width).toBe(900);
      expect(portraitMeta.height).toBe(1600);
    } finally {
      await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    }
  });

  it("handles a tiled watermark on a portrait image", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "lm-tile-"));
    try {
      const out = path.join(dir, "out");
      const wmPath = await makeWatermark(dir);
      const portrait = await makeImage(dir, "portrait", 800, 1400);

      const watermark: WatermarkSettings = {
        imagePath: wmPath,
        position: "center",
        margin: 0,
        opacity: 0.5,
        scalePercent: 20,
        tiled: true
      };

      const summary = await processBatch(request([portrait], out, watermark), () => {});
      expect(summary.failed).toBe(0);
      const meta = await sharp(await readFile(summary.results[0].outputPath!)).metadata();
      expect(meta.width).toBe(800);
      expect(meta.height).toBe(1400);
    } finally {
      await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    }
  });
});
