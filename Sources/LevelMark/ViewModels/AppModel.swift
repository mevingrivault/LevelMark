import Foundation
import AppKit
import CoreGraphics
import UniformTypeIdentifiers
import Combine

/// End-of-run report shown to the user.
struct BatchSummary: Identifiable {
    let id = UUID()
    var total: Int
    var succeeded: Int
    var failed: Int
    var skipped: Int
    var outputFolder: URL?
    var errors: [(file: String, message: String)]
    var elapsed: TimeInterval
}

/// Central observable state: the image pool, all settings, presets, and batch control.
@MainActor
final class AppModel: ObservableObject {
    // Image pool
    @Published var items: [ImageItem] = []
    @Published var selection: ImageItem.ID?

    // Settings
    @Published var watermark = WatermarkSettings()
    @Published var rename = RenameSettings()
    @Published var export = ExportSettings()

    // Presets
    let presets = PresetStore()

    // Processing state
    @Published var isProcessing = false
    @Published var progress: Double = 0          // 0...1
    @Published var processedCount = 0
    @Published var summary: BatchSummary?

    private var batchTask: Task<Void, Never>?

    // MARK: - Import

    func add(urls: [URL]) {
        var collected: [(URL, String)] = []
        for url in urls {
            collectImages(at: url, root: url.deletingLastPathComponent(), into: &collected)
        }
        let existing = Set(items.map { $0.url.standardizedFileURL })
        for (url, rel) in collected where !existing.contains(url.standardizedFileURL) {
            let item = ImageItem(url: url, relativePath: rel)
            items.append(item)
            loadThumbnail(for: item)
        }
        if selection == nil { selection = items.first?.id }
    }

    /// Recursively gathers supported images from files and folders, tracking each
    /// file's path relative to `root` (for "keep folder structure").
    private func collectImages(at url: URL, root: URL, into out: inout [(URL, String)]) {
        let fm = FileManager.default
        var isDir: ObjCBool = false
        guard fm.fileExists(atPath: url.path, isDirectory: &isDir) else { return }

        if isDir.boolValue {
            let contents = (try? fm.contentsOfDirectory(
                at: url, includingPropertiesForKeys: nil,
                options: [.skipsHiddenFiles])) ?? []
            for child in contents { collectImages(at: child, root: root, into: &out) }
        } else if ImageItem.isSupported(url) {
            let rel = relativePath(of: url, from: root)
            out.append((url, rel))
        }
    }

    private func relativePath(of url: URL, from root: URL) -> String {
        let rootComponents = root.standardizedFileURL.pathComponents
        let urlComponents = url.standardizedFileURL.pathComponents
        if urlComponents.count > rootComponents.count,
           Array(urlComponents.prefix(rootComponents.count)) == rootComponents {
            return urlComponents.suffix(from: rootComponents.count).joined(separator: "/")
        }
        return url.lastPathComponent
    }

    private func loadThumbnail(for item: ImageItem) {
        let url = item.url
        Task.detached(priority: .utility) {
            let image = ImageLoader.thumbnail(url: url, maxPixel: 256)
            await MainActor.run { item.thumbnail = image }
        }
    }

    func remove(_ ids: Set<ImageItem.ID>) {
        items.removeAll { ids.contains($0.id) }
        if let sel = selection, ids.contains(sel) { selection = items.first?.id }
    }

    func clearAll() {
        items.removeAll()
        selection = nil
        summary = nil
    }

    var selectedItem: ImageItem? {
        guard let selection else { return items.first }
        return items.first { $0.id == selection }
    }

    // MARK: - Validation

    var canStart: Bool {
        !items.isEmpty && export.outputFolderURL != nil && !isProcessing
    }

    var startBlockedReason: String? {
        if items.isEmpty { return "Import at least one image." }
        if export.outputFolderURL == nil { return "Choose an output folder." }
        return nil
    }

    // MARK: - Batch processing

    func start() {
        guard canStart else { return }
        isProcessing = true
        progress = 0
        processedCount = 0
        summary = nil

        // Reset statuses.
        for item in items { item.status = .pending }

        let snapshotItems = items
        let processor = ImageProcessor(watermark: watermark, rename: rename, export: export)
        let logoURL = (watermark.imageEnabled ? watermark.logoURL : nil)
        let outputFolder = export.outputFolderURL
        let date = Date()
        let started = Date()

        batchTask = Task.detached(priority: .userInitiated) { [weak self] in
            // Load the logo once for the whole batch.
            let logo = logoURL.flatMap { WatermarkRenderer.loadLogo($0) }

            let total = snapshotItems.count
            var succeeded = 0, failed = 0, skipped = 0
            var errors: [(String, String)] = []

            // Bounded concurrency keeps large batches memory-safe.
            let maxConcurrent = max(2, min(8, ProcessInfo.processInfo.activeProcessorCount))
            var nextIndex = 0

            await withTaskGroup(of: (Int, Result<URL, Error>).self) { group in
                func submit(_ index: Int) {
                    let item = snapshotItems[index]
                    Task { @MainActor in item.status = .processing }
                    group.addTask {
                        do {
                            let url = try processor.process(
                                item: item, index: index, logo: logo, dateForNaming: date)
                            return (index, .success(url))
                        } catch {
                            return (index, .failure(error))
                        }
                    }
                }

                while nextIndex < min(maxConcurrent, total) {
                    submit(nextIndex); nextIndex += 1
                }

                for await (index, result) in group {
                    let item = snapshotItems[index]
                    switch result {
                    case .success(let url):
                        succeeded += 1
                        await MainActor.run { item.status = .done(outputURL: url) }
                    case .failure(let error):
                        failed += 1
                        let msg = error.localizedDescription
                        errors.append((item.fileName, msg))
                        await MainActor.run { item.status = .failed(message: msg) }
                    }

                    await self?.advanceProgress(total: total)

                    if Task.isCancelled { break }
                    if nextIndex < total { submit(nextIndex); nextIndex += 1 }
                }
            }

            let report = BatchSummary(
                total: total, succeeded: succeeded, failed: failed, skipped: skipped,
                outputFolder: outputFolder, errors: errors,
                elapsed: Date().timeIntervalSince(started))

            await self?.finish(with: report)
        }
    }

    func cancel() {
        batchTask?.cancel()
    }

    private func advanceProgress(total: Int) {
        processedCount += 1
        progress = total == 0 ? 1 : Double(processedCount) / Double(total)
    }

    private func finish(with report: BatchSummary) {
        isProcessing = false
        progress = 1
        summary = report
    }

    // MARK: - Folder pickers

    func chooseOutputFolder() {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.allowsMultipleSelection = false
        panel.prompt = "Choose"
        panel.message = "Select the output folder for exported WebP files"
        if panel.runModal() == .OK { export.outputFolderURL = panel.url }
    }

    func chooseLogo() {
        let panel = NSOpenPanel()
        panel.canChooseFiles = true
        panel.canChooseDirectories = false
        panel.allowsMultipleSelection = false
        panel.allowedContentTypes = [.png, .jpeg, .tiff, .image]
        panel.message = "Select a logo/image to use as the watermark"
        if panel.runModal() == .OK { watermark.logoURL = panel.url }
    }

    func importImages() {
        let panel = NSOpenPanel()
        panel.canChooseFiles = true
        panel.canChooseDirectories = true
        panel.allowsMultipleSelection = true
        panel.message = "Select images or folders to import"
        if panel.runModal() == .OK { add(urls: panel.urls) }
    }
}
