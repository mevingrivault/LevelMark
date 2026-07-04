import { FolderOpen, Play } from "lucide-react";
import type { Translation } from "../i18n";
import type { ExportFormat } from "../types/models";

interface BottomBarProps {
  canExport: boolean;
  progress: number;
  isProcessing: boolean;
  outputFolder?: string;
  format: ExportFormat;
  summary?: string;
  blockedReason?: string;
  t: Translation;
  onExport(): void;
  onOpenOutputFolder(): void;
}

export function BottomBar({
  canExport,
  progress,
  isProcessing,
  outputFolder,
  format,
  summary,
  blockedReason,
  t,
  onExport,
  onOpenOutputFolder
}: BottomBarProps): JSX.Element {
  return (
    <footer className="bottomBar">
      <div className="progressBlock">
        <div className="progressMeta">
          <span>{isProcessing ? t.bottom.exporting : (summary ?? blockedReason ?? t.bottom.ready)}</span>
          <strong>{Math.round(progress * 100)}%</strong>
        </div>
        <div className="progressTrack">
          <div className="progressFill" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </div>

      <div className="bottomOutput">{outputFolder ?? t.bottom.noOutputFolder}</div>

      <div className="bottomActions">
        <button className="button primary" type="button" disabled={!canExport} onClick={onExport}>
          <Play size={17} />
          {t.bottom.exportAs(format === "jpeg" ? "JPEG" : "WebP")}
        </button>
        <button
          className="button secondary"
          type="button"
          disabled={!outputFolder}
          onClick={onOpenOutputFolder}
          title={t.bottom.openOutputFolder}
        >
          <FolderOpen size={16} />
          {t.bottom.openOutputFolder}
        </button>
      </div>
    </footer>
  );
}
