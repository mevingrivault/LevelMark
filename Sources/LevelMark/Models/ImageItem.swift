import Foundation
import AppKit
import UniformTypeIdentifiers

/// Processing outcome for a single image, shown in the UI.
enum ImageStatus: Equatable {
    case pending
    case processing
    case done(outputURL: URL)
    case failed(message: String)
    case skipped(reason: String)

    var isTerminal: Bool {
        switch self {
        case .done, .failed, .skipped: return true
        default: return false
        }
    }
}

/// One image in the pool. Reference type so SwiftUI rows can observe status updates.
final class ImageItem: Identifiable, ObservableObject, Hashable {
    let id = UUID()
    let url: URL
    /// Path relative to the import root, used when "keep folder structure" is on.
    let relativePath: String

    @Published var status: ImageStatus = .pending
    @Published var thumbnail: NSImage?

    var fileName: String { url.lastPathComponent }
    var baseName: String { url.deletingPathExtension().lastPathComponent }

    init(url: URL, relativePath: String? = nil) {
        self.url = url
        self.relativePath = relativePath ?? url.lastPathComponent
    }

    static func == (lhs: ImageItem, rhs: ImageItem) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }

    /// Input formats we accept.
    static let supportedExtensions: Set<String> = ["jpg", "jpeg", "png", "tiff", "tif", "heic", "heif", "webp", "gif", "bmp"]

    static func isSupported(_ url: URL) -> Bool {
        supportedExtensions.contains(url.pathExtension.lowercased())
    }
}
