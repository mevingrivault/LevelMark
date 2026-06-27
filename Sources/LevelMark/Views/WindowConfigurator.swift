import SwiftUI
import AppKit

/// Forces the hosting NSWindow to respect a minimum size and open at a sensible
/// default size on first launch. SwiftUI's .frame(minWidth:minHeight:) only
/// constrains the view — the window itself can still be made smaller. This
/// bridge accesses NSWindow directly after the view hierarchy is attached.
struct WindowConfigurator: NSViewRepresentable {
    var minSize: NSSize
    var defaultSize: NSSize

    func makeNSView(context: Context) -> NSView {
        let view = NSView()
        // Defer until the view is actually in the window hierarchy.
        DispatchQueue.main.async {
            guard let window = view.window else { return }
            window.minSize = minSize
            // Only resize if the current frame is smaller than our target.
            let current = window.frame
            let targetW = max(current.width, defaultSize.width)
            let targetH = max(current.height, defaultSize.height)
            if targetW > current.width || targetH > current.height {
                var newFrame = current
                newFrame.size = NSSize(width: targetW, height: targetH)
                // Keep the window's top-left corner fixed when expanding.
                newFrame.origin.y = current.maxY - targetH
                window.setFrame(newFrame, display: true, animate: false)
            }
        }
        return view
    }

    func updateNSView(_ nsView: NSView, context: Context) {}
}

extension View {
    /// Sets the true NSWindow minimum size and ensures the window opens at
    /// least at `defaultSize` on launch.
    func windowMinSize(width: CGFloat, height: CGFloat,
                       defaultWidth: CGFloat? = nil, defaultHeight: CGFloat? = nil) -> some View {
        let min = NSSize(width: width, height: height)
        let def = NSSize(width: defaultWidth ?? width, height: defaultHeight ?? height)
        return self.background(WindowConfigurator(minSize: min, defaultSize: def))
    }
}
