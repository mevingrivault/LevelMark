import Foundation

/// A named bundle of watermark settings.
struct WatermarkPreset: Codable, Identifiable, Equatable {
    var id = UUID()
    var name: String
    var settings: WatermarkSettings
}

/// A named bundle of export/WebP settings (output folder is intentionally not stored).
struct ExportPreset: Codable, Identifiable, Equatable {
    var id = UUID()
    var name: String
    var settings: ExportSettings
}

/// Persists presets to Application Support as JSON.
final class PresetStore: ObservableObject {
    @Published var watermarkPresets: [WatermarkPreset] = []
    @Published var exportPresets: [ExportPreset] = []

    private let fileURL: URL

    init() {
        let fm = FileManager.default
        let base = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
            .appendingPathComponent("LevelMark", isDirectory: true)
        try? fm.createDirectory(at: base, withIntermediateDirectories: true)
        fileURL = base.appendingPathComponent("presets.json")
        load()
    }

    private struct Payload: Codable {
        var watermark: [WatermarkPreset]
        var export: [ExportPreset]
    }

    func load() {
        guard let data = try? Data(contentsOf: fileURL),
              let payload = try? JSONDecoder().decode(Payload.self, from: data) else { return }
        watermarkPresets = payload.watermark
        exportPresets = payload.export
    }

    func save() {
        let payload = Payload(watermark: watermarkPresets, export: exportPresets)
        guard let data = try? JSONEncoder().encode(payload) else { return }
        try? data.write(to: fileURL, options: .atomic)
    }

    func addWatermarkPreset(name: String, settings: WatermarkSettings) {
        watermarkPresets.append(WatermarkPreset(name: name, settings: settings))
        save()
    }

    func addExportPreset(name: String, settings: ExportSettings) {
        exportPresets.append(ExportPreset(name: name, settings: settings))
        save()
    }

    func deleteWatermarkPreset(_ preset: WatermarkPreset) {
        watermarkPresets.removeAll { $0.id == preset.id }
        save()
    }

    func deleteExportPreset(_ preset: ExportPreset) {
        exportPresets.removeAll { $0.id == preset.id }
        save()
    }
}
