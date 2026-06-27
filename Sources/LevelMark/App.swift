import SwiftUI

@main
struct LevelMarkApp: App {
    @StateObject private var model = AppModel()

    var body: some Scene {
        WindowGroup("LevelMark") {
            ContentView()
                .environmentObject(model)
                .windowMinSize(width: 1100, height: 720,
                               defaultWidth: 1280, defaultHeight: 800)
        }
        .windowToolbarStyle(.unified)
        .commands {
            CommandGroup(after: .newItem) {
                Button("Import Images…") { model.importImages() }
                    .keyboardShortcut("o", modifiers: .command)
            }
        }
    }
}
