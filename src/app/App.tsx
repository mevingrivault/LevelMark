import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Download, FolderOpen, Images, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { BottomBar } from "../components/BottomBar";
import { ImageList } from "../components/ImageList";
import { PreviewPane } from "../components/PreviewPane";
import { SettingsPanel } from "../components/SettingsPanel";
import { desktopPlatform } from "../platform/desktop/electronPlatform";
import { getInitialLocale, translations } from "../i18n";
import type {
  DisplayImage,
  ExportSettings,
  ImageItem,
  Locale,
  ProcessProgress,
  RenameSettings,
  UpdateStatus,
  WatermarkSettings
} from "../types/models";
import { defaultExport, defaultRename, defaultWatermark } from "./defaults";

export function App(): JSX.Element {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [selectedPreview, setSelectedPreview] = useState<DisplayImage>();
  const [watermarkPreview, setWatermarkPreview] = useState<DisplayImage>();
  const [watermark, setWatermark] = useState<WatermarkSettings>(defaultWatermark);
  const [rename, setRename] = useState<RenameSettings>(defaultRename);
  const [exportSettings, setExportSettings] = useState<ExportSettings>(defaultExport);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [lastSummary, setLastSummary] = useState<string>();
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ state: "idle" });
  const [locale, setLocale] = useState<Locale>(() => getInitialLocale());
  const [lastExportSucceeded, setLastExportSucceeded] = useState(false);

  const t = translations[locale];

  const selectedImage = useMemo(
    () => images.find((image) => image.id === selectedId) ?? images[0],
    [images, selectedId]
  );

  useEffect(() => {
    if (!selectedImage) {
      setSelectedPreview(undefined);
      return;
    }

    let cancelled = false;
    desktopPlatform
      .getDisplayImage(selectedImage.path)
      .then((image) => {
        if (!cancelled) {
          setSelectedPreview(image);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedPreview(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedImage]);

  useEffect(() => {
    if (!watermark.imagePath) {
      setWatermarkPreview(undefined);
      return;
    }

    let cancelled = false;
    desktopPlatform
      .getDisplayImage(watermark.imagePath, 900)
      .then((image) => {
        if (!cancelled) {
          setWatermarkPreview(image);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWatermarkPreview(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [watermark.imagePath]);

  useEffect(() => {
    return desktopPlatform.onProcessingProgress((progress: ProcessProgress) => {
      setImages((current) =>
        current.map((image) =>
          image.id === progress.id
            ? { ...image, status: progress.status, outputPath: progress.outputPath, error: progress.error }
            : image
        )
      );

      if (progress.status === "done" || progress.status === "failed") {
        setProcessedCount((count) => count + 1);
      }
    });
  }, []);

  useEffect(() => {
    window.localStorage.setItem("levelmark.locale", locale);
    void desktopPlatform.setLocale(locale);
  }, [locale]);

  useEffect(() => desktopPlatform.onLocaleChange(setLocale), []);

  useEffect(() => {
    const unsubscribe = desktopPlatform.onUpdateStatus(setUpdateStatus);
    const timer = window.setTimeout(() => {
      void desktopPlatform.checkForUpdates().then(setUpdateStatus).catch((error: unknown) => {
        setUpdateStatus({
          state: "error",
          message: error instanceof Error ? error.message : t.updates.errorFallback
        });
      });
    }, 3500);

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [t.updates.errorFallback]);

  const mergeImages = useCallback((incoming: ImageItem[]) => {
    setImages((current) => {
      const existingPaths = new Set(current.map((image) => image.path));
      const merged = [...current, ...incoming.filter((image) => !existingPaths.has(image.path))];
      setSelectedId((currentSelected) => currentSelected ?? merged[0]?.id);
      return merged;
    });
  }, []);

  const handleImport = useCallback(async () => {
    const imported = await desktopPlatform.selectImages();
    mergeImages(imported);
  }, [mergeImages]);

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const paths = Array.from(event.dataTransfer.files)
        .map((file) => desktopPlatform.getPathForFile(file))
        .filter(Boolean);

      if (paths.length > 0) {
        mergeImages(await desktopPlatform.importPaths(paths));
      }
    },
    [mergeImages]
  );

  const handleSelectWatermark = useCallback(async () => {
    const imagePath = await desktopPlatform.selectWatermark();
    if (imagePath) {
      setWatermark((current) => ({ ...current, imagePath }));
    }
  }, []);

  const handleSelectOutput = useCallback(async () => {
    const outputFolder = await desktopPlatform.selectOutputFolder();
    if (outputFolder) {
      setExportSettings((current) => ({ ...current, outputFolder }));
    }
  }, []);

  const handleCheckUpdates = useCallback(async () => {
    const status = await desktopPlatform.checkForUpdates();
    setUpdateStatus(status);
  }, []);

  const handleInstallUpdate = useCallback(() => {
    void desktopPlatform.installUpdate();
  }, []);

  const handleExport = useCallback(async () => {
    setIsProcessing(true);
    setProcessedCount(0);
    setLastSummary(undefined);
    setLastExportSucceeded(false);
    setImages((current) => current.map((image) => ({ ...image, status: "pending", error: undefined, outputPath: undefined })));

    try {
      const summary = await desktopPlatform.processImages({ images, watermark, rename, exportSettings });
      setLastExportSucceeded(true);
      setLastSummary(t.exportResult.success(summary.succeeded, summary.total, (summary.elapsedMs / 1000).toFixed(1)));
    } catch (error) {
      setLastExportSucceeded(false);
      setLastSummary(error instanceof Error ? error.message : t.exportResult.failed);
    } finally {
      setIsProcessing(false);
    }
  }, [exportSettings, images, rename, t.exportResult, watermark]);

  const canExport = images.length > 0 && Boolean(exportSettings.outputFolder) && !isProcessing;
  const progress = images.length === 0 ? 0 : processedCount / images.length;
  const updateLabel = useMemo(() => {
    switch (updateStatus.state) {
      case "checking":
        return t.updates.checking;
      case "available":
        return updateStatus.version ? t.updates.downloadingVersion(updateStatus.version) : t.updates.downloadingUpdate;
      case "downloading":
        return typeof updateStatus.percent === "number" ? t.updates.downloadingPercent(updateStatus.percent) : t.updates.downloadingUpdate;
      case "downloaded":
        return updateStatus.version ? t.updates.readyVersion(updateStatus.version) : t.updates.ready;
      case "not-available":
        return t.updates.upToDate;
      case "error":
        return t.updates.failed;
      default:
        return t.updates.check;
    }
  }, [t, updateStatus]);

  const updateTitle = updateStatus.message ?? updateLabel;
  const isUpdateBusy = ["checking", "available", "downloading"].includes(updateStatus.state);

  return (
    <div className="appShell" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
      <header className="titleBar">
        <div>
          <h1>LevelMark</h1>
          <p>{t.app.subtitle}</p>
        </div>
        <div className="titleActions">
          <div className={`updateBadge ${updateStatus.state}`} role="status" title={updateTitle}>
            <button
              className="updateBadgeButton"
              type="button"
              onClick={handleCheckUpdates}
              disabled={isUpdateBusy}
              title={t.updates.checkTitle}
            >
              {updateStatus.state === "error" ? (
                <CircleAlert size={15} />
              ) : updateStatus.state === "downloaded" ? (
                <Download size={15} />
              ) : (
                <RefreshCw size={15} />
              )}
              <span>{updateLabel}</span>
            </button>
            {updateStatus.state === "downloaded" && (
              <button className="updateRestartButton" type="button" onClick={handleInstallUpdate} title={t.updates.restartTitle}>
                <RotateCcw size={14} />
                <span>{t.updates.restart}</span>
              </button>
            )}
          </div>
          <button className="button secondary" type="button" onClick={handleImport}>
            <Images size={17} />
            {t.app.import}
          </button>
          <button
            className="button ghost danger"
            type="button"
            disabled={images.length === 0 || isProcessing}
            onClick={() => {
              setImages([]);
              setSelectedId(undefined);
              setLastSummary(undefined);
              setLastExportSucceeded(false);
            }}
          >
            <Trash2 size={17} />
            {t.app.clear}
          </button>
        </div>
      </header>

      <main className="workspace">
        <ImageList
          images={images}
          selectedId={selectedImage?.id}
          isProcessing={isProcessing}
          onImport={handleImport}
          t={t}
          onSelect={setSelectedId}
        />

        <PreviewPane
          image={selectedImage}
          preview={selectedPreview}
          watermark={watermark}
          watermarkPreview={watermarkPreview}
          rename={rename}
          imageIndex={selectedImage ? images.findIndex((image) => image.id === selectedImage.id) : 0}
          t={t}
        />

        <SettingsPanel
          watermark={watermark}
          rename={rename}
          exportSettings={exportSettings}
          t={t}
          onWatermarkChange={setWatermark}
          onRenameChange={setRename}
          onExportChange={setExportSettings}
          onSelectWatermark={handleSelectWatermark}
          onSelectOutput={handleSelectOutput}
        />
      </main>

      <BottomBar
        canExport={canExport}
        progress={progress}
        isProcessing={isProcessing}
        outputFolder={exportSettings.outputFolder}
        summary={lastSummary}
        blockedReason={images.length === 0 ? t.bottom.importImagesToStart : exportSettings.outputFolder ? undefined : t.bottom.chooseOutputFolder}
        t={t}
        onExport={handleExport}
      />

      {lastSummary && (
        <div className="toast" role="status">
          {lastExportSucceeded ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
          <span>{lastSummary}</span>
          {exportSettings.outputFolder && <FolderOpen size={16} />}
        </div>
      )}


      <div className="dropHint">{t.app.dropHint}</div>
    </div>
  );
}

