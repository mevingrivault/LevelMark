import { afterAll, describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { generatePhotoCredit } from "../src/core/credit/photoCredit";
import {
  endPhotoCreditMetadata,
  readPhotoCreditMetadata,
  validatePhotoCreditMetadata,
  writePhotoCreditMetadata
} from "../src/core/credit/photoCreditMetadata";

type Format = "jpg" | "png" | "webp";

async function makeImage(dir: string, format: Format, name = "sample"): Promise<string> {
  const filePath = path.join(dir, `${name}.${format}`);
  const base = sharp({ create: { width: 40, height: 40, channels: 3, background: { r: 20, g: 90, b: 140 } } });
  const encoded =
    format === "jpg" ? base.jpeg() : format === "png" ? base.png() : base.webp({ quality: 82 });
  await writeFile(filePath, await encoded.toBuffer());
  return filePath;
}

afterAll(async () => {
  await endPhotoCreditMetadata();
});

describe("photo credit metadata round-trip", () => {
  it("embeds real IPTC:Caption-Abstract in JPEG and reads it back exactly", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "lm-jpg-"));
    try {
      const file = await makeImage(dir, "jpg");
      const credit = generatePhotoCredit("Mévin Grivault")!;

      const result = await writePhotoCreditMetadata(file, credit);
      expect(result.iptcWritten).toBe(true);

      const { iptc, xmp } = await readPhotoCreditMetadata(file);
      expect(iptc).toBe("Crédit photo : Mévin Grivault");
      expect(xmp).toBe("Crédit photo : Mévin Grivault");

      const validation = await validatePhotoCreditMetadata(file, credit);
      expect(validation.ok).toBe(true);
      expect(validation.foundIn).toBe("iptc");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("embeds real IPTC:Caption-Abstract in PNG and reads it back exactly", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "lm-png-"));
    try {
      const file = await makeImage(dir, "png");
      const credit = generatePhotoCredit("Édouard Touzan")!;

      const result = await writePhotoCreditMetadata(file, credit);
      expect(result.iptcWritten).toBe(true);

      const validation = await validatePhotoCreditMetadata(file, credit);
      expect(validation.ok).toBe(true);
      expect(validation.actual).toBe("Crédit photo : Édouard Touzan");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("embeds the caption in WebP via XMP-dc:Description (IPTC IIM unsupported by the container)", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "lm-webp-"));
    try {
      const file = await makeImage(dir, "webp");
      const credit = generatePhotoCredit("Mévin Grivault")!;

      const result = await writePhotoCreditMetadata(file, credit);
      // WebP has no IPTC IIM slot; only the XMP caption is written.
      expect(result.iptcWritten).toBe(false);
      expect(result.xmpWritten).toBe(true);

      const { iptc, xmp } = await readPhotoCreditMetadata(file);
      expect(iptc).toBeUndefined();
      expect(xmp).toBe("Crédit photo : Mévin Grivault");

      const validation = await validatePhotoCreditMetadata(file, credit);
      expect(validation.ok).toBe(true);
      expect(validation.foundIn).toBe("xmp");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("preserves apostrophes and dashes through the file round-trip (JPEG)", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "lm-utf8-"));
    try {
      const file = await makeImage(dir, "jpg");
      const credit = generatePhotoCredit("Jean-Pierre O'Brien")!;

      await writePhotoCreditMetadata(file, credit);
      const validation = await validatePhotoCreditMetadata(file, credit);

      expect(validation.ok).toBe(true);
      expect(validation.actual).toBe("Crédit photo : Jean-Pierre O'Brien");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("reports a mismatch when the expected credit differs", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "lm-mismatch-"));
    try {
      const file = await makeImage(dir, "jpg");
      await writePhotoCreditMetadata(file, generatePhotoCredit("Someone Else")!);

      const validation = await validatePhotoCreditMetadata(file, "Crédit photo : Mévin Grivault");
      expect(validation.ok).toBe(false);
      expect(validation.foundIn).toBe("none");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
