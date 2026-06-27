import Foundation
import CoreGraphics
import CWebP

enum WebPEncodeError: LocalizedError {
    case rgbaExtractionFailed
    case configInvalid
    case pictureInitFailed
    case encodeFailed(Int)
    case muxFailed

    var errorDescription: String? {
        switch self {
        case .rgbaExtractionFailed: return "Could not read image pixels."
        case .configInvalid: return "Invalid WebP configuration."
        case .pictureInitFailed: return "Could not initialize WebP encoder."
        case .encodeFailed(let code): return "WebP encoding failed (error \(code))."
        case .muxFailed: return "Could not attach metadata to the WebP file."
        }
    }
}

/// Encodes a CGImage to WebP using libwebp, with optional ICC + XMP metadata via libwebpmux.
enum WebPEncoder {

    struct Options {
        var quality: Double      // 0...100
        var lossless: Bool
        var preserveMetadata: Bool
        /// Effort/speed tradeoff 0 (fast) ... 6 (best). Higher = smaller, slower.
        var method: Int32 = 4
    }

    /// Returns encoded WebP bytes.
    static func encode(_ image: CGImage, options: Options, xmp: Data?) throws -> Data {
        guard let rgba = extractRGBA(image) else { throw WebPEncodeError.rgbaExtractionFailed }

        var bitstream = try encodeBitstream(
            rgba: rgba.bytes, width: Int32(image.width), height: Int32(image.height),
            options: options
        )

        guard options.preserveMetadata else { return bitstream }

        // Re-attach color profile + XMP for color-managed, web-correct output.
        let icc = image.colorSpace?.copyICCData() as Data?
        if icc != nil || xmp != nil {
            bitstream = (try? mux(bitstream: bitstream, icc: icc, xmp: xmp)) ?? bitstream
        }
        return bitstream
    }

    // MARK: - Pixel extraction

    private static func extractRGBA(_ image: CGImage) -> (bytes: [UInt8], stride: Int)? {
        let w = image.width, h = image.height
        let stride = w * 4
        var bytes = [UInt8](repeating: 0, count: stride * h)
        let cs = CGColorSpace(name: CGColorSpace.sRGB)!
        let success: Bool = bytes.withUnsafeMutableBytes { ptr in
            guard let ctx = CGContext(
                data: ptr.baseAddress, width: w, height: h,
                bitsPerComponent: 8, bytesPerRow: stride, space: cs,
                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
            ) else { return false }
            ctx.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))
            return true
        }
        guard success else { return nil }

        // CGContext gives premultiplied alpha; libwebp expects straight alpha.
        unpremultiply(&bytes)
        return (bytes, stride)
    }

    private static func unpremultiply(_ bytes: inout [UInt8]) {
        var i = 0
        let n = bytes.count
        while i < n {
            let a = bytes[i + 3]
            if a != 0 && a != 255 {
                let af = Double(a)
                bytes[i]     = UInt8(min(255.0, Double(bytes[i])     * 255.0 / af))
                bytes[i + 1] = UInt8(min(255.0, Double(bytes[i + 1]) * 255.0 / af))
                bytes[i + 2] = UInt8(min(255.0, Double(bytes[i + 2]) * 255.0 / af))
            }
            i += 4
        }
    }

    // MARK: - libwebp encode

    private static func encodeBitstream(rgba: [UInt8], width: Int32, height: Int32,
                                        options: Options) throws -> Data {
        var config = WebPConfig()
        guard WebPConfigInit(&config) != 0 else { throw WebPEncodeError.configInvalid }
        config.quality = Float(max(0, min(100, options.quality)))
        config.method = max(0, min(6, options.method))
        if options.lossless {
            config.lossless = 1
            config.exact = 1   // keep RGB values under transparent pixels
        }
        guard WebPValidateConfig(&config) != 0 else { throw WebPEncodeError.configInvalid }

        var pic = WebPPicture()
        guard WebPPictureInit(&pic) != 0 else { throw WebPEncodeError.pictureInitFailed }
        pic.use_argb = 1
        pic.width = width
        pic.height = height
        defer { WebPPictureFree(&pic) }

        let imported = rgba.withUnsafeBufferPointer { buf in
            WebPPictureImportRGBA(&pic, buf.baseAddress, width * 4)
        }
        guard imported != 0 else { throw WebPEncodeError.encodeFailed(Int(pic.error_code.rawValue)) }

        var writer = WebPMemoryWriter()
        WebPMemoryWriterInit(&writer)

        let result: Data = try withUnsafeMutablePointer(to: &writer) { wptr -> Data in
            pic.writer = WebPMemoryWrite
            pic.custom_ptr = UnsafeMutableRawPointer(wptr)
            let ok = WebPEncode(&config, &pic)
            if ok == 0 {
                WebPMemoryWriterClear(wptr)
                throw WebPEncodeError.encodeFailed(Int(pic.error_code.rawValue))
            }
            let data = Data(bytes: wptr.pointee.mem, count: wptr.pointee.size)
            WebPMemoryWriterClear(wptr)
            return data
        }
        return result
    }

    // MARK: - libwebpmux (metadata)

    private static func mux(bitstream: Data, icc: Data?, xmp: Data?) throws -> Data {
        guard let mux = WebPMuxNew() else { throw WebPEncodeError.muxFailed }
        defer { WebPMuxDelete(mux) }

        func setImage(_ data: Data) throws {
            try data.withUnsafeBytes { raw in
                var wd = WebPData(bytes: raw.bindMemory(to: UInt8.self).baseAddress, size: data.count)
                guard WebPMuxSetImage(mux, &wd, 1) == WEBP_MUX_OK else { throw WebPEncodeError.muxFailed }
            }
        }
        func setChunk(_ fourCC: String, _ data: Data) throws {
            try data.withUnsafeBytes { raw in
                var wd = WebPData(bytes: raw.bindMemory(to: UInt8.self).baseAddress, size: data.count)
                guard WebPMuxSetChunk(mux, fourCC, &wd, 1) == WEBP_MUX_OK else { throw WebPEncodeError.muxFailed }
            }
        }

        try setImage(bitstream)
        if let icc = icc, !icc.isEmpty { try setChunk("ICCP", icc) }
        if let xmp = xmp, !xmp.isEmpty { try setChunk("XMP ", xmp) }

        var assembled = WebPData()
        guard WebPMuxAssemble(mux, &assembled) == WEBP_MUX_OK, let bytes = assembled.bytes else {
            throw WebPEncodeError.muxFailed
        }
        let out = Data(bytes: bytes, count: assembled.size)
        WebPDataClear(&assembled)
        return out
    }
}
