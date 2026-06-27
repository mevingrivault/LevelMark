import Foundation
import CoreGraphics

/// Where a watermark is anchored on the image.
enum WatermarkPosition: String, Codable, CaseIterable, Identifiable {
    case topLeft, topRight, bottomLeft, bottomRight, center, custom

    var id: String { rawValue }

    var label: String {
        switch self {
        case .topLeft: return "Top Left"
        case .topRight: return "Top Right"
        case .bottomLeft: return "Bottom Left"
        case .bottomRight: return "Bottom Right"
        case .center: return "Center"
        case .custom: return "Custom"
        }
    }

    var symbol: String {
        switch self {
        case .topLeft: return "arrow.up.left"
        case .topRight: return "arrow.up.right"
        case .bottomLeft: return "arrow.down.left"
        case .bottomRight: return "arrow.down.right"
        case .center: return "circle"
        case .custom: return "scope"
        }
    }
}

/// Text-anchor / color settings for an optional text watermark drawn on top of (or instead of) the logo.
struct TextWatermark: Codable, Equatable {
    var enabled: Bool = false
    var text: String = "© LevelTech"
    var fontSize: Double = 48          // points, relative to the full-resolution image
    var isBold: Bool = true
    /// sRGB components 0...1
    var red: Double = 1
    var green: Double = 1
    var blue: Double = 1
}

/// Everything needed to render a watermark onto an image.
/// Stored as a value type so it doubles as a saveable preset.
struct WatermarkSettings: Codable, Equatable {
    var imageEnabled: Bool = true

    /// Path to the logo file. Stored as a path string so the whole struct stays Codable for presets.
    var logoPath: String? = nil

    var position: WatermarkPosition = .bottomRight

    /// Watermark width as a percentage of the image width (1...100).
    var sizePercent: Double = 20

    /// 0 (invisible) ... 1 (opaque).
    var opacity: Double = 0.85

    /// Margin from the image edges, in pixels at full resolution.
    var padding: Double = 40

    /// Used only when `position == .custom`. Offset of the watermark's top-left
    /// corner measured from the image's top-left corner, in full-resolution pixels.
    var customX: Double = 0
    var customY: Double = 0

    var text: TextWatermark = TextWatermark()

    var logoURL: URL? {
        get { logoPath.map { URL(fileURLWithPath: $0) } }
        set { logoPath = newValue?.path }
    }

    /// True if there is anything at all to draw.
    var hasContent: Bool {
        (imageEnabled && logoURL != nil) || text.enabled
    }
}
