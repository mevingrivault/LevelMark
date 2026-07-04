import { afterAll, describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { processBatch } from "../src/core/image-processing/processBatch";
import { endPhotoCreditMetadata, readPhotoCreditMetadata } from "../src/core/credit/photoCreditMetadata";
import type { ImageItem, ProcessImagesRequest } from "../src/types/models";

async function makeSource(dir: string, name: string): Promise<ImageItem> {
  const filePath = path.join(dir, `${name}.jpg`);
  await writeFile(
    filePath,
    await sharp({ create: { width: 200, height: 150, channels: 3, background: { r: 200, g: 40, b: 40 } } })
      .jpeg()
      .toBuffer()
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

function baseRequest(images: ImageItem[], outputFolder: string): ProcessImagesRequest {
  return {
    images,
    watermark: { position: "bottom-right", margin: 20, opacity: 0.8, scalePercent: 20, tiled: false },
    rename: { pattern: "{original}", prefix: "", suffix: "", startCounter: 1, counterPadding: 3 },
    exportSettings: {
      outputFolder,
      format: "webp",
      quality: 82,
      removeMetadata: true,
      resizeEnabled: true,
      maxWidth: 120,
      maxHeight: 120,
      overwriteExisting: true
    },
    photoCredit: { enabled: false, author: "" }
  };
}

afterAll(async () => {
  await endPhotoCreditMetadata();
});

describe("processBatch photo credit integration", () => {
  it("embeds a real IPTC:Caption-Abstract in the FINAL exported JPEG (CMS caption)", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "lm-jpg-"));
    try {
      const out = path.join(dir, "out");
      const image = await makeSource(dir, "jpgcredit");
      const req = baseRequest([image], out);
      req.exportSettings.format = "jpeg";
      req.photoCredit = { enabled: true, author: "Mévin Grivault" };

      const summary = await processBatch(req, () => {});
      const result = summary.results[0];
      expect(result.status).toBe("done");
      expect(result.creditWarning).toBeUndefined();
      expect(path.extname(result.outputPath!)).toBe(".jpg");

      // This is the field WordPress reads for the media "Caption".
      const { iptc } = await readPhotoCreditMetadata(result.outputPath!);
      expect(iptc).toBe("Crédit photo : Mévin Grivault");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("does NOT touch caption metadata when the mode is disabled", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "lm-off-"));
    try {
      const out = path.join(dir, "out");
      const image = await makeSource(dir, "off");
      const summary = await processBatch(baseRequest([image], out), () => {});
      const outputPath = summary.results[0].outputPath!;

      const { iptc, xmp } = await readPhotoCreditMetadata(outputPath);
      expect(iptc).toBeUndefined();
      expect(xmp).toBeUndefined();
      expect(summary.results[0].creditWarning).toBeUndefined();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("embeds and verifies the caption in the FINAL exported WebP when enabled", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "lm-on-"));
    try {
      const out = path.join(dir, "out");
      const image = await makeSource(dir, "on");
      const req = baseRequest([image], out);
      req.photoCredit = { enabled: true, author: "  Mévin Grivault  " };

      const summary = await processBatch(req, () => {});
      const result = summary.results[0];
      expect(result.status).toBe("done");
      expect(result.creditWarning).toBeUndefined();

      // Re-open the final file independently and confirm the exact value.
      const outputPath = result.outputPath!;
      expect(path.extname(outputPath)).toBe(".webp");
      const { xmp } = await readPhotoCreditMetadata(outputPath);
      expect(xmp).toBe("Crédit photo : Mévin Grivault");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("does NOT write a credit when enabled but author is empty", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "lm-empty-"));
    try {
      const out = path.join(dir, "out");
      const image = await makeSource(dir, "empty");
      const req = baseRequest([image], out);
      req.photoCredit = { enabled: true, author: "   " };

      const summary = await processBatch(req, () => {});
      const outputPath = summary.results[0].outputPath!;

      const { iptc, xmp } = await readPhotoCreditMetadata(outputPath);
      expect(iptc).toBeUndefined();
      expect(xmp).toBeUndefined();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("applies the same author to every image in the batch", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "lm-batch-"));
    try {
      const out = path.join(dir, "out");
      const images = [await makeSource(dir, "a"), await makeSource(dir, "b")];
      const req = baseRequest(images, out);
      req.photoCredit = { enabled: true, author: "Édouard Touzan" };

      const summary = await processBatch(req, () => {});
      expect(summary.succeeded).toBe(2);

      for (const result of summary.results) {
        const { xmp } = await readPhotoCreditMetadata(result.outputPath!);
        expect(xmp).toBe("Crédit photo : Édouard Touzan");
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
