import SwiftUI

struct WatermarkSettingsView: View {
    @EnvironmentObject var model: AppModel

    private var w: Binding<WatermarkSettings> { $model.watermark }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            logoSection
            Divider()
            placementSection
            Divider()
            appearanceSection
            Divider()
            textSection
        }
    }

    // MARK: Logo

    private var logoSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Toggle("Logo watermark", isOn: w.imageEnabled).font(.headline)

            HStack {
                if let url = model.watermark.logoURL {
                    Text(url.lastPathComponent).lineLimit(1).truncationMode(.middle)
                } else {
                    Text("No logo selected").foregroundStyle(.secondary)
                }
                Spacer()
                Button("Choose…") { model.chooseLogo() }
                if model.watermark.logoURL != nil {
                    Button { model.watermark.logoURL = nil } label: { Image(systemName: "xmark.circle") }
                        .buttonStyle(.borderless)
                }
            }
            .disabled(!model.watermark.imageEnabled)
        }
    }

    // MARK: Placement

    private var placementSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Position").font(.headline)
            Picker("Position", selection: w.position) {
                ForEach(WatermarkPosition.allCases) { pos in
                    Label(pos.label, systemImage: pos.symbol).tag(pos)
                }
            }
            .labelsHidden()

            if model.watermark.position == .custom {
                HStack {
                    LabeledStepper(label: "X", value: w.customX, range: 0...20000, step: 10)
                    LabeledStepper(label: "Y", value: w.customY, range: 0...20000, step: 10)
                }
                Text("Offset from the top-left corner, in pixels.")
                    .font(.caption).foregroundStyle(.secondary)
            }

            HStack {
                Text("Padding")
                Slider(value: w.padding, in: 0...400)
                Text("\(Int(model.watermark.padding)) px").monospacedDigit().frame(width: 56, alignment: .trailing)
            }
            .help("Margin from the image edges")
        }
    }

    // MARK: Appearance

    private var appearanceSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Appearance").font(.headline)
            HStack {
                Text("Size")
                Slider(value: w.sizePercent, in: 1...100)
                Text("\(Int(model.watermark.sizePercent))%").monospacedDigit().frame(width: 56, alignment: .trailing)
            }
            .help("Watermark width as a percentage of the image width")

            HStack {
                Text("Opacity")
                Slider(value: w.opacity, in: 0...1)
                Text("\(Int(model.watermark.opacity * 100))%").monospacedDigit().frame(width: 56, alignment: .trailing)
            }
        }
    }

    // MARK: Text

    private var textSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Toggle("Text watermark", isOn: w.text.enabled).font(.headline)
            Group {
                TextField("Watermark text", text: w.text.text)
                    .textFieldStyle(.roundedBorder)
                HStack {
                    Text("Font size")
                    Slider(value: w.text.fontSize, in: 8...300)
                    Text("\(Int(model.watermark.text.fontSize))").monospacedDigit().frame(width: 44, alignment: .trailing)
                }
                Toggle("Bold", isOn: w.text.isBold)
                ColorPicker("Text color", selection: textColorBinding, supportsOpacity: false)
            }
            .disabled(!model.watermark.text.enabled)
        }
    }

    private var textColorBinding: Binding<Color> {
        Binding(
            get: {
                Color(.sRGB, red: model.watermark.text.red,
                      green: model.watermark.text.green,
                      blue: model.watermark.text.blue)
            },
            set: { newValue in
                let ns = NSColor(newValue).usingColorSpace(.sRGB) ?? .white
                model.watermark.text.red = Double(ns.redComponent)
                model.watermark.text.green = Double(ns.greenComponent)
                model.watermark.text.blue = Double(ns.blueComponent)
            }
        )
    }
}

/// A compact label + numeric stepper used for custom X/Y offsets.
struct LabeledStepper: View {
    let label: String
    @Binding var value: Double
    let range: ClosedRange<Double>
    let step: Double

    var body: some View {
        HStack(spacing: 4) {
            Text(label)
            TextField("", value: $value, format: .number)
                .frame(width: 60)
                .textFieldStyle(.roundedBorder)
                .multilineTextAlignment(.trailing)
            Stepper("", value: $value, in: range, step: step).labelsHidden()
        }
    }
}
