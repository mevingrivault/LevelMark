# LevelMark

LevelMark is a cross-platform Electron desktop app for local batch image processing:
import images, add a watermark, rename files, convert to WebP, and export the results.

The app is local-first. Images are read and processed on the user's machine with Electron,
Node.js, and `sharp`; no image data is uploaded to an external service.

## Features

- Batch import with native file/folder selection and drag and drop
- Image list with filename, format, dimensions, size, and per-file status
- Logo/image watermark selection with live preview
- Watermark position, margin, opacity, scale, and repeated tile mode
- Rename patterns with `{original}`, `{counter}`, `{number}`, `{date}`, `{prefix}`, and `{suffix}`
- Conflict-safe WebP export with configurable quality
- Optional resize using max width and max height
- Native output folder selection
- Progress reporting and per-image success/error state

## Tech Stack

- Electron desktop shell
- React + TypeScript renderer
- Secure preload bridge with `contextIsolation` enabled
- IPC between renderer and main process
- Node.js file access in the main process only
- `sharp` for resizing, watermark compositing, and WebP export
- Electron Builder packaging for macOS and Windows

## Architecture

```text
electron/
  main.ts                 Electron window and app lifecycle
  preload.ts              Narrow, secure renderer bridge
  ipc/                    Dialog, import, preview, and processing handlers
src/
  app/                    App composition, defaults, styles
  components/             Reusable React UI
  core/
    image-processing/     sharp-based processing pipeline
    watermark/            watermark placement logic
    renaming/             filename pattern logic
    export/               output conflict handling
  platform/
    desktop/              Electron implementation of the platform API
    types.ts              platform abstraction for a future web version
  types/                  Shared models and IPC channel names
  utils/                  Renderer helpers
assets/                   Electron packaging icons
```

React components call generic platform functions such as `selectImages()`,
`selectWatermark()`, `selectOutputFolder()`, and `processImages()`. Electron-specific
filesystem and dialog behavior stays behind the preload bridge and IPC handlers, so a future
browser implementation can replace the platform layer without rewriting the UI.

## Development

Install dependencies:

```sh
npm install
```

Run the app:

```sh
npm run dev
```

Check the code:

```sh
npm run typecheck
npm run lint
```

Build the app:

```sh
npm run build
```

Package for macOS or Windows:

```sh
npm run build:mac
npm run build:win
```

## Security

- `contextIsolation` is enabled
- Renderer `nodeIntegration` is disabled
- The renderer receives only a small `window.levelMark` API
- Images are processed locally through IPC; no remote scripts or uploads are used
- File type checks are based on supported image extensions before import/preview/export

## Notes

- HEIC/HEIF support depends on the `sharp`/libvips build available on the target platform.
- The previous Swift/macOS implementation remains in `Sources/` and related Swift project
  files as a feature reference during the migration. The active development and packaging path
  is now the Electron project described above.
