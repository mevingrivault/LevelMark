import SwiftUI
import CoreGraphics

/// Center pane: a live preview of the watermark on the selected image.
/// Rendering is debounced via `.task(id:)` and runs off the main thread.
struct PreviewView: View {
    @EnvironmentObject var model: AppModel
    @State private var rendered: NSImage?
    @State private var isRendering = false
    @State private var errorText: String?

    var body: some View {
        VStack(spacing: 0) {
            header
            Divider()
            content
        }
        .background(checkerboard)
        .task(id: previewKey) { await renderPreview() }
    }

    private var header: some View {
        HStack {
            Label("Preview", systemImage: "eye")
                .font(.headline)
            if let item = model.selectedItem {
                Text(item.fileName)
                    .foregroundStyle(.secondary)
                    .lineLimit(1).truncationMode(.middle)
            }
            Spacer()
            if isRendering { ProgressView().controlSize(.small) }
        }
        .padding(10)
        .background(.bar)
    }

    @ViewBuilder
    private var content: some View {
        if model.selectedItem == nil {
            placeholder("Import and select an image to preview", icon: "photo")
        } else if let errorText {
            placeholder(errorText, icon: "exclamationmark.triangle")
        } else if let rendered {
            Image(nsImage: rendered)
                .resizable()
                .interpolation(.high)
                .aspectRatio(contentMode: .fit)
                .padding(16)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            placeholder("Rendering…", icon: "hourglass")
        }
    }

    private func placeholder(_ text: String, icon: String) -> some View {
        VStack(spacing: 10) {
            Image(systemName: icon).font(.system(size: 40)).foregroundStyle(.tertiary)
            Text(text).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var checkerboard: some View {
        Color(nsColor: .underPageBackgroundColor)
    }

    /// Recompute the preview whenever the image or any visual setting changes.
    private var previewKey: String {
        let w = model.watermark
        let e = model.export
        return [
            model.selectedItem?.id.uuidString ?? "none",
            w.imageEnabled.description, w.logoPath ?? "",
            w.position.rawValue, "\(w.sizePercent)", "\(w.opacity)", "\(w.padding)",
            "\(w.customX)", "\(w.customY)",
            w.text.enabled.description, w.text.text, "\(w.text.fontSize)",
            w.text.isBold.description, "\(w.text.red)-\(w.text.green)-\(w.text.blue)",
            e.resizeEnabled.description, e.resizeMode.rawValue,
            "\(e.maxLongestEdge)", "\(e.maxWidth)", "\(e.maxHeight)", e.allowUpscale.description
        ].joined(separator: "|")
    }

    private func renderPreview() async {
        guard let item = model.selectedItem else { rendered = nil; return }
        let watermark = model.watermark
        let export = model.export
        let url = item.url

        isRendering = true
        errorText = nil
        defer { isRendering = false }

        let result: Result<NSImage, Error> = await Task.detached(priority: .userInitiated) {
            do {
                let image = try PreviewRenderer.render(url: url, watermark: watermark, export: export)
                return .success(image)
            } catch {
                return .failure(error)
            }
        }.value

        // Ignore stale results if the user moved on.
        guard model.selectedItem?.id == item.id else { return }
        switch result {
        case .success(let img): rendered = img
        case .failure(let err): errorText = err.localizedDescription; rendered = nil
        }
    }
}

/// Produces a display-resolution preview that faithfully mirrors the export pipeline.
enum PreviewRenderer {
    static let maxDimension: CGFloat = 1400

    static func render(url: URL, watermark: WatermarkSettings, export: ExportSettings) throws -> NSImage {
        let loaded = try ImageLoader.load(url: url)
        let resized = WatermarkRenderer.resize(loaded.image, settings: export)

        // Downscale for display, scaling absolute pixel params (padding, font, custom offset)
        // by the same factor so proportions match the full-resolution output.
        let w = CGFloat(resized.width), h = CGFloat(resized.height)
        let scale = min(1, maxDimension / max(w, h))

        let base: CGImage
        var scaled = watermark
        if scale < 1 {
            let s = ExportSettings(resizeEnabled: true, resizeMode: .longestEdge,
                                   maxLongestEdge: Int((max(w, h) * scale).rounded()))
            base = WatermarkRenderer.resize(resized, settings: s)
            scaled.padding *= scale
            scaled.customX *= scale
            scaled.customY *= scale
            scaled.text.fontSize *= scale
        } else {
            base = resized
        }

        let logo = (watermark.imageEnabled ? watermark.logoURL : nil)
            .flatMap { WatermarkRenderer.loadLogo($0) }
        let composited = WatermarkRenderer.apply(scaled, logo: logo, to: base)
        return NSImage(cgImage: composited, size: NSSize(width: composited.width, height: composited.height))
    }
}
