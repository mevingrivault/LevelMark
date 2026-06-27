import SwiftUI

struct RenameSettingsView: View {
    @EnvironmentObject var model: AppModel
    private var r: Binding<RenameSettings> { $model.rename }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Toggle("Rename files", isOn: r.enabled).font(.headline)

            Group {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Naming pattern").font(.subheadline.weight(.medium))
                    TextField("{original}_watermarked", text: r.pattern)
                        .textFieldStyle(.roundedBorder)
                        .font(.system(.body, design: .monospaced))

                    // Token chips that append to the pattern on click.
                    FlowTokens(tokens: RenameSettings.availableTokens) { token in
                        model.rename.pattern += token
                    }

                    Text("Examples").font(.caption).foregroundStyle(.secondary).padding(.top, 4)
                    ForEach(RenameSettings.examplePatterns, id: \.self) { ex in
                        Button {
                            model.rename.pattern = ex
                        } label: {
                            Text(ex).font(.system(.caption, design: .monospaced))
                        }
                        .buttonStyle(.link)
                    }
                }

                Divider()

                HStack {
                    TextField("Prefix", text: r.prefix).textFieldStyle(.roundedBorder)
                    TextField("Suffix", text: r.suffix).textFieldStyle(.roundedBorder)
                }

                HStack {
                    Text("Start at")
                    TextField("", value: r.startNumber, format: .number)
                        .frame(width: 70).textFieldStyle(.roundedBorder)
                    Stepper("", value: r.startNumber, in: 0...1_000_000).labelsHidden()
                    Spacer()
                    Text("Padding")
                    Stepper(value: r.numberPadding, in: 0...8) {
                        Text("\(model.rename.numberPadding) digits")
                    }
                }

                HStack {
                    Text("Date format")
                    TextField("yyyy-MM-dd", text: r.dateFormat).textFieldStyle(.roundedBorder)
                }

                preview
            }
            .disabled(!model.rename.enabled)
        }
    }

    private var preview: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Output preview").font(.caption).foregroundStyle(.secondary)
            let builder = FilenameBuilder(settings: model.rename)
            let sample = model.items.first?.baseName ?? "IMG_1234"
            ForEach(0..<min(3, max(1, model.items.count)), id: \.self) { i in
                let original = i < model.items.count ? model.items[i].baseName : "\(sample)_\(i)"
                Text("\(builder.baseName(original: original, index: i)).webp")
                    .font(.system(.caption, design: .monospaced))
            }
        }
        .padding(8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 6).fill(Color(nsColor: .quaternaryLabelColor)))
    }
}

/// Simple wrapping row of tappable token chips.
struct FlowTokens: View {
    let tokens: [String]
    let action: (String) -> Void

    var body: some View {
        // A fixed-width grid wraps reasonably for the small set of tokens.
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 92), spacing: 6)], alignment: .leading, spacing: 6) {
            ForEach(tokens, id: \.self) { token in
                Button { action(token) } label: {
                    Text(token)
                        .font(.system(.caption, design: .monospaced))
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(Capsule().fill(Color.accentColor.opacity(0.15)))
                }
                .buttonStyle(.plain)
            }
        }
    }
}
