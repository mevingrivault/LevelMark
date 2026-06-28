import type { App, Dialog, IpcMain } from "electron";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { channels } from "../../src/types/channels";
import type { ExportSettings, ProfileSettings, SaveProfileRequest, UserProfile, WatermarkPosition } from "../../src/types/models";

interface ProfileIpcDependencies {
  app: App;
  dialog: Dialog;
  ipcMain: IpcMain;
}

const watermarkPositions = new Set<WatermarkPosition>(["top-left", "top-right", "bottom-left", "bottom-right", "center"]);

function profilesPath(app: App): string {
  return path.join(app.getPath("userData"), "profiles.json");
}

async function readProfiles(app: App): Promise<UserProfile[]> {
  const filePath = profilesPath(app);
  const raw = await fs.readFile(filePath, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") {
      return "[]";
    }

    throw error;
  });

  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.map(normalizeImportedProfile).filter((profile): profile is UserProfile => profile !== undefined);
}

async function writeProfiles(app: App, profiles: UserProfile[]): Promise<void> {
  const filePath = profilesPath(app);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, `${JSON.stringify(profiles, null, 2)}\n`, "utf8");
  await fs.rename(tmpPath, filePath);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function sanitizeProfileName(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 80) : "Profile";
}

function normalizeSettings(value: unknown): ProfileSettings | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const watermarkInput = isRecord(value.watermark) ? value.watermark : {};
  const renameInput = isRecord(value.rename) ? value.rename : {};
  const exportInput = isRecord(value.exportSettings) ? value.exportSettings : {};
  const position = watermarkPositions.has(watermarkInput.position as WatermarkPosition)
    ? (watermarkInput.position as WatermarkPosition)
    : "bottom-right";

  const exportSettings: ExportSettings = {
    outputFolder: stringValue(exportInput.outputFolder) || undefined,
    quality: Math.min(100, Math.max(1, Math.round(numberValue(exportInput.quality, 82)))),
    resizeEnabled: booleanValue(exportInput.resizeEnabled, false),
    maxWidth: numberValue(exportInput.maxWidth, 2000),
    maxHeight: numberValue(exportInput.maxHeight, 2000),
    overwriteExisting: booleanValue(exportInput.overwriteExisting, false)
  };

  return {
    watermark: {
      imagePath: stringValue(watermarkInput.imagePath) || undefined,
      position,
      margin: Math.max(0, Math.round(numberValue(watermarkInput.margin, 40))),
      opacity: Math.min(1, Math.max(0.05, numberValue(watermarkInput.opacity, 0.85))),
      scalePercent: Math.min(80, Math.max(5, Math.round(numberValue(watermarkInput.scalePercent, 20)))),
      tiled: booleanValue(watermarkInput.tiled, false)
    },
    rename: {
      pattern: stringValue(renameInput.pattern, "{original}-watermarked"),
      prefix: stringValue(renameInput.prefix),
      suffix: stringValue(renameInput.suffix),
      startCounter: Math.max(0, Math.round(numberValue(renameInput.startCounter, 1))),
      counterPadding: Math.min(8, Math.max(0, Math.round(numberValue(renameInput.counterPadding, 3))))
    },
    exportSettings
  };
}

function normalizeImportedProfile(value: unknown): UserProfile | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const settings = normalizeSettings(value.settings ?? value);
  if (!settings) {
    return undefined;
  }

  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    name: sanitizeProfileName(stringValue(value.name, "Imported profile")),
    createdAt: now,
    updatedAt: now,
    settings
  };
}

function normalizeSavedProfile(request: SaveProfileRequest, previous?: UserProfile): UserProfile {
  const now = new Date().toISOString();
  return {
    id: previous?.id ?? request.id ?? randomUUID(),
    name: sanitizeProfileName(request.name),
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
    settings: normalizeSettings(request.settings) ?? request.settings
  };
}

export function registerProfileIpc({ app, dialog, ipcMain }: ProfileIpcDependencies): void {
  ipcMain.handle(channels.listProfiles, () => readProfiles(app));

  ipcMain.handle(channels.saveProfile, async (_event, request: SaveProfileRequest): Promise<UserProfile[]> => {
    const profiles = await readProfiles(app);
    const index = request.id ? profiles.findIndex((profile) => profile.id === request.id) : -1;
    const profile = normalizeSavedProfile(request, index >= 0 ? profiles[index] : undefined);

    if (index >= 0) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }

    await writeProfiles(app, profiles);
    return profiles;
  });

  ipcMain.handle(channels.deleteProfile, async (_event, profileId: string): Promise<UserProfile[]> => {
    const profiles = (await readProfiles(app)).filter((profile) => profile.id !== profileId);
    await writeProfiles(app, profiles);
    return profiles;
  });

  ipcMain.handle(channels.importProfiles, async (): Promise<UserProfile[]> => {
    const result = await dialog.showOpenDialog({
      title: "Import profiles",
      properties: ["openFile"],
      filters: [{ name: "LevelMark profiles", extensions: ["json"] }]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return readProfiles(app);
    }

    const raw = await fs.readFile(result.filePaths[0], "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const imported = (Array.isArray(parsed) ? parsed : [parsed])
      .map(normalizeImportedProfile)
      .filter((profile): profile is UserProfile => profile !== undefined);

    if (imported.length === 0) {
      return readProfiles(app);
    }

    const profiles = [...(await readProfiles(app)), ...imported];
    await writeProfiles(app, profiles);
    return profiles;
  });

  ipcMain.handle(channels.exportProfile, async (_event, profileId: string): Promise<void> => {
    const profile = (await readProfiles(app)).find((candidate) => candidate.id === profileId);
    if (!profile) {
      return;
    }

    const result = await dialog.showSaveDialog({
      title: "Export profile",
      defaultPath: `${profile.name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")}.json`,
      filters: [{ name: "LevelMark profile", extensions: ["json"] }]
    });

    if (!result.canceled && result.filePath) {
      await fs.writeFile(result.filePath, `${JSON.stringify(profile, null, 2)}\n`, "utf8");
    }
  });
}
