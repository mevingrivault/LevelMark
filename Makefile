# LevelMark — developer convenience targets
# ─────────────────────────────────────────
#   make              → build (release)
#   make open         → build + launch
#   make install      → build + installer dans /Applications
#   make uninstall    → supprimer de /Applications
#   make dmg          → créer dist/LevelMark-1.0.dmg
#   make clean        → supprimer les artefacts

APP_NAME   = LevelMark
VERSION    = 1.0
APP_BUNDLE = dist/$(APP_NAME).app
DMG        = dist/$(APP_NAME)-$(VERSION).dmg
INSTALL    = /Applications/$(APP_NAME).app

.PHONY: all build open install uninstall dmg clean

all: build

build:
	@./build.sh release

open: build
	@open "$(APP_BUNDLE)"

install: build
	@echo "▶︎  Installation dans /Applications…"
	@rm -rf "$(INSTALL)"
	@cp -R "$(APP_BUNDLE)" "$(INSTALL)"
	@echo "✓  $(APP_NAME) installé — lancez-le depuis Launchpad ou Spotlight."

uninstall:
	@rm -rf "$(INSTALL)"
	@echo "✓  $(APP_NAME) désinstallé."

dmg: build
	@./package_dmg.sh

clean:
	@rm -rf .build dist
	@echo "✓  Artefacts supprimés."
