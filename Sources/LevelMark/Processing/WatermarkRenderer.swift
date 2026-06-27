import Foundation
import CoreGraphics
import AppKit
import ImageIO

/// Renders watermarks (logo + optional text) and handles resizing.
/// All drawing happens in an sRGB bitmap context for predictable, web-ready color.
enum WatermarkRenderer {

    static let sRGB = CGColorSpace(name: CGColorSpace.sRGB)!

    /// Loads a logo CGImage from disk (cached by the caller if needed).
    static func loadLogo(_ url: URL) -> CGImage? {
        guard let src = CGImageSourceCreateWithURL(url as CFURL, nil) else { return nil }
        let opts: [CFString: Any] = [kCGImageSourceCreateThumbnailWithTransform: true]
        return CGImageSourceCreateImageAtIndex(src, 0, opts as CFDictionary)
    }

    /// Resizes `image` according to the export settings. Returns the input unchanged
    /// if resizing is disabled or would upscale when upscaling is not allowed.
    static func resize(_ image: CGImage, settings: ExportSettings) -> CGImage {
        guard settings.resizeEnabled else { return image }
        let w = CGFloat(image.width)
        let h = CGFloat(image.height)

        var scale: CGFloat = 1
        switch settings.resizeMode {
        case .longestEdge:
            let target = CGFloat(max(1, settings.maxLongestEdge))
            scale = target / max(w, h)
        case .fitWithin:
            let tw = CGFloat(max(1, settings.maxWidth))
            let th = CGFloat(max(1, settings.maxHeight))
            scale = min(tw / w, th / h)
        }

        if scale >= 1 && !settings.allowUpscale { return image }
        if scale == 1 { return image }

        let outW = max(1, Int((w * scale).rounded()))
        let outH = max(1, Int((h * scale).rounded()))
        guard let ctx = makeContext(width: outW, height: outH) else { return image }
        ctx.interpolationQuality = .high
        ctx.draw(image, in: CGRect(x: 0, y: 0, width: outW, height: outH))
        return ctx.makeImage() ?? image
    }

    /// Draws the watermark(s) onto `image` and returns the composited result.
    static func apply(_ settings: WatermarkSettings, logo: CGImage?, to image: CGImage) -> CGImage {
        guard settings.hasContent else { return image }
        let w = image.width
        let h = image.height
        guard let ctx = makeContext(width: w, height: h) else { return image }

        // Base image first.
        ctx.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))

        let padding = CGFloat(settings.padding)

        // --- Logo watermark ---
        if settings.imageEnabled, let logo = logo {
            let targetW = CGFloat(w) * CGFloat(settings.sizePercent) / 100.0
            let aspect = CGFloat(logo.height) / CGFloat(max(1, logo.width))
            let targetH = targetW * aspect
            let rect = placement(itemSize: CGSize(width: targetW, height: targetH),
                                 in: CGSize(width: w, height: h),
                                 settings: settings, padding: padding)
            ctx.saveGState()
            ctx.setAlpha(CGFloat(settings.opacity))
            ctx.interpolationQuality = .high
            ctx.draw(logo, in: rect)
            ctx.restoreGState()
        }

        // --- Text watermark ---
        if settings.text.enabled, !settings.text.text.isEmpty {
            drawText(settings: settings, in: ctx, imageWidth: w, imageHeight: h, padding: padding)
        }

        return ctx.makeImage() ?? image
    }

    // MARK: - Helpers

    private static func makeContext(width: Int, height: Int) -> CGContext? {
        CGContext(
            data: nil, width: width, height: height,
            bitsPerComponent: 8, bytesPerRow: 0,
            space: sRGB,
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        )
    }

    /// Computes the destination rect (in CG bottom-left coordinates) for an item of `itemSize`.
    private static func placement(itemSize: CGSize, in canvas: CGSize,
                                  settings: WatermarkSettings, padding: CGFloat) -> CGRect {
        let iw = itemSize.width, ih = itemSize.height
        let cw = canvas.width, ch = canvas.height
        var x: CGFloat = padding
        var y: CGFloat = padding

        switch settings.position {
        case .topLeft:     x = padding;            y = ch - ih - padding
        case .topRight:    x = cw - iw - padding;  y = ch - ih - padding
        case .bottomLeft:  x = padding;            y = padding
        case .bottomRight: x = cw - iw - padding;  y = padding
        case .center:      x = (cw - iw) / 2;      y = (ch - ih) / 2
        case .custom:
            // Custom offsets are measured from the TOP-left corner.
            x = CGFloat(settings.customX)
            y = ch - ih - CGFloat(settings.customY)
        }
        return CGRect(x: x, y: y, width: iw, height: ih)
    }

    private static func drawText(settings: WatermarkSettings, in ctx: CGContext,
                                 imageWidth w: Int, imageHeight h: Int, padding: CGFloat) {
        let t = settings.text
        let font = NSFont.systemFont(ofSize: t.fontSize, weight: t.isBold ? .bold : .regular)
        let color = NSColor(srgbRed: t.red, green: t.green, blue: t.blue,
                            alpha: CGFloat(settings.opacity))
        // A subtle shadow keeps text legible over busy product photos.
        let shadow = NSShadow()
        shadow.shadowColor = NSColor.black.withAlphaComponent(0.5 * CGFloat(settings.opacity))
        shadow.shadowBlurRadius = max(2, t.fontSize * 0.06)
        shadow.shadowOffset = NSSize(width: 0, height: -max(1, t.fontSize * 0.03))

        let attrs: [NSAttributedString.Key: Any] = [
            .font: font, .foregroundColor: color, .shadow: shadow
        ]
        let string = NSAttributedString(string: t.text, attributes: attrs)
        let textSize = string.size()

        let rect = placement(itemSize: textSize, in: CGSize(width: w, height: h),
                             settings: settings, padding: padding)

        let nsContext = NSGraphicsContext(cgContext: ctx, flipped: false)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = nsContext
        string.draw(at: CGPoint(x: rect.minX, y: rect.minY))
        NSGraphicsContext.restoreGraphicsState()
    }
}
