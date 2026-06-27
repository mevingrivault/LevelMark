#!/bin/bash
# Produit dist/LevelMark-<version>.dmg — installeur macOS professionnel.
# Utilise create-dmg (brew install create-dmg) pour la fenêtre drag-to-install.
set -euo pipefail

VERSION="1.0"
ROOT="$(cd "$(dirname "$0")" && pwd)"
APP="$ROOT/dist/LevelMark.app"
DMG_OUT="$ROOT/dist/LevelMark-${VERSION}.dmg"
ICNS="$ROOT/Resources/LevelMark.icns"

[ -d "$APP" ]   || { echo "✗  $APP introuvable — lancez d'abord make build"; exit 1; }
command -v create-dmg &>/dev/null || { echo "✗  create-dmg manquant : brew install create-dmg"; exit 1; }

echo "▶︎  Génération du fond DMG…"
BG="/tmp/LevelMark_bg_$$.png"
swift "$ROOT/Scripts/gen_dmg_background.swift" "$BG"
trap 'rm -f "$BG"' EXIT

echo "▶︎  Création du DMG…"
rm -f "$DMG_OUT"

create-dmg \
    --volname         "LevelMark" \
    --volicon         "$ICNS" \
    --background      "$BG" \
    --window-pos      300 150 \
    --window-size     580 320 \
    --icon-size       120 \
    --icon            "LevelMark.app" 145 155 \
    --app-drop-link   435 155 \
    --no-internet-enable \
    --hdiutil-quiet \
    "$DMG_OUT" \
    "$APP" \
    2>&1 | grep -v "^$" | grep -v "^hdiutil" || true

SIZE=$(du -sh "$DMG_OUT" | cut -f1)
echo ""
echo "✓  dist/LevelMark-${VERSION}.dmg  ($SIZE)"
echo "   → Double-cliquez le DMG puis glissez LevelMark dans Applications."
