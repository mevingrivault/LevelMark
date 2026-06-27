import SwiftUI

struct ExportSettingsView: View {
    @EnvironmentObject var model: AppModel
    private var e: Binding<ExportSettings> { $model.export }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            destinationSection
            Divider()
            webpSection
            Divider()
            resizeSection
        }
    }

    // MARK: Destination

    private var destinationSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Destination").font(.headline)
            HStack {
                if let folder = model.export.outputFolderURL {
                    Text(folder.path).lineLimit(1).truncationMode(.head).foregroundStyle(.secondary)
                } else {
                    Text("No output folder").foregroundStyle(.secondary)
                }
                Spacer()
                Button("Choose…") { model.chooseOutputFolder() }
            }

            Toggle("Keep original folder structure", isOn: e.keepFolderStructure)
            Toggle("Overwrite existing files", isOn: e.overwriteExisting)
                .toggleStyle(.switch)
            if model.export.overwriteExisting {
                Label("Existing files in the output folder may be replaced. Originals are still never modified.",
                      systemImage: "exclamationmark.triangle.fill")
                    .font(.caption).foregroundStyle(.orange)
            }
        }
    }

    // MARK: WebP

    private var webpSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("WebP").font(.headline)
            Picker("Compression", selection: e.lossless) {
                Text("Lossy").tag(false)
                Text("Lossless").tag(true)
            }
            .pickerStyle(.segmented)

            HStack {
                Text(model.export.lossless ? "Effort" : "Quality")
                Slider(value: e.quality, in: 0...100)
                Text("\(Int(model.export.quality))").monospacedDigit().frame(width: 40, alignment: .trailing)
            }
            .help(model.export.lossless
                  ? "Higher = smaller file, slower encode"
                  : "Higher = better visual quality, larger file")

            Toggle("Preserve metadata (ICC profile + XMP)", isOn: e.preserveMetadata)
            Text(model.export.preserveMetadata
                 ? "Color profile and XMP are embedded in the WebP."
                 : "Metadata is stripped for the smallest possible files.")
                .font(.caption).foregroundStyle(.secondary)
        }
    }

    // MARK: Resize

    private var resizeSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Toggle("Resize before export", isOn: e.resizeEnabled).font(.headline)
            Group {
                Picker("Mode", selection: e.resizeMode) {
                    ForEach(ResizeMode.allCases) { Text($0.label).tag($0) }
                }
                .pickerStyle(.segmented)

                if model.export.resizeMode == .longestEdge {
                    HStack {
                        Text("Longest edge")
                        TextField("", value: e.maxLongestEdge, format: .number)
                            .frame(width: 80).textFieldStyle(.roundedBorder)
                        Text("px")
                    }
                } else {
                    HStack {
                        Text("Max W")
                        TextField("", value: e.maxWidth, format: .number)
                            .frame(width: 70).textFieldStyle(.roundedBorder)
                        Text("Max H")
                        TextField("", value: e.maxHeight, format: .number)
                            .frame(width: 70).textFieldStyle(.roundedBorder)
                        Text("px")
                    }
                }
                Toggle("Allow upscaling", isOn: e.allowUpscale)
            }
            .disabled(!model.export.resizeEnabled)
        }
    }
}
