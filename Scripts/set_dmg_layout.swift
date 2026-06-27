// Écrit un .DS_Store minimal dans le DMG monté pour positionner les icônes
// et définir la fenêtre Finder — contourne la dépendance à Finder.app.
// Usage: swift set_dmg_layout.swift <mount_point>
//
// Le format DS_Store est un B-tree propriétaire d'Apple. Pour éviter de le
// ré-implémenter, on utilise le fait que Finder accepte des positionnements
// via des extended attributes (com.apple.FinderInfo) sur les items eux-mêmes.
// Le .DS_Store propre est généré par Finder lors de la première ouverture ;
// les positions sont cependant fixées par les attributs étendus ci-dessous.
import Foundation

let mount = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "/tmp/dmg_mnt"

// com.apple.FinderInfo layout : 32 bytes.
// Bytes 8-9 : icône X (big-endian Int16), 10-11 : icône Y  (Finder coordonnées)
// Finder origin = bas-gauche de l'écran ; la fenêtre fait 580×320.
// On cible : LevelMark.app → (145, 155 depuis le haut) = y_finder = 320-155 = 165
//            Applications  → (435, 155 depuis le haut) = y_finder = 165

func finderInfo(x: Int16, y: Int16) -> Data {
    var data = Data(repeating: 0, count: 32)
    data[8] = UInt8((x >> 8) & 0xFF)
    data[9] = UInt8(x & 0xFF)
    data[10] = UInt8((y >> 8) & 0xFF)
    data[11] = UInt8(y & 0xFF)
    return data
}

let items: [(String, Int16, Int16)] = [
    ("LevelMark.app", 145, 165),
    ("Applications",  435, 165),
]

for (name, x, y) in items {
    let path = (mount as NSString).appendingPathComponent(name)
    let info = finderInfo(x: x, y: y)
    info.withUnsafeBytes { ptr in
        setxattr(path, "com.apple.FinderInfo",
                 ptr.baseAddress!, info.count, 0, XATTR_NOFOLLOW)
    }
    print("  position \(name) → (\(x), \(y))")
}
print("✓  Attributs FinderInfo appliqués")
