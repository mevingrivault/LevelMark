import SwiftUI

/// Bottom strip showing batch progress while processing.
struct ProgressBar: View {
    @EnvironmentObject var model: AppModel

    var body: some View {
        if model.isProcessing {
            VStack(spacing: 4) {
                Divider()
                HStack(spacing: 12) {
                    ProgressView(value: model.progress)
                        .progressViewStyle(.linear)
                    Text("\(model.processedCount) / \(model.items.count)")
                        .monospacedDigit()
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Button("Cancel") { model.cancel() }
                        .controlSize(.small)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
            }
            .background(.bar)
            .transition(.move(edge: .bottom))
        }
    }
}
