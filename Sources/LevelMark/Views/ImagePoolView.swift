import SwiftUI

/// Left sidebar: the pool of imported images with thumbnails and per-file status.
struct ImagePoolView: View {
    @EnvironmentObject var model: AppModel
    @State private var multiSelection = Set<ImageItem.ID>()

    var body: some View {
        Group {
            if model.items.isEmpty {
                emptyState
            } else {
                List(selection: $multiSelection) {
                    ForEach(model.items) { item in
                        ImageRow(item: item)
                            .tag(item.id)
                    }
                }
                .onChange(of: multiSelection) { _, new in
                    if let first = new.first { model.selection = first }
                }
                .onDeleteCommand { model.remove(multiSelection) }
                .contextMenu(forSelectionType: ImageItem.ID.self) { ids in
                    Button("Remove", role: .destructive) { model.remove(ids) }
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var emptyState: some View {
        VStack(spacing: 14) {
            Image(systemName: "photo.on.rectangle.angled")
                .font(.system(size: 44))
                .foregroundStyle(.tertiary)
            Text("Drop images or a folder here")
                .font(.headline)
            Text("JPG · PNG · TIFF · HEIC")
                .font(.caption)
                .foregroundStyle(.secondary)
            Button("Import…") { model.importImages() }
                .buttonStyle(.borderedProminent)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private struct ImageRow: View {
    @ObservedObject var item: ImageItem

    var body: some View {
        HStack(spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 6)
                    .fill(Color(nsColor: .quaternaryLabelColor))
                if let thumb = item.thumbnail {
                    Image(nsImage: thumb)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                } else {
                    ProgressView().controlSize(.small)
                }
            }
            .frame(width: 44, height: 44)
            .clipShape(RoundedRectangle(cornerRadius: 6))

            VStack(alignment: .leading, spacing: 2) {
                Text(item.fileName)
                    .lineLimit(1)
                    .truncationMode(.middle)
                statusLabel
            }
            Spacer()
        }
        .padding(.vertical, 2)
    }

    @ViewBuilder
    private var statusLabel: some View {
        switch item.status {
        case .pending:
            Text("Ready").font(.caption).foregroundStyle(.secondary)
        case .processing:
            Label("Processing", systemImage: "gearshape").font(.caption).foregroundStyle(.secondary)
        case .done:
            Label("Done", systemImage: "checkmark.circle.fill").font(.caption).foregroundStyle(.green)
        case .failed(let message):
            Label(message, systemImage: "exclamationmark.triangle.fill")
                .font(.caption).foregroundStyle(.red).lineLimit(1)
        case .skipped(let reason):
            Label(reason, systemImage: "minus.circle").font(.caption).foregroundStyle(.orange)
        }
    }
}
