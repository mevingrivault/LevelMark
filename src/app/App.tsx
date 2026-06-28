import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Download, FolderOpen, Images, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { BottomBar } from "../components/BottomBar";
import { ImageList } from "../components/ImageList";
import { PreviewPane } from "../components/PreviewPane";
import { SettingsPanel } from "../components/SettingsPanel";
import { desktopPlatform } from "../platform/desktop/electronPlatform";
import type {
  DisplayImage,
  ExportSettings,
  ImageItem,
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
    const unsubscribe = desktopPlatform.onUpdateStatus(setUpdateStatus);
    const timer = window.setTimeout(() => {
      void desktopPlatform.checkForUpdates().then(setUpdateStatus).catch((error: unknown) => {
        setUpdateStatus({
          state: "error",
          message: error instanceof Error ? error.message : "Unable to check for updates."
        });
      });
    }, 3500);

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

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
    setImages((current) => current.map((image) => ({ ...image, status: "pending", error: undefined, outputPath: undefined })));

    try {
      const summary = await desktopPlatform.processImages({ images, watermark, rename, exportSettings });
      setLastSummary(`${summary.succeeded}/${summary.total} exported in ${(summary.elapsedMs / 1000).toFixed(1)}s`);
    } catch (error) {
      setLastSummary(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setIsProcessing(false);
    }
  }, [exportSettings, images, rename, watermark]);

  const canExport = images.length > 0 && Boolean(exportSettings.outputFolder) && !isProcessing;
  const progress = images.length === 0 ? 0 : processedCount / images.length;
  const updateLabel = useMemo(() => {
    switch (updateStatus.state) {
      case "checking":
        return "Checking...";
      case "available":
        return updateStatus.version ? `Downloading ${updateStatus.version}` : "Downloading update";
      case "downloading":
        return typeof updateStatus.percent === "number" ? `Downloading ${updateStatus.percent}%` : "Downloading update";
      case "downloaded":
        return updateStatus.version ? `${updateStatus.version} ready` : "Update ready";
      case "not-available":
        return "Up to date";
      case "error":
        return "Update failed";
      default:
        return "Check updates";
    }
  }, [updateStatus]);

  const updateTitle = updateStatus.message ?? updateLabel;
  const isUpdateBusy = ["checking", "available", "downloading"].includes(updateStatus.state);

  return (
    <div className="appShell" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
      <header className="titleBar">
        <div>
          <h1>LevelMark</h1>
          <p>Local batch watermarking, renaming, and WebP export</p>
        </div>
        <div className="titleActions">
          <div className={`updateBadge ${updateStatus.state}`} role="status" title={updateTitle}>
            <button
              className="updateBadgeButton"
              type="button"
              onClick={handleCheckUpdates}
              disabled={isUpdateBusy}
              title="Check for updates"
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
              <button className="updateRestartButton" type="button" onClick={handleInstallUpdate} title="Restart and install">
                <RotateCcw size={14} />
                <span>Restart</span>
              </button>
            )}
          </div>
          <button className="button secondary" type="button" onClick={handleImport}>
            <Images size={17} />
            Import
          </button>
          <button
            className="button ghost danger"
            type="button"
            disabled={images.length === 0 || isProcessing}
            onClick={() => {
              setImages([]);
              setSelectedId(undefined);
              setLastSummary(undefined);
            }}
          >
            <Trash2 size={17} />
            Clear
          </button>
        </div>
      </header>

      <main className="workspace">
        <ImageList
          images={images}
          selectedId={selectedImage?.id}
          isProcessing={isProcessing}
          onImport={handleImport}
          onSelect={setSelectedId}
        />

        <PreviewPane
          image={selectedImage}
          preview={selectedPreview}
          watermark={watermark}
          watermarkPreview={watermarkPreview}
          rename={rename}
          imageIndex={selectedImage ? images.findIndex((image) => image.id === selectedImage.id) : 0}
        />

        <SettingsPanel
          watermark={watermark}
          rename={rename}
          exportSettings={exportSettings}
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
        blockedReason={
          images.length === 0
            ? "Import images to start"
            : exportSettings.outputFolder
              ? undefined
              : "Choose an output folder"
        }
        onExport={handleExport}
      />

      {lastSummary && (
        <div className="toast" role="status">
          {lastSummary.includes("exported") ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
          <span>{lastSummary}</span>
          {exportSettings.outputFolder && <FolderOpen size={16} />}
        </div>
      )}


      <div className="dropHint">Drop images or folders anywhere in the window</div>
    </div>
  );
}

