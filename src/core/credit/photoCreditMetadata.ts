/**
 * Photo-credit metadata I/O (main-process / Node only).
 *
 * LevelMark exports WebP by default. The mandatory target is the image caption
 * field that CMS interpret as IPTC "Caption/Abstract". Empirically (verified via
 * ExifTool round-trips):
 *   - JPEG / PNG : IPTC:Caption-Abstract can be embedded and read back exactly.
 *   - WebP       : the container has NO IPTC (IIM/APP13) slot; ExifTool can only
 *                  write EXIF and XMP there. The standard, CMS-recognised caption
 *                  equivalent in WebP is XMP-dc:Description (exposed by ExifTool's
 *                  Metadata Working Group "Description" composite, which is what
 *                  most CMS map to IPTC Caption/Abstract).
 *
 * Strategy: always write XMP-dc:Description (works everywhere, primary caption
 * target). Additionally write IPTC:Caption-Abstract on containers that support
 * it (JPEG/PNG). Validation re-reads the file from disk and confirms the caption.
 */
import { exiftool } from "exiftool-vendored";
import path from "node:path";

/** Extensions whose container supports a true IPTC IIM (Caption-Abstract) block. */
const IPTC_CAPABLE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff"]);

export interface WriteCreditResult {
  /** True when IPTC:Caption-Abstract itself was written (JPEG/PNG/TIFF). */
  iptcWritten: boolean;
  /** True when the XMP-dc:Description caption was written (all formats). */
  xmpWritten: boolean;
}

export interface CreditValidationResult {
  ok: boolean;
  /** Where the credit was actually found on re-read, for diagnostics. */
  foundIn: "iptc" | "xmp" | "none";
  actual?: string;
}

function iptcCapable(filePath: string): boolean {
  return IPTC_CAPABLE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

/**
 * Embed the photo credit into an existing file on disk.
 *
 * Always writes XMP-dc:Description. On IPTC-capable containers it also writes
 * the true IPTC:Caption-Abstract field. UTF-8 (accents, apostrophes, dashes) is
 * preserved via the IPTC coded character set.
 */
export async function writePhotoCreditMetadata(filePath: string, credit: string): Promise<WriteCreditResult> {
  const supportsIptc = iptcCapable(filePath);

  const tags: Record<string, string> = {
    "XMP-dc:Description": credit
  };

  if (supportsIptc) {
    tags["IPTC:Caption-Abstract"] = credit;
  }

  await exiftool.write(filePath, tags, {
    writeArgs: ["-overwrite_original", "-codedcharacterset=utf8"]
  });

  return { iptcWritten: supportsIptc, xmpWritten: true };
}

/**
 * Re-read the caption metadata from a file on disk.
 * Prefers the true IPTC field, falling back to the XMP-dc:Description equivalent.
 */
export async function readPhotoCreditMetadata(
  filePath: string
): Promise<{ iptc?: string; xmp?: string }> {
  const tags = await exiftool.read(filePath);
  const iptc = typeof tags["Caption-Abstract"] === "string" ? (tags["Caption-Abstract"] as string) : undefined;
  const xmp = typeof tags.Description === "string" ? (tags.Description as string) : undefined;
  return { iptc, xmp };
}

/**
 * Independently re-open the exported file and confirm the expected credit is
 * present and exactly equal. Success requires the caption to survive the full
 * pipeline in the final file (not an intermediate/temp file).
 */
export async function validatePhotoCreditMetadata(
  filePath: string,
  expectedCredit: string
): Promise<CreditValidationResult> {
  const { iptc, xmp } = await readPhotoCreditMetadata(filePath);

  if (iptc === expectedCredit) {
    return { ok: true, foundIn: "iptc", actual: iptc };
  }
  if (xmp === expectedCredit) {
    return { ok: true, foundIn: "xmp", actual: xmp };
  }

  return { ok: false, foundIn: "none", actual: iptc ?? xmp };
}

/** Release the shared ExifTool process (call on app shutdown). */
export async function endPhotoCreditMetadata(): Promise<void> {
  await exiftool.end();
}
