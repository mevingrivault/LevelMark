import type { Locale } from "./types/models";

export const translations = {
  en: {
    app: {
      subtitle: "Local batch watermarking, renaming, and WebP export",
      import: "Import",
      clear: "Clear",
      language: "Language",
      dropHint: "Drop images or folders anywhere in the window"
    },
    updates: {
      check: "Check updates",
      checking: "Checking...",
      downloadingUpdate: "Downloading update",
      downloadingVersion: (version: string) => `Downloading ${version}`,
      downloadingPercent: (percent: number) => `Downloading ${percent}%`,
      ready: "Update ready",
      readyVersion: (version: string) => `${version} ready`,
      upToDate: "Up to date",
      failed: "Update failed",
      restart: "Restart",
      checkTitle: "Check for updates",
      restartTitle: "Restart and install",
      errorFallback: "Unable to check for updates."
    },
    bottom: {
      exporting: "Exporting batch",
      ready: "Ready to export",
      noOutputFolder: "No output folder selected",
      exportWebp: "Export WebP",
      importImagesToStart: "Import images to start",
      chooseOutputFolder: "Choose an output folder"
    },

    profiles: {
      title: "Profiles",
      select: "Profile",
      noProfile: "No profile selected",
      save: "Save",
      import: "Import profile",
      export: "Export profile",
      delete: "Delete profile",
      defaultName: "New profile",
      namePrompt: "Profile name",
      deleteConfirm: "Delete this profile?"
    },

    images: {
      title: "Images",
      imported: (count: number) => `${count} imported`,
      emptyTitle: "Click or drop images or folders here",
      formats: "JPG, PNG, HEIC, WebP, TIFF, GIF, BMP",
      status: {
        pending: "pending",
        processing: "processing",
        done: "done",
        failed: "failed",
        skipped: "skipped"
      }
    },
    preview: {
      title: "Preview",
      noImageSelected: "No image selected",
      selectedImageAlt: "Selected image",
      empty: "Import an image to preview the watermark"
    },
    settings: {
      title: "Settings",
      summary: "Watermark \u00b7 Rename \u00b7 Export",
      resetSetting: (label: string) => `Reset ${label}`,
      watermark: "Watermark",
      changeWatermark: "Change watermark",
      selectWatermark: "Select watermark",
      position: "Position",
      margin: "Margin",
      opacity: "Opacity",
      scale: "Scale",
      repeatedWatermark: "Repeated watermark",
      rename: "Rename",
      pattern: "Pattern",
      prefix: "Prefix",
      suffix: "Suffix",
      start: "Start",
      padding: "Padding",
      tokens: "Tokens:",
      renameExample: "Example",
      renameExampleEmpty: "Import an image to preview the filename",
      renameTokens: {
        "{original}": "Original",
        "{counter}": "Counter",
        "{date}": "Date",
        "{prefix}": "Prefix",
        "{suffix}": "Suffix"
      },
      export: "Export",
      chooseOutputFolder: "Choose output folder",
      webpQuality: "WebP quality",
      removeMetadata: "Remove image metadata",
      resizeBeforeExport: "Resize before export",
      maxWidth: "Max width",
      maxHeight: "Max height",
      overwriteExisting: "Allow overwriting existing exports",
      positions: {
        "top-left": "Top left",
        "top-right": "Top right",
        "bottom-left": "Bottom left",
        "bottom-right": "Bottom right",
        center: "Center"
      }
    },
    exportResult: {
      success: (succeeded: number, total: number, seconds: string) => `${succeeded}/${total} exported in ${seconds}s`,
      failed: "Export failed."
    }
  },
  fr: {
    app: {
      subtitle: "Traitement local par lot : watermark, renommage et export WebP",
      import: "Importer",
      clear: "Effacer",
      language: "Langue",
      dropHint: "D\u00e9posez des images ou dossiers n'importe o\u00f9 dans la fen\u00eatre"
    },
    updates: {
      check: "Mises \u00e0 jour",
      checking: "V\u00e9rification...",
      downloadingUpdate: "T\u00e9l\u00e9chargement",
      downloadingVersion: (version: string) => `T\u00e9l\u00e9chargement ${version}`,
      downloadingPercent: (percent: number) => `T\u00e9l\u00e9chargement ${percent}%`,
      ready: "Mise \u00e0 jour pr\u00eate",
      readyVersion: (version: string) => `${version} pr\u00eate`,
      upToDate: "\u00c0 jour",
      failed: "\u00c9chec mise \u00e0 jour",
      restart: "Red\u00e9marrer",
      checkTitle: "V\u00e9rifier les mises \u00e0 jour",
      restartTitle: "Red\u00e9marrer et installer",
      errorFallback: "Impossible de v\u00e9rifier les mises \u00e0 jour."
    },
    bottom: {
      exporting: "Export du lot en cours",
      ready: "Pr\u00eat \u00e0 exporter",
      noOutputFolder: "Aucun dossier de sortie s\u00e9lectionn\u00e9",
      exportWebp: "Exporter en WebP",
      importImagesToStart: "Importez des images pour commencer",
      chooseOutputFolder: "Choisissez un dossier de sortie"
    },

    profiles: {
      title: "Profils",
      select: "Profil",
      noProfile: "Aucun profil s\u00e9lectionn\u00e9",
      save: "Enregistrer",
      import: "Importer un profil",
      export: "Exporter le profil",
      delete: "Supprimer le profil",
      defaultName: "Nouveau profil",
      namePrompt: "Nom du profil",
      deleteConfirm: "Supprimer ce profil ?"
    },
    images: {
      title: "Images",
      imported: (count: number) => `${count} import\u00e9e${count > 1 ? "s" : ""}`,
      emptyTitle: "Cliquez ou d\u00e9posez des images ou dossiers ici",
      formats: "JPG, PNG, HEIC, WebP, TIFF, GIF, BMP",
      status: {
        pending: "en attente",
        processing: "en cours",
        done: "termin\u00e9",
        failed: "\u00e9chec",
        skipped: "ignor\u00e9"
      }
    },
    preview: {
      title: "Aper\u00e7u",
      noImageSelected: "Aucune image s\u00e9lectionn\u00e9e",
      selectedImageAlt: "Image s\u00e9lectionn\u00e9e",
      empty: "Importez une image pour pr\u00e9visualiser le watermark"
    },
    settings: {
      title: "R\u00e9glages",
      summary: "Watermark \u00b7 Renommage \u00b7 Export",
      resetSetting: (label: string) => `R\u00e9initialiser ${label}`,
      watermark: "Watermark",
      changeWatermark: "Changer le watermark",
      selectWatermark: "S\u00e9lectionner un watermark",
      position: "Position",
      margin: "Marge",
      opacity: "Opacit\u00e9",
      scale: "\u00c9chelle",
      repeatedWatermark: "Watermark r\u00e9p\u00e9t\u00e9",
      rename: "Renommage",
      pattern: "Mod\u00e8le",
      prefix: "Pr\u00e9fixe",
      suffix: "Suffixe",
      start: "D\u00e9part",
      padding: "Chiffres",
      tokens: "Variables :",
      renameExample: "Exemple",
      renameExampleEmpty: "Importez une image pour pr\u00e9visualiser le nom",
      renameTokens: {
        "{original}": "Original",
        "{counter}": "Compteur",
        "{date}": "Date",
        "{prefix}": "Pr\u00e9fixe",
        "{suffix}": "Suffixe"
      },
      export: "Export",
      chooseOutputFolder: "Choisir le dossier de sortie",
      webpQuality: "Qualit\u00e9 WebP",
      removeMetadata: "Retirer les m\u00e9tadonn\u00e9es de l'image",
      resizeBeforeExport: "Redimensionner avant export",
      maxWidth: "Largeur max",
      maxHeight: "Hauteur max",
      overwriteExisting: "Autoriser l'\u00e9crasement des exports existants",
      positions: {
        "top-left": "Haut gauche",
        "top-right": "Haut droite",
        "bottom-left": "Bas gauche",
        "bottom-right": "Bas droite",
        center: "Centre"
      }
    },
    exportResult: {
      success: (succeeded: number, total: number, seconds: string) => `${succeeded}/${total} export\u00e9es en ${seconds}s`,
      failed: "\u00c9chec de l'export."
    }
  }
} as const;

export type Translation = (typeof translations)[Locale];

export function getInitialLocale(): Locale {
  const stored = window.localStorage.getItem("levelmark.locale");
  if (stored === "en" || stored === "fr") {
    return stored;
  }

  return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
}
