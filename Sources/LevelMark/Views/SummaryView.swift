import SwiftUI
import AppKit

/// End-of-run report sheet.
struct SummaryView: View {
    @EnvironmentObject var model: AppModel
    @Environment(\.dismiss) private var dismiss
    let summary: BatchSummary

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 10) {
                Image(systemName: summary.failed == 0 ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                    .font(.system(size: 28))
                    .foregroundStyle(summary.failed == 0 ? .green : .orange)
                VStack(alignment: .leading) {
                    Text("Batch complete").font(.title2.weight(.semibold))
                    Text(String(format: "Finished in %.1fs", summary.elapsed))
                        .foregroundStyle(.secondary)
                }
            }

            HStack(spacing: 12) {
                stat("Processed", summary.total, .primary)
                stat("Succeeded", summary.succeeded, .green)
                stat("Errors", summary.failed, summary.failed == 0 ? .secondary : .red)
                if summary.skipped > 0 { stat("Skipped", summary.skipped, .orange) }
            }

            if let folder = summary.outputFolder {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Output folder").font(.caption).foregroundStyle(.secondary)
                    HStack {
                        Text(folder.path).lineLimit(1).truncationMode(.middle)
                            .font(.system(.body, design: .monospaced))
                        Spacer()
                        Button("Reveal in Finder") {
                            NSWorkspace.shared.activateFileViewerSelecting([folder])
                        }
                    }
                }
                .padding(10)
                .background(RoundedRectangle(cornerRadius: 8).fill(Color(nsColor: .quaternaryLabelColor)))
            }

            if !summary.errors.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Errors").font(.headline)
                    ScrollView {
                        VStack(alignment: .leading, spacing: 4) {
                            ForEach(Array(summary.errors.enumerated()), id: \.offset) { _, err in
                                HStack(alignment: .top, spacing: 6) {
                                    Text(err.file).bold().lineLimit(1)
                                    Text(err.message).foregroundStyle(.secondary)
                                }
                                .font(.caption)
                            }
                        }
                    }
                    .frame(maxHeight: 140)
                }
            }

            HStack {
                Spacer()
                Button("Done") { model.summary = nil; dismiss() }
                    .keyboardShortcut(.defaultAction)
            }
        }
        .padding(20)
        .frame(width: 460)
    }

    private func stat(_ label: String, _ value: Int, _ color: Color) -> some View {
        VStack(spacing: 2) {
            Text("\(value)").font(.title.weight(.semibold).monospacedDigit()).foregroundStyle(color)
            Text(label).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(RoundedRectangle(cornerRadius: 8).fill(Color(nsColor: .quaternaryLabelColor)))
    }
}
