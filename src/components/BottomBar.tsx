import { Play } from "lucide-react";

interface BottomBarProps {
  canExport: boolean;
  progress: number;
  isProcessing: boolean;
  outputFolder?: string;
  summary?: string;
  blockedReason?: string;
  onExport(): void;
}

export function BottomBar({
  canExport,
  progress,
  isProcessing,
  outputFolder,
  summary,
  blockedReason,
  onExport
}: BottomBarProps): JSX.Element {
  return (
    <footer className="bottomBar">
      <div className="progressBlock">
        <div className="progressMeta">
          <span>{isProcessing ? "Exporting batch" : (summary ?? blockedReason ?? "Ready to export")}</span>
          <strong>{Math.round(progress * 100)}%</strong>
        </div>
        <div className="progressTrack">
          <div className="progressFill" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </div>

      <div className="bottomOutput">{outputFolder ?? "No output folder selected"}</div>

      <button className="button primary" type="button" disabled={!canExport} onClick={onExport}>
        <Play size={17} />
        Export WebP
      </button>
    </footer>
  );
}
