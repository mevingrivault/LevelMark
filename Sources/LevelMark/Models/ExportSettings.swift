import Foundation

/// How to resize before export.
enum ResizeMode: String, Codable, CaseIterable, Identifiable {
    case longestEdge   // bound the longer side
    case fitWithin     // fit inside maxWidth x maxHeight, keeping aspect ratio

    var id: String { rawValue }
    var label: String {
        switch self {
        case .longestEdge: return "Longest Edge"
        case .fitWithin: return "Fit Within W×H"
        }
    }
}

/// WebP + output options. Doubles as a saveable export preset.
struct ExportSettings: Codable, Equatable {
    // Output destination
    var outputFolderPath: String? = nil
    var keepFolderStructure: Bool = false
    /// Originals are NEVER overwritten unless this is explicitly enabled.
    var overwriteExisting: Bool = false

    // WebP encoding
    var lossless: Bool = false
    /// 0...100. For lossy this is visual quality; for lossless it controls
    /// the compression effort/quality tradeoff.
    var quality: Double = 80
    var preserveMetadata: Bool = false

    // Resize
    var resizeEnabled: Bool = false
    var resizeMode: ResizeMode = .longestEdge
    var maxLongestEdge: Int = 2000
    var maxWidth: Int = 2000
    var maxHeight: Int = 2000
    var allowUpscale: Bool = false

    var outputFolderURL: URL? {
        get { outputFolderPath.map { URL(fileURLWithPath: $0) } }
        set { outputFolderPath = newValue?.path }
    }
}
