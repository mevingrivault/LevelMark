import type { BrowserWindow, IpcMain } from "electron";
import { app } from "electron";
import { autoUpdater } from "electron-updater";
import { channels } from "../../src/types/channels";
import type { UpdateStatus } from "../../src/types/models";

interface UpdateIpcDependencies {
  getWindow(): BrowserWindow | undefined;
  ipcMain: IpcMain;
}

let currentStatus: UpdateStatus = { state: "idle" };
let updateDownloaded = false;
let updateCheckInProgress = false;
let activeGetWindow: (() => BrowserWindow | undefined) | undefined;

function publishStatus(getWindow: () => BrowserWindow | undefined, status: UpdateStatus): UpdateStatus {
  currentStatus = status;
  getWindow()?.webContents.send(channels.updateStatus, status);
  return status;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to check for updates.";
}

export async function requestUpdateCheck(): Promise<UpdateStatus> {
  const getWindow = activeGetWindow ?? (() => undefined);

  if (!app.isPackaged) {
    return publishStatus(getWindow, {
      state: "not-available",
      message: "Updates are available in the installed app."
    });
  }

  if (updateDownloaded || updateCheckInProgress) {
    return currentStatus;
  }

  updateCheckInProgress = true;
  publishStatus(getWindow, { state: "checking", message: "Checking for updates..." });

  try {
    await autoUpdater.checkForUpdates();
    return currentStatus;
  } catch (error) {
    updateCheckInProgress = false;
    return publishStatus(getWindow, { state: "error", message: errorMessage(error) });
  }
}

export function registerUpdateIpc({ getWindow, ipcMain }: UpdateIpcDependencies): void {
  activeGetWindow = getWindow;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    publishStatus(getWindow, { state: "checking", message: "Checking for updates..." });
  });

  autoUpdater.on("update-available", (info) => {
    publishStatus(getWindow, {
      state: "available",
      version: info.version,
      message: `Downloading LevelMark ${info.version}...`
    });
  });

  autoUpdater.on("update-not-available", (info) => {
    updateCheckInProgress = false;
    publishStatus(getWindow, {
      state: "not-available",
      version: info.version,
      message: "LevelMark is up to date."
    });
  });

  autoUpdater.on("download-progress", (progress) => {
    publishStatus(getWindow, {
      state: "downloading",
      percent: Math.round(progress.percent),
      message: `Downloading update ${Math.round(progress.percent)}%`
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    updateDownloaded = true;
    updateCheckInProgress = false;
    publishStatus(getWindow, {
      state: "downloaded",
      version: info.version,
      message: `LevelMark ${info.version} is ready to install.`
    });
  });

  autoUpdater.on("error", (error) => {
    updateCheckInProgress = false;
    publishStatus(getWindow, { state: "error", message: errorMessage(error) });
  });

  ipcMain.handle(channels.checkForUpdates, () => requestUpdateCheck());

  ipcMain.handle(channels.installUpdate, async (): Promise<void> => {
    if (updateDownloaded) {
      autoUpdater.quitAndInstall(false, true);
    }
  });
}
