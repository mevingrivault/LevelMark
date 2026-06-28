import { app, BrowserWindow, dialog, ipcMain, Menu } from "electron";
import type { MenuItemConstructorOptions } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerImageIpc } from "./ipc/images";
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
              { role: "about" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" }
            ]
          } satisfies MenuItemConstructorOptions
        ]
      : []),
    {
      label: menuLabel("File", "Fichier"),
      submenu: [{ role: process.platform === "darwin" ? "close" : "quit" }]
    },
    {
      label: menuLabel("Edit", "Édition"),
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" }
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
              label: "Français",
              type: "radio",
              checked: currentLocale === "fr",
              click: () => setApplicationLocale("fr", true)
            }
          ]
        },
        { type: "separator" },
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    },
    {
      label: menuLabel("Help", "Aide"),
      submenu: [
        {
          label: menuLabel("Check for Updates", "Rechercher les mises à jour"),
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
  registerImageIpc({ dialog, ipcMain });
  registerUpdateIpc({ getWindow: () => mainWindow, ipcMain });
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
