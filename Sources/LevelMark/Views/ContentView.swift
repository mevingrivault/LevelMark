import SwiftUI
import UniformTypeIdentifiers

/// Three-pane layout: image pool (left) · live preview (center) · settings inspector (right),
/// with a processing toolbar on top and a progress strip at the bottom.
struct ContentView: View {
    @EnvironmentObject var model: AppModel

    var body: some View {
        NavigationSplitView {
            ImagePoolView()
                .navigationSplitViewColumnWidth(min: 220, ideal: 260, max: 360)
        } detail: {
            HSplitView {
                PreviewView()
                    .frame(minWidth: 360)
                    .layoutPriority(1)
                InspectorView()
                    .frame(minWidth: 340, idealWidth: 380, maxWidth: 460)
            }
        }
        .toolbar { toolbarContent }
        .safeAreaInset(edge: .bottom) { ProgressBar() }
        .sheet(item: $model.summary) { SummaryView(summary: $0) }
        .dropDestination(for: URL.self) { urls, _ in
            model.add(urls: urls)
            return true
        }
    }

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItemGroup(placement: .navigation) {
            Button { model.importImages() } label: {
                Label("Import", systemImage: "photo.badge.plus")
            }
            .help("Import images or a folder")

            Button(role: .destructive) { model.clearAll() } label: {
                Label("Clear", systemImage: "trash")
            }
            .disabled(model.items.isEmpty || model.isProcessing)
            .help("Remove all images from the pool")
        }

        ToolbarItem(placement: .principal) {
            if !model.items.isEmpty {
                Text("\(model.items.count) image\(model.items.count == 1 ? "" : "s")")
                    .foregroundStyle(.secondary)
            }
        }

        ToolbarItemGroup(placement: .primaryAction) {
            if model.isProcessing {
                Button(role: .destructive) { model.cancel() } label: {
                    Label("Cancel", systemImage: "stop.fill")
                }
            } else {
                Button { model.start() } label: {
                    Label("Start Processing", systemImage: "play.fill")
                }
                .keyboardShortcut(.return, modifiers: .command)
                .disabled(!model.canStart)
                .help(model.startBlockedReason ?? "Process the whole batch")
            }
        }
    }
}
