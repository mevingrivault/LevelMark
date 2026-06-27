import SwiftUI

/// Right pane: tabbed configuration for the batch workflow.
struct InspectorView: View {
    enum Tab: String, CaseIterable, Identifiable {
        case watermark = "Watermark"
        case rename = "Rename"
        case export = "Export"
        case presets = "Presets"
        var id: String { rawValue }
        var icon: String {
            switch self {
            case .watermark: return "drop.halffull"
            case .rename: return "textformat.abc"
            case .export: return "square.and.arrow.up"
            case .presets: return "bookmark"
            }
        }
    }

    @EnvironmentObject var model: AppModel
    @State private var tab: Tab = .watermark

    var body: some View {
        VStack(spacing: 0) {
            Picker("", selection: $tab) {
                ForEach(Tab.allCases) { t in
                    Label(t.rawValue, systemImage: t.icon).tag(t)
                }
            }
            .pickerStyle(.segmented)
            .labelStyle(.iconOnly)
            .padding(10)

            Divider()

            ScrollView {
                Group {
                    switch tab {
                    case .watermark: WatermarkSettingsView()
                    case .rename: RenameSettingsView()
                    case .export: ExportSettingsView()
                    case .presets: PresetsView(store: model.presets)
                    }
                }
                .padding(14)
            }
        }
        .background(Color(nsColor: .windowBackgroundColor))
    }
}
