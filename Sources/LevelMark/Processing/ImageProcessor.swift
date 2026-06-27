import Foundation
import CoreGraphics

/// Stateless single-image pipeline: load → resize → watermark → encode → write.
/// Shared by both batch processing and the live preview (which skips the write step).
struct ImageProcessor {
    var watermark: WatermarkSettings
    var rename: RenameSettings
    var export: ExportSettings

    /// Produces the final composited, resized CGImage (no encoding/writing).
    /// `logo` is passed in so callers can cache it across a batch.
    func render(sourceURL: URL, logo: CGImage?) throws -> (image: CGImage, xmp: Data?) {
        let loaded = try ImageLoader.load(url: sourceURL)
        let resized = WatermarkRenderer.resize(loaded.image, settings: export)
        let composited = WatermarkRenderer.apply(watermark, logo: logo, to: resized)
        return (composited, loaded.xmp)
    }

    /// Full pipeline for one image; returns the URL it was written to.
    func process(item: ImageItem, index: Int, logo: CGImage?,
                 dateForNaming: Date) throws -> URL {
        let (image, xmp) = try render(sourceURL: item.url, logo: logo)

        let options = WebPEncoder.Options(
            quality: export.quality,
            lossless: export.lossless,
            preserveMetadata: export.preserveMetadata
        )
        let data = try WebPEncoder.encode(image, options: options, xmp: xmp)

        let outputURL = try resolveOutputURL(for: item, index: index, dateForNaming: dateForNaming)
        try FileManager.default.createDirectory(
            at: outputURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try data.write(to: outputURL, options: .atomic)
        return outputURL
    }

    /// Computes the destination URL, honoring renaming, folder structure, and the
    /// "never overwrite" rule (deduplicates with " (1)", " (2)" … unless overwrite is on).
    func resolveOutputURL(for item: ImageItem, index: Int, dateForNaming: Date) throws -> URL {
        guard let folder = export.outputFolderURL else {
            throw NSError(domain: "BPP", code: 1,
                          userInfo: [NSLocalizedDescriptionKey: "No output folder selected."])
        }

        let builder = FilenameBuilder(settings: rename, date: dateForNaming)
        let base = builder.baseName(original: item.baseName, index: index)

        var directory = folder
        if export.keepFolderStructure {
            let relDir = (item.relativePath as NSString).deletingLastPathComponent
            if !relDir.isEmpty {
                directory = folder.appendingPathComponent(relDir, isDirectory: true)
            }
        }

        var candidate = directory.appendingPathComponent(base).appendingPathExtension("webp")

        // Never clobber an existing file (incl. the original) unless explicitly allowed.
        if !export.overwriteExisting {
            var counter = 1
            while FileManager.default.fileExists(atPath: candidate.path) || candidate == item.url {
                candidate = directory.appendingPathComponent("\(base) (\(counter))")
                    .appendingPathExtension("webp")
                counter += 1
            }
        } else if candidate == item.url {
            // Even with overwrite on, refuse to destroy the source we're reading.
            candidate = directory.appendingPathComponent("\(base) (converted)")
                .appendingPathExtension("webp")
        }

        return candidate
    }
}
