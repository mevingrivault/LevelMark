#!/bin/bash
# Builds LevelMark and assembles a runnable macOS .app bundle.
#
# Usage:  ./build.sh [debug|release]      (default: release)
set -euo pipefail

CONFIG="${1:-release}"
APP_NAME="LevelMark"
BUNDLE_NAME="LevelMark.app"
ROOT="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$ROOT/dist"
APP="$BUILD_DIR/$BUNDLE_NAME"

echo "▶︎ Compiling ($CONFIG)…"
swift build -c "$CONFIG"

BIN_PATH="$(swift build -c "$CONFIG" --show-bin-path)"

echo "▶︎ Assembling app bundle…"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"

cp "$BIN_PATH/$APP_NAME" "$APP/Contents/MacOS/$APP_NAME"
cp "$ROOT/Resources/Info.plist" "$APP/Contents/Info.plist"
# App icon
if [ -f "$ROOT/Resources/LevelMark.icns" ]; then
    cp "$ROOT/Resources/LevelMark.icns" "$APP/Contents/Resources/LevelMark.icns"
fi

# libwebp dylibs from Homebrew are needed at runtime. We copy them into the
# bundle and rewrite the binary's load paths so the app is self-contained.
BREW_LIB=""
for p in /opt/homebrew/lib /usr/local/lib; do
    [ -d "$p" ] && BREW_LIB="$p" && break
done

if [ -n "$BREW_LIB" ]; then
    FRW="$APP/Contents/Frameworks"
    mkdir -p "$FRW"
    for lib in libwebp.7.dylib libwebpmux.3.dylib libsharpyuv.0.dylib; do
        if [ -f "$BREW_LIB/$lib" ]; then
            cp "$BREW_LIB/$lib" "$FRW/"
            chmod u+w "$FRW/$lib"
        fi
    done
    # Point the executable and the dylibs at the bundled copies.
    BIN="$APP/Contents/MacOS/$APP_NAME"
    install_name_tool -add_rpath "@executable_path/../Frameworks" "$BIN" 2>/dev/null || true
    for old in $(otool -L "$BIN" | awk '/libwebp|libwebpmux|libsharpyuv/ {print $1}'); do
        base="$(basename "$old")"
        install_name_tool -change "$old" "@rpath/$base" "$BIN" 2>/dev/null || true
    done
    # Fix inter-dylib references too (libwebpmux -> libwebp -> libsharpyuv).
    for lib in "$FRW"/*.dylib; do
        install_name_tool -id "@rpath/$(basename "$lib")" "$lib" 2>/dev/null || true
        for old in $(otool -L "$lib" | awk '/libwebp|libsharpyuv/ {print $1}'); do
            install_name_tool -change "$old" "@rpath/$(basename "$old")" "$lib" 2>/dev/null || true
        done
    done
fi

# Ad-hoc codesign so Gatekeeper lets it launch locally.
codesign --force --deep --sign - "$APP" 2>/dev/null || echo "  (codesign skipped)"

echo "✓ Built: $APP"
echo "  Run with:  open \"$APP\""
