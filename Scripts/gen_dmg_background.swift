// Génère le fond 580×320 du DMG : dégradé bleu nuit + flèche + texte.
// Usage: swift Scripts/gen_dmg_background.swift <output.png>
import CoreGraphics
import AppKit

let path = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "/tmp/dmg_bg.png"
let W: CGFloat = 580, H: CGFloat = 320
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
let ctx = CGContext(data: nil, width: Int(W), height: Int(H),
                    bitsPerComponent: 8, bytesPerRow: 0, space: cs,
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!

// Dégradé bleu nuit — reprend la palette de l'icône LevelMark
let colors = [CGColor(red: 0.10, green: 0.14, blue: 0.25, alpha: 1),
              CGColor(red: 0.07, green: 0.10, blue: 0.20, alpha: 1)]
let locs: [CGFloat] = [0, 1]
let grad = CGGradient(colorsSpace: cs, colors: colors as CFArray, locations: locs)!
ctx.drawLinearGradient(grad,
    start: CGPoint(x: 0, y: H), end: CGPoint(x: W, y: 0), options: [])

// Flèche centrale semi-transparente
let ax: CGFloat = W / 2, ay: CGFloat = H / 2
let aw: CGFloat = 60, ah: CGFloat = 20, tip: CGFloat = 14
ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.18))
let arrow = CGMutablePath()
arrow.move    (to: CGPoint(x: ax - aw/2,       y: ay - ah/3))
arrow.addLine (to: CGPoint(x: ax + aw/2 - tip, y: ay - ah/3))
arrow.addLine (to: CGPoint(x: ax + aw/2 - tip, y: ay - ah/2))
arrow.addLine (to: CGPoint(x: ax + aw/2,       y: ay))
arrow.addLine (to: CGPoint(x: ax + aw/2 - tip, y: ay + ah/2))
arrow.addLine (to: CGPoint(x: ax + aw/2 - tip, y: ay + ah/3))
arrow.addLine (to: CGPoint(x: ax - aw/2,       y: ay + ah/3))
arrow.closeSubpath()
ctx.addPath(arrow); ctx.fillPath()

// Texte d'aide en bas
let label = "Glissez LevelMark dans Applications" as NSString
let para  = NSMutableParagraphStyle(); para.alignment = .center
let attrs: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: 13, weight: .medium),
    .foregroundColor: NSColor.white.withAlphaComponent(0.50),
    .paragraphStyle: para
]
let nsCtx = NSGraphicsContext(cgContext: ctx, flipped: false)
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = nsCtx
label.draw(in: CGRect(x: 0, y: 22, width: W, height: 28), withAttributes: attrs)
NSGraphicsContext.restoreGraphicsState()

guard let img = ctx.makeImage() else { print("Erreur CGImage"); exit(1) }
let nsImg = NSImage(cgImage: img, size: NSSize(width: W, height: H))
let rep = NSBitmapImageRep(data: nsImg.tiffRepresentation!)!
let png = rep.representation(using: .png, properties: [:])!
try! png.write(to: URL(fileURLWithPath: path))
print("✓  Fond DMG : \(path)")
