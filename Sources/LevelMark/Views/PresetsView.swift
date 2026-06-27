import SwiftUI

struct PresetsView: View {
    @EnvironmentObject var model: AppModel
    @ObservedObject var store: PresetStore
    @State private var newWatermarkName = ""
    @State private var newExportName = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            watermarkPresets
            Divider()
            exportPresets
        }
    }

    private var watermarkPresets: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Watermark presets").font(.headline)
            HStack {
                TextField("Preset name", text: $newWatermarkName).textFieldStyle(.roundedBorder)
                Button("Save current") {
                    let name = newWatermarkName.isEmpty ? "Watermark \(store.watermarkPresets.count + 1)" : newWatermarkName
                    store.addWatermarkPreset(name: name, settings: model.watermark)
                    newWatermarkName = ""
                }
            }
            if store.watermarkPresets.isEmpty {
                Text("No saved presets").font(.caption).foregroundStyle(.secondary)
            }
            ForEach(store.watermarkPresets) { preset in
                presetRow(preset.name,
                          apply: { model.watermark = preset.settings },
                          delete: { store.deleteWatermarkPreset(preset) })
            }
        }
    }

    private var exportPresets: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Export presets").font(.headline)
            HStack {
                TextField("Preset name", text: $newExportName).textFieldStyle(.roundedBorder)
                Button("Save current") {
                    let name = newExportName.isEmpty ? "Export \(store.exportPresets.count + 1)" : newExportName
                    // Don't bake the output folder into a reusable preset.
                    var settings = model.export
                    settings.outputFolderPath = nil
                    store.addExportPreset(name: name, settings: settings)
                    newExportName = ""
                }
            }
            if store.exportPresets.isEmpty {
                Text("No saved presets").font(.caption).foregroundStyle(.secondary)
            }
            ForEach(store.exportPresets) { preset in
                presetRow(preset.name,
                          apply: {
                              let folder = model.export.outputFolderURL
                              model.export = preset.settings
                              model.export.outputFolderURL = folder   // keep current destination
                          },
                          delete: { store.deleteExportPreset(preset) })
            }
        }
    }

    private func presetRow(_ name: String, apply: @escaping () -> Void, delete: @escaping () -> Void) -> some View {
        HStack {
            Button(action: apply) {
                Label(name, systemImage: "arrow.down.circle")
            }
            .buttonStyle(.borderless)
            Spacer()
            Button(role: .destructive, action: delete) {
                Image(systemName: "trash")
            }
            .buttonStyle(.borderless)
        }
        .padding(.vertical, 2)
    }
}
