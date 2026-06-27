// swift-tools-version:5.9
import PackageDescription

// Homebrew prefix differs between Apple Silicon (/opt/homebrew) and Intel (/usr/local).
// We pass both include/lib paths; the unused one is harmlessly ignored by the toolchain.
let brewIncludes = ["-I/opt/homebrew/include", "-I/usr/local/include"]
let brewLibs = ["-L/opt/homebrew/lib", "-L/usr/local/lib"]

let package = Package(
    name: "LevelMark",
    platforms: [.macOS(.v14)],
    targets: [
        // Header-only system module that bridges libwebp + libwebpmux into Swift.
        .systemLibrary(name: "CWebP", path: "Sources/CWebP"),
        .executableTarget(
            name: "LevelMark",
            dependencies: ["CWebP"],
            path: "Sources/LevelMark",
            swiftSettings: [
                .unsafeFlags(brewIncludes.flatMap { ["-Xcc", $0] })
            ],
            linkerSettings: [
                .unsafeFlags(brewLibs)
            ]
        )
    ]
)
