import { app, BrowserWindow, dialog, ipcMain, Menu } from "electron";
import type { MenuItemConstructorOptions } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerImageIpc } from "./ipc/images";
import { registerProfileIpc } from "./ipc/profiles";
import { registerUpdateIpc, requestUpdateCheck } from "./ipc/updates";
import { channels } from "../src/types/channels";
import type { Locale } from "../src/types/models";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | undefined;
let currentLocale: Locale = app.getLocale().toLowerCase().startsWith("fr") ? "fr" : "en";

function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "fr";
}

function setApplicationLocale(locale: Locale, notifyRenderer: boolean): void {
  currentLocale = locale;
  createApplicationMenu();

  if (notifyRenderer) {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(channels.localeChanged, locale);
    });
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1060,
    minHeight: 680,
    title: "LevelMark",
    backgroundColor: "#f6f7f8",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

function menuLabel(en: string, fr: string): string {
  return currentLocale === "fr" ? fr : en;
}

function createApplicationMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    ...(process.platform === "darwin"
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about", label: menuLabel("About LevelMark", "\u00c0 propos de LevelMark") },
              { type: "separator" },
              { role: "hide", label: menuLabel("Hide LevelMark", "Masquer LevelMark") },
              { role: "hideOthers", label: menuLabel("Hide Others", "Masquer les autres") },
              { role: "unhide", label: menuLabel("Show All", "Tout afficher") },
              { type: "separator" },
              { role: "quit", label: menuLabel("Quit LevelMark", "Quitter LevelMark") }
            ]
          } satisfies MenuItemConstructorOptions
        ]
      : []),
    {
      label: menuLabel("File", "Fichier"),
      submenu: [
        {
          role: process.platform === "darwin" ? "close" : "quit",
          label: process.platform === "darwin" ? menuLabel("Close", "Fermer") : menuLabel("Quit", "Quitter")
        }
      ]
    },
    {
      label: menuLabel("Edit", "\u00c9dition"),
      submenu: [
        { role: "undo", label: menuLabel("Undo", "Annuler") },
        { role: "redo", label: menuLabel("Redo", "R\u00e9tablir") },
        { type: "separator" },
        { role: "cut", label: menuLabel("Cut", "Couper") },
        { role: "copy", label: menuLabel("Copy", "Copier") },
        { role: "paste", label: menuLabel("Paste", "Coller") },
        { role: "selectAll", label: menuLabel("Select All", "Tout s\u00e9lectionner") }
      ]
    },
    {
      label: menuLabel("View", "Affichage"),
      submenu: [
        {
          label: menuLabel("Language", "Langue"),
          submenu: [
            {
              label: "English",
              type: "radio",
              checked: currentLocale === "en",
              click: () => setApplicationLocale("en", true)
            },
            {
              label: "Fran\u00e7ais",
              type: "radio",
              checked: currentLocale === "fr",
              click: () => setApplicationLocale("fr", true)
            }
          ]
        },
        { type: "separator" },
        { role: "reload", label: menuLabel("Reload", "Recharger") },
        { role: "forceReload", label: menuLabel("Force Reload", "Forcer le rechargement") },
        { role: "toggleDevTools", label: menuLabel("Toggle Developer Tools", "Outils de d\u00e9veloppement") },
        { type: "separator" },
        { role: "resetZoom", label: menuLabel("Actual Size", "Taille r\u00e9elle") },
        { role: "zoomIn", label: menuLabel("Zoom In", "Zoom avant") },
        { role: "zoomOut", label: menuLabel("Zoom Out", "Zoom arri\u00e8re") },
        { type: "separator" },
        { role: "togglefullscreen", label: menuLabel("Toggle Full Screen", "Plein \u00e9cran") }
      ]
    },
    {
      label: menuLabel("Help", "Aide"),
      submenu: [
        {
          label: menuLabel("Check for Updates", "Rechercher les mises \u00e0 jour"),
          click: () => {
            void requestUpdateCheck();
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  registerImageIpc({ dialog, ipcMain, getLocale: () => currentLocale });
  registerUpdateIpc({ getWindow: () => mainWindow, ipcMain });
  registerProfileIpc({ app, dialog, ipcMain });
  ipcMain.handle(channels.setLocale, (_event, locale: unknown) => {
    if (isLocale(locale)) {
      setApplicationLocale(locale, false);
    }
  });
  createApplicationMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
