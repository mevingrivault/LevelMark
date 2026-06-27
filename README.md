# LevelMark

A native macOS (SwiftUI) app for batch‑processing product photos for web publication:
**watermark → rename → convert to WebP → export**. Built for a tech‑media workflow where
many product shots need a consistent watermark, predictable file names, and optimized
WebP output.

![workflow](https://img.shields.io/badge/macOS-14%2B-blue) ![swift](https://img.shields.io/badge/Swift-5.9%2B-orange)

## Features

**Watermark**
- Logo/image watermark (choose any PNG/JPEG/TIFF file)
- Positions: top‑left, top‑right, bottom‑left, bottom‑right, center, or **custom X/Y offset**
- Adjustable **size** (% of image width), **opacity**, and **edge padding**
- Optional **text watermark** (font size, bold, color) — usable alone or with the logo
- **Live preview** on the selected image that updates as you tweak settings

**Rename**
- Custom naming pattern with tokens: `{original}`, `{number}`, `{date}`, `{prefix}`, `{suffix}`
- Starting number + zero‑padding (`001`, `002`, …)
- Custom date format, prefix, and suffix
- Live output‑name preview. Examples: `leveltech_{number}`, `review_{date}_{number}`, `{original}_watermarked`

**WebP conversion**
- Real WebP encoding via Google's **libwebp** (ImageIO on macOS is read‑only for WebP)
- **Lossy** (quality 0–100) or **lossless** (effort 0–100)
- **Preserve or strip metadata** — when preserved, the sRGB **ICC color profile** and **XMP**
  are embedded via `libwebpmux`
- Inputs: **JPG, JPEG, PNG, TIFF, HEIC/HEIF**, plus GIF/BMP/WebP

**Export**
- Choose an output folder
- **Originals are never overwritten** unless you explicitly enable overwrite (and even then the
  source file being read is protected; name collisions auto‑dedupe with ` (1)`, ` (2)`…)
- Optional **resize** before export (longest edge, or fit within W×H; optional upscaling)
- Optional **keep original folder structure**
- Progress bar during processing + an end‑of‑run **summary** (processed / succeeded / errors /
  output folder, with “Reveal in Finder”)

**Workflow & UI**
- Native SwiftUI three‑pane layout: image pool · live preview · settings inspector
- **Drag & drop** images or whole folders (recursive import)
- **Watermark & export presets** (saved to Application Support)
- Dark mode support (native system appearance)

## Requirements

- macOS 14 (Sonoma) or later
- Swift toolchain (full Xcode **or** Command Line Tools — `xcode-select --install`)
- **libwebp** for the encoder:
  ```sh
  brew install webp
  ```

## Build & run

```sh
cd LevelMark
./build.sh                       # produces dist/LevelMark.app
open "dist/LevelMark.app"
```

`build.sh` compiles with SwiftPM, assembles the `.app` bundle, copies the libwebp dylibs into
`Contents/Frameworks` and rewrites their load paths so the app is self‑contained, then ad‑hoc
codesigns it.

For day‑to‑day development you can also just run:

```sh
swift build && swift run
```

## Architecture

```
Sources/
  CWebP/                         # system-library module bridging libwebp + libwebpmux
  LevelMark/
    App.swift                    # @main scene
    Models/                      # WatermarkSettings, RenameSettings, ExportSettings,
                                 #   ImageItem, Presets (Codable, value types)
    Processing/                  # pure, testable pipeline:
      ImageLoader                #   ImageIO load + EXIF-orientation baking + thumbnails
      WatermarkRenderer          #   CoreGraphics resize + logo/text compositing (sRGB)
      WebPEncoder                #   libwebp encode + libwebpmux ICC/XMP metadata
      ImageProcessor             #   one-image pipeline + output-path resolution
    ViewModels/
      AppModel                   #   @MainActor state + bounded-concurrency batch runner
    Views/                       # SwiftUI: pool, preview, inspector tabs, progress, summary
```

The processing layer is UI‑free and was verified end‑to‑end (load → resize → watermark →
lossy/lossless WebP → metadata mux) independently of the GUI. Batches run with bounded
concurrency (`min(8, CPU cores)`) so large pools stay memory‑safe, with per‑file status and
graceful per‑file error handling.

## Notes & limitations

- **Metadata preservation** embeds the ICC color profile and XMP packet. Raw EXIF is not
  re‑attached (it's commonly stripped for web anyway); image **orientation** is baked into the
  pixels so the exported image always displays upright.
- All compositing happens in **sRGB** for predictable, web‑ready color.
- The app runs unsandboxed (it reads arbitrary import folders and writes to your chosen output
  folder). To ship via the App Store you'd add the sandbox entitlement plus security‑scoped
  bookmarks for the selected folders.
```
