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
    images: {
      title: "Images",
      imported: (count: number) => `${count} imported`,
      importTitle: "Import images",
      emptyTitle: "Select or drop images",
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
      summary: "Watermark · Rename · Export",
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
      export: "Export",
      chooseOutputFolder: "Choose output folder",
      webpQuality: "WebP quality",
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
      dropHint: "Déposez des images ou dossiers n'importe où dans la fenêtre"
    },
    updates: {
      check: "Mises à jour",
      checking: "Vérification...",
      downloadingUpdate: "Téléchargement",
      downloadingVersion: (version: string) => `Téléchargement ${version}`,
      downloadingPercent: (percent: number) => `Téléchargement ${percent}%`,
      ready: "Mise à jour prête",
      readyVersion: (version: string) => `${version} prête`,
      upToDate: "À jour",
      failed: "Échec mise à jour",
      restart: "Redémarrer",
      checkTitle: "Vérifier les mises à jour",
      restartTitle: "Redémarrer et installer",
      errorFallback: "Impossible de vérifier les mises à jour."
    },
    bottom: {
      exporting: "Export du lot en cours",
      ready: "Prêt à exporter",
      noOutputFolder: "Aucun dossier de sortie sélectionné",
      exportWebp: "Exporter en WebP",
      importImagesToStart: "Importez des images pour commencer",
      chooseOutputFolder: "Choisissez un dossier de sortie"
    },
    images: {
      title: "Images",
      imported: (count: number) => `${count} importée${count > 1 ? "s" : ""}`,
      importTitle: "Importer des images",
      emptyTitle: "Sélectionnez ou déposez des images",
      formats: "JPG, PNG, HEIC, WebP, TIFF, GIF, BMP",
      status: {
        pending: "en attente",
        processing: "en cours",
        done: "terminé",
        failed: "échec",
        skipped: "ignoré"
      }
    },
    preview: {
      title: "Aperçu",
      noImageSelected: "Aucune image sélectionnée",
      selectedImageAlt: "Image sélectionnée",
      empty: "Importez une image pour prévisualiser le watermark"
    },
    settings: {
      title: "Réglages",
      summary: "Watermark · Renommage · Export",
      watermark: "Watermark",
      changeWatermark: "Changer le watermark",
      selectWatermark: "Sélectionner un watermark",
      position: "Position",
      margin: "Marge",
      opacity: "Opacité",
      scale: "Échelle",
      repeatedWatermark: "Watermark répété",
      rename: "Renommage",
      pattern: "Modèle",
      prefix: "Préfixe",
      suffix: "Suffixe",
      start: "Départ",
      padding: "Chiffres",
      tokens: "Variables :",
      export: "Export",
      chooseOutputFolder: "Choisir le dossier de sortie",
      webpQuality: "Qualité WebP",
      resizeBeforeExport: "Redimensionner avant export",
      maxWidth: "Largeur max",
      maxHeight: "Hauteur max",
      overwriteExisting: "Autoriser l'écrasement des exports existants",
      positions: {
        "top-left": "Haut gauche",
        "top-right": "Haut droite",
        "bottom-left": "Bas gauche",
        "bottom-right": "Bas droite",
        center: "Centre"
      }
    },
    exportResult: {
      success: (succeeded: number, total: number, seconds: string) => `${succeeded}/${total} exportées en ${seconds}s`,
      failed: "Échec de l'export."
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
