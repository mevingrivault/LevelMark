import Foundation
import CoreGraphics
import ImageIO
import AppKit
import UniformTypeIdentifiers

enum ImageLoadError: LocalizedError {
    case cannotOpen(URL)
    case cannotDecode(URL)

    var errorDescription: String? {
        switch self {
        case .cannotOpen(let u): return "Could not open \(u.lastPathComponent)."
        case .cannotDecode(let u): return "Could not decode \(u.lastPathComponent)."
        }
    }
}

/// Loads images via ImageIO (JPG/PNG/TIFF/HEIC/…), bakes EXIF orientation into
/// the pixels so downstream watermarking/resizing uses an upright image.
enum ImageLoader {

    /// Loads a fully decoded, upright CGImage plus the raw XMP metadata (if any),
    /// for optional re-embedding on export.
    static func load(url: URL) throws -> (image: CGImage, xmp: Data?) {
        guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else {
            throw ImageLoadError.cannotOpen(url)
        }
        guard let raw = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
            throw ImageLoadError.cannotDecode(url)
        }

        let props = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any]
        let orientationRaw = (props?[kCGImagePropertyOrientation] as? UInt32) ?? 1
        let upright = applyOrientation(to: raw, orientation: orientationRaw)

        var xmp: Data?
        if let meta = CGImageSourceCopyMetadataAtIndex(source, 0, nil),
           let xmpData = CGImageMetadataCreateXMPData(meta, nil) {
            xmp = xmpData as Data
        }

        return (upright, xmp)
    }

    /// Generates a thumbnail no larger than `maxPixel` on its longest side.
    static func thumbnail(url: URL, maxPixel: Int = 256) -> NSImage? {
        guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else { return nil }
        let options: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,   // honor orientation
            kCGImageSourceThumbnailMaxPixelSize: maxPixel
        ]
        guard let cg = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else { return nil }
        return NSImage(cgImage: cg, size: NSSize(width: cg.width, height: cg.height))
    }

    /// Returns a copy of `image` redrawn so that EXIF orientation is applied.
    private static func applyOrientation(to image: CGImage, orientation: UInt32) -> CGImage {
        guard orientation != 1 else { return image }

        let w = image.width
        let h = image.height
        // Orientations 5–8 swap width/height.
        let swap = orientation >= 5
        let outW = swap ? h : w
        let outH = swap ? w : h

        let colorSpace = image.colorSpace ?? CGColorSpace(name: CGColorSpace.sRGB)!
        guard let ctx = CGContext(
            data: nil, width: outW, height: outH,
            bitsPerComponent: 8, bytesPerRow: 0,
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { return image }

        // Transforms map the source rectangle into the upright output space.
        var transform = CGAffineTransform.identity
        switch orientation {
        case 2: transform = CGAffineTransform(a: -1, b: 0, c: 0, d: 1, tx: CGFloat(outW), ty: 0)
        case 3: transform = CGAffineTransform(a: -1, b: 0, c: 0, d: -1, tx: CGFloat(outW), ty: CGFloat(outH))
        case 4: transform = CGAffineTransform(a: 1, b: 0, c: 0, d: -1, tx: 0, ty: CGFloat(outH))
        case 5: transform = CGAffineTransform(a: 0, b: -1, c: -1, d: 0, tx: CGFloat(outW), ty: CGFloat(outH))
        case 6: transform = CGAffineTransform(a: 0, b: -1, c: 1, d: 0, tx: 0, ty: CGFloat(outH))
        case 7: transform = CGAffineTransform(a: 0, b: 1, c: 1, d: 0, tx: 0, ty: 0)
        case 8: transform = CGAffineTransform(a: 0, b: 1, c: -1, d: 0, tx: CGFloat(outW), ty: 0)
        default: break
        }

        ctx.concatenate(transform)
        ctx.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))
        return ctx.makeImage() ?? image
    }
}
